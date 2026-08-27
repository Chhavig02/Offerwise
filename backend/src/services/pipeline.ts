import { extractDocumentTextFromBuffer, normalizeExtractedText } from './documentService';
import { classifyDocument } from './classificationService';
import { extractWithGemini, GeminiModelAvailabilityError, GeminiRateLimitError } from '@/providers/ai/GeminiProvider';
import { extractWithGroq } from '@/providers/ai/GroqProvider';
import { extractOfferDataMock } from '@/providers/ai/mockAiProvider';
import { sanitizeExtractedData } from '@/providers/ai/sanitizeExtractedData';
import { validateEvidence } from './evidenceService';
import { runRulesEngine } from '@/rules/rulesEngine';
import { calculateScore, withScoreImpact } from './scoreService';
import { companyResearchService } from './companyResearch/companyResearchService';
import { CompanyResearchOutcome } from './companyResearch/types';
import { offerComparisonService } from './offerComparison/offerComparisonService';
import { OfferComparisonResult } from './offerComparison/types';
import { evaluateOfferDecision } from './decisionEngine/decisionEngine';
import { AnalysisResult } from '@/types';

export async function runAnalysisPipeline(buffer: Buffer, mimeType: string, offerId: string): Promise<AnalysisResult> {
  // 1. OCR / Extract Text
  console.log(`[Pipeline] Extracting text from buffer...`);
  const { text } = await extractDocumentTextFromBuffer(buffer, mimeType);
  return runAnalysisPipelineFromText(text, offerId);
}

export async function runAnalysisPipelineFromText(text: string, offerId: string): Promise<AnalysisResult> {
  console.log(`[Pipeline] Starting analysis for offerId: ${offerId}`);

  if (!text || text.length < 50) {
    throw new Error('Not enough text to analyze. Please provide the full offer letter content.');
  }

  // Normalize currency extraction corruptions (e.g. n9,60,000 -> Rs. 9,60,000)
  const normalizedText = normalizeExtractedText(text);

  // 2. Classification
  console.log(`[Pipeline] Classifying document...`);
  const isOfferLetter = classifyDocument(normalizedText);
  if (!isOfferLetter) {
    throw new Error('Document does not appear to be an Offer Letter or Employment Contract.');
  }

  // 3. AI Extraction (Gemini, with automatic Groq fallback on failure; or
  // Mock; or Groq directly via AI_PROVIDER=groq).
  console.log(`[Pipeline] Extracting structured data via AI Provider...`);
  const provider = process.env.AI_PROVIDER === 'mock' ? 'mock' : process.env.AI_PROVIDER === 'groq' ? 'groq' : 'gemini';
  const groqModelVersion = `${process.env.GROQ_MODEL || 'openai/gpt-oss-20b'}-v1`;

  let rawExtractedData;
  let extractionVersion: string;

  if (provider === 'mock') {
    rawExtractedData = await extractOfferDataMock(offerId);
    extractionVersion = 'mock-v1';
  } else if (provider === 'groq') {
    rawExtractedData = await extractWithGroq(normalizedText);
    extractionVersion = groqModelVersion;
  } else {
    try {
      rawExtractedData = await extractWithGemini(normalizedText);
      extractionVersion = `${process.env.GEMINI_MODEL || 'gemini-3.6-flash'}-v1`;
    } catch (geminiErr) {
      if (geminiErr instanceof GeminiModelAvailabilityError) {
        console.error('[Pipeline] Gemini model availability/configuration error. Rethrowing.');
        throw geminiErr;
      }

      if (!process.env.GROQ_API_KEY) {
        throw geminiErr;
      }

      if (geminiErr instanceof GeminiRateLimitError) {
        console.warn('[Pipeline] Gemini Rate-Limit/Quota Exceeded. Allowing Groq fallback to run:', geminiErr.message);
      } else {
        console.warn('[Pipeline] Gemini extraction failed, falling back to Groq:', geminiErr instanceof Error ? geminiErr.message : geminiErr);
      }

      rawExtractedData = await extractWithGroq(normalizedText);
      extractionVersion = `${groqModelVersion}-fallback`;
    }
  }

  // Gemini's native schema guarantees well-formed output; this is mainly a
  // backstop for Groq/mock and any future provider without that guarantee.
  const sanitizedData = sanitizeExtractedData(rawExtractedData);

  // 4. Evidence Validation (Anti-Hallucination)
  console.log(`[Pipeline] Validating extracted evidence against raw text...`);
  const validatedData = validateEvidence(sanitizedData, normalizedText);
  console.log('[Pipeline] Validated Data:', JSON.stringify(validatedData, null, 2));

  // 4.5. Sanity check: without any core identifying fields (company, role,
  // compensation), this likely isn't a genuine offer letter even though it
  // passed the keyword pre-filter in classifyDocument.
  const hasCoreOfferData = [validatedData.companyName, validatedData.role, validatedData.fixedSalary]
    .some(field => field?.status === 'found');
  if (!hasCoreOfferData) {
    throw new Error("We couldn't find a company name, role, or compensation details in this document. Please make sure you're uploading an offer or appointment letter.");
  }

  // 4.6. Company Intelligence Engine — independent enrichment layer, runs only
  // when we have a confidently-extracted company name. Never allowed to fail
  // the offer analysis: any provider/network problem resolves to 'unavailable'.
  let companyResearch: CompanyResearchOutcome;
  if (validatedData.companyName?.status === 'found' && validatedData.companyName.value) {
    try {
      // Only ever pass a 'found' location -- 'uncertain'/'not_specified'
      // must never be used to disambiguate company identity.
      const location = validatedData.location?.status === 'found' && validatedData.location.value
        ? validatedData.location.value
        : undefined;
      companyResearch = await companyResearchService.researchCompany(validatedData.companyName.value, { location });
    } catch (err) {
      console.error('[Pipeline] Company research failed:', err instanceof Error ? err.message : err);
      companyResearch = { status: 'unavailable', reason: 'research_provider_error' };
    }
  } else {
    companyResearch = { status: 'unavailable', reason: 'company_name_unverified' };
  }

  // 5. Deterministic Rules Engine
  console.log(`[Pipeline] Running rules engine...`);
  const flags = runRulesEngine(validatedData);

  const riskFlags = flags.filter(f => f.type === 'risk');
  const infoGaps = flags.filter(f => f.type === 'information_gap');
  const opportunities = flags.filter(f => f.type === 'opportunity');

  // 5.5. Offer vs Company Intelligence Comparison — depends on the rules
  // engine's output (reuses its flags/ruleIds instead of duplicating
  // threshold logic), so it must run after step 5. Like company research,
  // a failure here can never fail the offer analysis.
  console.log('[Pipeline] Comparing offer against company intelligence...');
  let comparison: OfferComparisonResult;
  try {
    comparison = await offerComparisonService.compare(validatedData, companyResearch, flags);
  } catch (err) {
    console.error('[Pipeline] Offer comparison failed:', err instanceof Error ? err.message : err);
    comparison = {
      status: 'unavailable',
      insights: [],
      comparedFields: [],
      limitations: ['Comparison could not be completed due to an internal error.']
    };
  }

  // 6. Score Calculation
  console.log(`[Pipeline] Calculating score...`);
  const score = calculateScore(riskFlags);
  const scoredRiskFlags = withScoreImpact(riskFlags);

  // 7. Generate Final Report Payload
  console.log(`[Pipeline] Running decision engine...`);
  const decision = evaluateOfferDecision({
    extractedData: validatedData,
    riskFlags,
    infoGaps,
    opportunities,
    companyResearch,
    comparison,
    score
  });

  const result: AnalysisResult = {
    offer_id: offerId,
    extraction_version: extractionVersion,
    rules_version: 'v2.1',
    flags: scoredRiskFlags,
    information_gaps: infoGaps,
    evidence_flags: [], // Populated for contradictions in future
    positive_signals: opportunities,
    score,
    scam_score: 0,
    summary: 'Automated analysis completed. Review the highlighted risks and information gaps carefully.',
    negotiation_points: [], // Future LLM pass
    affordability: null,
    created_at: new Date().toISOString(),
    extracted_data: validatedData,
    company_research: companyResearch,
    comparison,
    decision
  };

  console.log(`[Pipeline] Analysis complete! Score: ${score}`);
  return result;
}

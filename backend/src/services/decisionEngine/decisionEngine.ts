import { NormalizedOfferData, Flag } from '@/types';
import { CompanyResearchOutcome } from '@/services/companyResearch/types';
import { OfferComparisonResult } from '@/services/offerComparison/types';
import { DecisionAssessment, Recommendation, DecisionConfidence, DecisionFactor, DecisionBasis } from './types';
import { 
  THRESHOLD_REJECT_SCORE, 
  THRESHOLD_NEGOTIATE_SCORE, 
  THRESHOLD_BELOW_MARKET_RATIO, 
  THRESHOLD_CRITICAL_GAPS,
  THRESHOLD_HIGH_RISK_COUNT
} from './constants';

export interface DecisionEngineInput {
  extractedData: NormalizedOfferData;
  riskFlags: Flag[];
  infoGaps: Flag[];
  opportunities: Flag[];
  companyResearch: CompanyResearchOutcome;
  comparison: OfferComparisonResult;
  score: number;
}

export function evaluateOfferDecision(input: DecisionEngineInput): DecisionAssessment {
  const { extractedData, riskFlags, infoGaps, companyResearch, comparison, score } = input;
  
  const positiveFactors: DecisionFactor[] = [];
  const concerns: DecisionFactor[] = [];
  const negotiationPriorities: DecisionFactor[] = [];
  const beforeAccepting: DecisionFactor[] = [];
  
  let recommendation: Recommendation = 'accept';
  let confidence: DecisionConfidence = 'high';

  // 1. Process Risks
  let criticalRiskCount = 0;
  let highRiskCount = 0;

  riskFlags.forEach(flag => {
    if (flag.severity === 'critical') criticalRiskCount++;
    if (flag.severity === 'high') highRiskCount++;

    const factor: DecisionFactor = {
      title: flag.title,
      explanation: flag.reason,
      severity: flag.severity,
      source: 'rules_engine',
      evidence: flag.evidence
    };

    if (flag.severity === 'critical') {
      concerns.push(factor);
      negotiationPriorities.push(factor);
    } else if (flag.severity === 'high' || flag.severity === 'medium') {
      concerns.push(factor);
      if (flag.severity === 'high') {
        negotiationPriorities.push(factor);
      }
    } else {
      beforeAccepting.push(factor);
    }
  });

  // 2. Process Info Gaps
  let criticalGapCount = 0;
  infoGaps.forEach(gap => {
    // Missing fixed salary is a critical information gap that prevents proper evaluation
    if (gap.sourceFieldIds.includes('fixedSalary')) {
      criticalGapCount++;
    }
    
    const factor: DecisionFactor = {
      title: gap.title,
      explanation: gap.reason,
      severity: gap.severity,
      source: 'information_gap',
      evidence: gap.evidence
    };
    
    beforeAccepting.push(factor);
  });

  // 3. Process Market Compensation
  const fixedSalary = extractedData.fixedSalary.value;
  let salaryBelowMedian = false;
  let salaryHighlyBelowMedian = false; // < 70% of median

  if (comparison.marketCompensation) {
    const market = comparison.marketCompensation;
    if (fixedSalary && market.median) {
      if (fixedSalary < market.median * THRESHOLD_BELOW_MARKET_RATIO) {
        salaryBelowMedian = true;
        if (fixedSalary < market.median * 0.70) {
          salaryHighlyBelowMedian = true;
        }

        const factor: DecisionFactor = {
          title: 'Compensation Below Market Median',
          explanation: `Your fixed compensation is below the market median of ${market.currency} ${market.median} for this role/location.`,
          severity: salaryHighlyBelowMedian ? 'high' : 'medium',
          source: 'market_data'
        };
        concerns.push(factor);
        negotiationPriorities.push(factor);
      } else {
        positiveFactors.push({
          title: 'Competitive Compensation',
          explanation: `Your fixed compensation meets or exceeds the market median of ${market.currency} ${market.median}.`,
          severity: 'low',
          source: 'market_data'
        });
      }
    }
  } else {
    // Missing market data shouldn't penalize, but it reduces our confidence
    confidence = 'medium';
  }

  // 4. Process Company Research
  if (companyResearch.status === 'available') {
    const companySignals = companyResearch.result.signals;
    companySignals.forEach(signal => {
      if (['layoffs', 'legal', 'regulatory'].includes(signal.type)) {
        concerns.push({
          title: `Company Signal: ${signal.type}`,
          explanation: signal.summary,
          severity: 'medium',
          source: 'company_research',
          evidence: signal.evidence
        });
      } else if (['funding', 'acquisition', 'hiring'].includes(signal.type)) {
        positiveFactors.push({
          title: `Company Signal: ${signal.type}`,
          explanation: signal.summary,
          severity: 'low',
          source: 'company_research',
          evidence: signal.evidence
        });
      }
    });
  } else {
    // Missing company data reduces confidence but does not penalize
    if (confidence === 'high') {
      confidence = 'medium';
    }
  }

  // If evidence status is 'uncertain' on core fields, drop confidence
  if (extractedData.fixedSalary.status === 'uncertain' || extractedData.role.status === 'uncertain') {
    confidence = 'low';
  }

  // 5. Evaluate Final Recommendation
  // A. Critical missing information
  if (criticalGapCount >= THRESHOLD_CRITICAL_GAPS) {
    recommendation = 'needs_more_information';
  } 
  // B. Severe verified negative combination (Severe risks + poor compensation + low score)
  else if (
    (criticalRiskCount > 0 && salaryHighlyBelowMedian) || 
    score <= THRESHOLD_REJECT_SCORE
  ) {
    recommendation = 'reject';
  } 
  // C. Material but potentially negotiable issues
  else if (
    criticalRiskCount > 0 || 
    highRiskCount >= THRESHOLD_HIGH_RISK_COUNT || 
    salaryBelowMedian || 
    score <= THRESHOLD_NEGOTIATE_SCORE
  ) {
    recommendation = 'negotiate';
  } 
  // D. Strong/healthy offer with adequate evidence
  else {
    recommendation = 'accept';
  }

  // Generate summary text
  let summary = '';
  switch (recommendation) {
    case 'accept':
      summary = 'This is a strong offer with competitive terms and no major red flags. Proceed with confidence.';
      break;
    case 'negotiate':
      summary = 'This offer has solid potential, but there are areas (like compensation or specific contractual terms) that you should negotiate or clarify before accepting.';
      break;
    case 'reject':
      summary = 'This offer carries severe contractual risks combined with poor market positioning or highly restrictive terms. Unless these are dramatically renegotiated, it may be better to walk away.';
      break;
    case 'needs_more_information':
      summary = 'Critical information is missing from this offer (such as core compensation details). You must clarify these terms before making any decision.';
      break;
  }

  const decisionBasis: DecisionBasis[] = [];

  // 1. Compensation
  if (!fixedSalary) {
    decisionBasis.push({ dimension: 'compensation', status: 'incomplete', summary: 'Core compensation details (fixed salary) are missing from the offer.' });
  } else if (comparison.marketCompensation && comparison.marketCompensation.median) {
    if (salaryBelowMedian) {
      decisionBasis.push({ dimension: 'compensation', status: 'unfavorable', summary: 'Fixed compensation is below the market median.' });
    } else {
      decisionBasis.push({ dimension: 'compensation', status: 'favorable', summary: 'Fixed compensation meets or exceeds the market median.' });
    }
  } else {
    decisionBasis.push({ dimension: 'compensation', status: 'acceptable', summary: 'Compensation is present but cannot be benchmarked against the market.' });
  }

  // 2. Market Position
  if (!comparison.marketCompensation) {
    decisionBasis.push({ dimension: 'market_position', status: 'incomplete', summary: 'Market benchmark comparison data is unavailable.' });
  } else {
    if (salaryHighlyBelowMedian) {
      decisionBasis.push({ dimension: 'market_position', status: 'unfavorable', summary: 'Offer is positioned significantly below market rates.' });
    } else if (salaryBelowMedian) {
      decisionBasis.push({ dimension: 'market_position', status: 'acceptable', summary: 'Offer is positioned slightly below market rates.' });
    } else {
      decisionBasis.push({ dimension: 'market_position', status: 'favorable', summary: 'Offer is positioned competitively in the market.' });
    }
  }

  // 3. Contract Terms
  if (criticalRiskCount > 0 || highRiskCount > 0) {
    decisionBasis.push({ dimension: 'contract_terms', status: 'unfavorable', summary: 'Contains high-risk or critical contractual clauses.' });
  } else if (riskFlags.length > 0) {
    decisionBasis.push({ dimension: 'contract_terms', status: 'acceptable', summary: 'Contains some contractual risks, but none are high severity.' });
  } else {
    decisionBasis.push({ dimension: 'contract_terms', status: 'favorable', summary: 'No material contractual risks identified.' });
  }

  // 4. Company Profile
  if (companyResearch.status !== 'available') {
    decisionBasis.push({ dimension: 'company_profile', status: 'incomplete', summary: 'Verified company intelligence is unavailable.' });
  } else {
    const hasNegativeSignals = companyResearch.result.signals.some(s => ['layoffs', 'legal', 'regulatory'].includes(s.type));
    const hasPositiveSignals = companyResearch.result.signals.some(s => ['funding', 'acquisition', 'hiring'].includes(s.type));
    
    if (hasNegativeSignals) {
      decisionBasis.push({ dimension: 'company_profile', status: 'unfavorable', summary: 'Recent concerning signals identified in public data.' });
    } else if (hasPositiveSignals) {
      decisionBasis.push({ dimension: 'company_profile', status: 'favorable', summary: 'Recent positive signals identified.' });
    } else {
      decisionBasis.push({ dimension: 'company_profile', status: 'acceptable', summary: 'Company profile verified with no concerning signals.' });
    }
  }

  // 5. Completeness
  if (criticalGapCount > 0) {
    decisionBasis.push({ dimension: 'completeness', status: 'incomplete', summary: 'Critical offer information is missing.' });
  } else if (infoGaps.length > 0) {
    decisionBasis.push({ dimension: 'completeness', status: 'acceptable', summary: 'Some non-critical information gaps exist.' });
  } else {
    decisionBasis.push({ dimension: 'completeness', status: 'favorable', summary: 'The offer contains all expected comprehensive terms.' });
  }

  return {
    recommendation,
    confidence,
    summary,
    positiveFactors,
    concerns,
    negotiationPriorities,
    beforeAccepting,
    decisionBasis,
    decisionEngineVersion: 'v1.0'
  };
}

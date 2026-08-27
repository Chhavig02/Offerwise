/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from 'vitest';
import { validateEvidence } from '../services/evidenceService';
import { calculateScore, withScoreImpact } from '../services/scoreService';
import { runRulesEngine } from '../rules/rulesEngine';
import { NormalizedOfferData, ExtractedField } from '../../src/types';

// Must contain the mock provider's exact evidence quotes (mockAiProvider.ts)
// so evidenceService keeps every 'found' field as 'found', including the
// Phase 4 context fields (location/workMode/experienceLevel). Shared across
// every pipeline-level describe block below.
const sampleOfferText = `
Welcome to Acme Corp
Dear John Doe,
We are delighted to offer you the position of Software Engineer.
Base salary of INR 12,00,000 per annum. Performance bonus up to INR 2,00,000.
Probation period of 6 months. Mandatory service of 1 year.
Cannot work for competitors for 6 months after termination.
The employee will be based at our Bengaluru office. This is a Hybrid work model.
Position: Graduate Software Engineer.
`;

describe('Adversarial Verification Suite', () => {

  const createEmptyData = (): NormalizedOfferData => ({
    companyName: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    candidateName: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    role: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    fixedSalary: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    variableSalary: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    joiningBonus: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    currency: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    probationPeriodMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    noticePeriodDays: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasBond: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondDurationMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondBuyoutAmount: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasNonCompete: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  });

  it('2. EVIDENCE ANTI-HALLUCINATION TEST: Rejects fabricated evidence', () => {
    const rawText = 'Employee must provide 30 days notice.';
    const data = createEmptyData();
    data.noticePeriodDays = {
      value: 90,
      status: 'found',
      confidence: 1,
      evidence: { sourceText: 'Employee must provide 90 days notice.', sourcePage: 1, sourceLocation: 'p1' }
    };

    const validated = validateEvidence(data, rawText);
    expect(validated.noticePeriodDays.status).toBe('uncertain');
    expect(validated.noticePeriodDays.evidence.sourceText).toBeNull();
    expect(validated.noticePeriodDays.confidence).toBe(0);
  });

  it('3. VALID EVIDENCE TEST: Accepts exact matching evidence', () => {
    const rawText = 'Employee shall provide 90 days prior written notice.';
    const data = createEmptyData();
    data.noticePeriodDays = {
      value: 90,
      status: 'found',
      confidence: 1,
      evidence: { sourceText: 'Employee shall provide 90 days prior written notice.', sourcePage: 1, sourceLocation: 'p1' }
    };

    const validated = validateEvidence(data, rawText);
    expect(validated.noticePeriodDays.status).toBe('found');
    expect(validated.noticePeriodDays.evidence.sourceText).not.toBeNull();
  });

  it('4. MISSING DATA TEST: Missing data triggers GAP flag, not RISK flag', () => {
    const data = createEmptyData();
    data.noticePeriodDays = {
      value: null,
      status: 'not_specified',
      confidence: 0,
      evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
    };

    const flags = runRulesEngine(data);
    const gapFlag = flags.find(f => f.ruleId === 'GAP_NOTICE_PERIOD');
    const riskFlag = flags.find(f => f.ruleId === 'TERM_NOTICE_EXTENDED');

    expect(gapFlag).toBeDefined();
    expect(gapFlag?.type).toBe('information_gap');
    expect(riskFlag).toBeUndefined(); // Must NOT trigger long notice risk if not specified
  });

  it('5. UNCERTAIN FIELD TEST: Fields rejected by evidence validation are surfaced, not dropped', () => {
    const data = createEmptyData();
    data.noticePeriodDays = {
      value: 90,
      status: 'uncertain',
      confidence: 0,
      evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
    };

    const flags = runRulesEngine(data);
    const unverifiedFlag = flags.find(f => f.ruleId === 'UNVERIFIED_NOTICEPERIODDAYS');
    const gapFlag = flags.find(f => f.ruleId === 'GAP_NOTICE_PERIOD');
    const riskFlag = flags.find(f => f.ruleId === 'TERM_NOTICE_EXTENDED');

    expect(unverifiedFlag).toBeDefined();
    expect(unverifiedFlag?.type).toBe('information_gap');
    expect(gapFlag).toBeUndefined(); // Not the same as "not specified"
    expect(riskFlag).toBeUndefined(); // Must NOT count as a confirmed risk

    // Must not affect the score either
    const riskFlags = flags.filter(f => f.type === 'risk');
    expect(calculateScore(riskFlags)).toBe(100);
  });

  it('6. SCORE IMPACT: withScoreImpact attaches the correct per-flag penalty', () => {
    const flags = [
      { severity: 'critical' } as any,
      { severity: 'high' } as any,
      { severity: 'medium' } as any,
      { severity: 'low' } as any,
    ];

    const scored = withScoreImpact(flags);
    expect(scored.map(f => f.scoreImpact)).toEqual([25, 15, 5, 2]);
  });

  it('7. CONTEXT FIELD EVIDENCE TEST: location/workMode/experienceLevel participate in evidence validation like every other field', () => {
    const rawText = 'The employee will be based at our Bengaluru office. This is a Hybrid work model.';
    const data = createEmptyData();
    data.location = { value: 'Bengaluru', status: 'found', confidence: 0.9, evidence: { sourceText: 'based at our Bengaluru office', sourcePage: 1, sourceLocation: 'p1' } };
    data.workMode = { value: 'hybrid', status: 'found', confidence: 0.85, evidence: { sourceText: 'Hybrid work model', sourcePage: 1, sourceLocation: 'p1' } };
    // Fabricated evidence -- doesn't appear in rawText at all.
    data.experienceLevel = { value: 'senior', status: 'found', confidence: 0.8, evidence: { sourceText: 'Senior Software Engineer with 8 years', sourcePage: 1, sourceLocation: 'p1' } };

    const validated = validateEvidence(data, rawText);

    expect(validated.location?.status).toBe('found');
    expect(validated.workMode?.status).toBe('found');
    // Fabricated evidence must be caught exactly like any existing field.
    expect(validated.experienceLevel?.status).toBe('uncertain');
    expect(validated.experienceLevel?.evidence.sourceText).toBeNull();
  });

  it('8. CONTEXT FIELD REGRESSION TEST: missing location/workMode/experience produce zero flags and zero score impact', () => {
    const data = createEmptyData();
    // location/workMode/experienceLevel simply absent, matching createEmptyData's baseline.
    const flags = runRulesEngine(data);

    expect(flags.find(f => f.sourceFieldIds.includes('location'))).toBeUndefined();
    expect(flags.find(f => f.sourceFieldIds.includes('workMode'))).toBeUndefined();
    expect(flags.find(f => f.sourceFieldIds.includes('experienceLevel'))).toBeUndefined();
    const riskFlags = flags.filter(f => f.type === 'risk');
    expect(calculateScore(riskFlags)).toBe(100);
  });

  it('9. CONTEXT FIELD UNCERTAIN TEST: uncertain location is surfaced generically, not turned into a risk or missing-context penalty', () => {
    const data = createEmptyData();
    data.location = { value: 'Bengaluru', status: 'uncertain', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } };

    const flags = runRulesEngine(data);
    const unverified = flags.find(f => f.ruleId === 'UNVERIFIED_LOCATION');

    expect(unverified).toBeDefined();
    expect(unverified?.type).toBe('information_gap');
    const riskFlags = flags.filter(f => f.type === 'risk');
    expect(calculateScore(riskFlags)).toBe(100);
  });

  it('10a. RELOCATION GAP TEST: relocation mentioned but no amount -> GAP_RELOCATION_AMOUNT, not the generic "not mentioned" gap', () => {
    const data = createEmptyData();
    data.hasRelocation = { value: true, status: 'found', confidence: 0.9, evidence: { sourceText: 'relocation expenses will be reimbursed', sourcePage: 1, sourceLocation: 'p1' } };
    // relocationAllowance left absent -> no fixed amount given.

    const flags = runRulesEngine(data);
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION_AMOUNT')).toBeDefined();
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION')).toBeUndefined();
  });

  it('10b. RELOCATION GAP TEST: neither field present -> original "not mentioned at all" gap (regression)', () => {
    const data = createEmptyData();
    const flags = runRulesEngine(data);
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION')).toBeDefined();
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION_AMOUNT')).toBeUndefined();
  });

  it('10c. RELOCATION GAP TEST: explicitly no relocation -> no gap of either kind', () => {
    const data = createEmptyData();
    data.hasRelocation = { value: false, status: 'found', confidence: 0.9, evidence: { sourceText: 'No relocation assistance is provided', sourcePage: 1, sourceLocation: 'p1' } };

    const flags = runRulesEngine(data);
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION')).toBeUndefined();
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION_AMOUNT')).toBeUndefined();
  });

  it('10d. RELOCATION GAP TEST: relocation mentioned AND a fixed amount given -> no gap at all', () => {
    const data = createEmptyData();
    data.hasRelocation = { value: true, status: 'found', confidence: 0.9, evidence: { sourceText: 'relocation expenses will be reimbursed', sourcePage: 1, sourceLocation: 'p1' } };
    data.relocationAllowance = { value: 50000, status: 'found', confidence: 0.9, evidence: { sourceText: 'relocation allowance of INR 50,000', sourcePage: 1, sourceLocation: 'p1' } };

    const flags = runRulesEngine(data);
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION')).toBeUndefined();
    expect(flags.find(f => f.ruleId === 'GAP_RELOCATION_AMOUNT')).toBeUndefined();
  });

  it('12. FABRICATED EVIDENCE TEST: a not_specified field with a stray non-null sourceText never surfaces as flag evidence', () => {
    // Reproduces the real bug found via live testing: Groq set status
    // correctly to 'not_specified' but left a placeholder-like sourceText
    // ("joining bonus") behind instead of null. addFlag must not treat
    // this as real evidence just because sourceText happens to be non-null.
    const data = createEmptyData();
    data.joiningBonus = { value: null, status: 'not_specified', confidence: 1, evidence: { sourceText: 'joining bonus', sourcePage: null, sourceLocation: null } };

    const flags = runRulesEngine(data);
    const opportunity = flags.find(f => f.ruleId === 'GAP_JOINING_BONUS');

    expect(opportunity).toBeDefined(); // still correctly fires as a gap/opportunity
    expect(opportunity?.evidence).toEqual([]); // but with NO fabricated evidence
  });

  it('12b. FABRICATED EVIDENCE REGRESSION: a genuinely found field with real evidence is unaffected', () => {
    const data = createEmptyData();
    data.hasBond = { value: true, status: 'found', confidence: 0.9, evidence: { sourceText: 'mandatory bond of 12 months', sourcePage: 1, sourceLocation: 'p1' } };

    const flags = runRulesEngine(data);
    const bondFlag = flags.find(f => f.ruleId === 'TERM_BOND_PRESENT');

    expect(bondFlag?.evidence.length).toBeGreaterThan(0);
    expect(bondFlag?.evidence[0].sourceText).toBe('mandatory bond of 12 months');
  });

  it('11. SCORE RANGES: Verifies penalty logic (0-100 scale)', () => {
    expect(calculateScore([])).toBe(100);
    expect(calculateScore([{ severity: 'low' } as any])).toBe(98);
    expect(calculateScore([{ severity: 'medium' } as any])).toBe(95);
    expect(calculateScore([{ severity: 'high' } as any])).toBe(85);
    expect(calculateScore([{ severity: 'critical' } as any])).toBe(75);
    
    // Test floor 0
    expect(calculateScore([
      { severity: 'critical' } as any,
      { severity: 'critical' } as any,
      { severity: 'critical' } as any,
      { severity: 'critical' } as any,
      { severity: 'critical' } as any
    ])).toBe(0);
  });
});

describe('Company research failure isolation (pipeline-level)', () => {
  it('offer extraction + company research both succeed -> analysis succeeds with company_research available', async () => {
    vi.resetModules();
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: {
        researchCompany: vi.fn().mockResolvedValue({
          status: 'available',
          result: {
            companyName: 'Acme Corp',
            companyIdentityConfidence: 'high',
            signals: [],
            sources: [],
            researchedAt: new Date().toISOString()
          }
        })
      }
    }));
    // Company research succeeding here means the comparison step actually
    // reaches the market-data call -- must be mocked to avoid a live Adzuna
    // request (this was previously missing and silently hit the real API).
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: { getCompensationBenchmark: vi.fn().mockResolvedValue(null) }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-offer-success');

    expect(result.company_research?.status).toBe('available');
    // Comparison depends on the rules-engine flags, which now run before it.
    expect(result.comparison).toBeDefined();
    expect(result.comparison?.status).not.toBe('unavailable');
  });

  it('offer extraction succeeds + company research throws -> analysis still succeeds, marked unavailable', async () => {
    vi.resetModules();
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: {
        researchCompany: vi.fn().mockRejectedValue(new Error('simulated provider outage'))
      }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-offer-research-fails');

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.company_research).toEqual({ status: 'unavailable', reason: 'research_provider_error' });
    // Comparison must also degrade gracefully when company research failed.
    expect(result.comparison?.status).toBe('unavailable');
    expect(result.comparison?.insights).toEqual([]);
  });
});

describe('Market data failure isolation (pipeline-level)', () => {

  const successfulCompanyResearchMock = () => ({
    companyResearchService: {
      researchCompany: vi.fn().mockResolvedValue({
        status: 'available',
        result: { companyName: 'Acme Corp', companyIdentityConfidence: 'high', signals: [], sources: [], researchedAt: new Date().toISOString() }
      })
    }
  });

  it('market research succeeds -> comparison includes a compensation insight, offer analysis succeeds', async () => {
    vi.resetModules();
    vi.doMock('../services/companyResearch/companyResearchService', successfulCompanyResearchMock);
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: {
        getCompensationBenchmark: vi.fn().mockResolvedValue({
          role: 'Software Engineer', currency: 'INR', minimum: 800000, median: 1000000, maximum: 1200000,
          source: { title: 'Adzuna salary distribution', url: 'https://www.adzuna.in/search?q=Software+Engineer', publisher: 'Adzuna', sourceType: 'job_market' },
          retrievedAt: new Date().toISOString(), confidence: 'low'
        })
      }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-market-success');

    const insight = result.comparison?.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight).toBeDefined();
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('market provider throws -> comparison degrades gracefully, offer analysis still succeeds', async () => {
    vi.resetModules();
    vi.doMock('../services/companyResearch/companyResearchService', successfulCompanyResearchMock);
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: {
        getCompensationBenchmark: vi.fn().mockRejectedValue(new Error('simulated Adzuna outage'))
      }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-market-fails');

    expect(result.score).toBeGreaterThanOrEqual(0);
    const insight = result.comparison?.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight).toBeUndefined();
    expect(result.comparison?.limitations).toContain('Market compensation data was unavailable.');
    // Employment-terms/company insights must survive a market-data failure --
    // it degrades only the compensation piece, not the whole comparison.
    expect(result.comparison?.status).not.toBe('unavailable');
  });
});

describe('Location context flow (pipeline-level)', () => {
  it('location found -> flows through to both company research context and the market query', async () => {
    vi.resetModules();
    const researchSpy = vi.fn().mockResolvedValue({
      status: 'available',
      result: { companyName: 'Acme Corp', companyIdentityConfidence: 'high', signals: [], sources: [], researchedAt: new Date().toISOString() }
    });
    const benchmarkSpy = vi.fn().mockResolvedValue(null);
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: { researchCompany: researchSpy }
    }));
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: { getCompensationBenchmark: benchmarkSpy }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    await runAnalysisPipelineFromText(sampleOfferText, 'test-location-found');

    expect(researchSpy).toHaveBeenCalledWith('Acme Corp', expect.objectContaining({ location: 'Bengaluru' }));
    expect(benchmarkSpy).toHaveBeenCalledWith(expect.objectContaining({ location: 'Bengaluru' }));
  });

  it('location not_specified -> offer analysis still succeeds, market query receives no location', async () => {
    vi.resetModules();
    vi.doMock('../providers/ai/mockAiProvider', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../providers/ai/mockAiProvider')>();
      return {
        extractOfferDataMock: async (id: string) => {
          const base = await actual.extractOfferDataMock(id);
          return { ...base, location: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } } };
        }
      };
    });
    const benchmarkSpy = vi.fn().mockResolvedValue(null);
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: { researchCompany: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'company_name_unverified' }) }
    }));
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: { getCompensationBenchmark: benchmarkSpy }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-location-missing');

    expect(result.score).toBeGreaterThanOrEqual(0);
    // No city invented -- location simply absent from the query.
    expect(benchmarkSpy).not.toHaveBeenCalledWith(expect.objectContaining({ location: expect.anything() }));
  });

  it('location uncertain (fabricated evidence) -> never used as trusted market/company context', async () => {
    vi.resetModules();
    vi.doMock('../providers/ai/mockAiProvider', async (importOriginal) => {
      const actual = await importOriginal<typeof import('../providers/ai/mockAiProvider')>();
      return {
        extractOfferDataMock: async (id: string) => {
          const base = await actual.extractOfferDataMock(id);
          return {
            ...base,
            // Evidence text does not appear anywhere in sampleOfferText -- evidenceService will downgrade this to 'uncertain'.
            location: { value: 'Mumbai', status: 'found', confidence: 0.9, evidence: { sourceText: 'Relocating to our Mumbai office next quarter', sourcePage: 1, sourceLocation: 'p1' } }
          };
        }
      };
    });
    const researchSpy = vi.fn().mockResolvedValue({
      status: 'available',
      result: { companyName: 'Acme Corp', companyIdentityConfidence: 'high', signals: [], sources: [], researchedAt: new Date().toISOString() }
    });
    const benchmarkSpy = vi.fn().mockResolvedValue(null);
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: { researchCompany: researchSpy }
    }));
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: { getCompensationBenchmark: benchmarkSpy }
    }));

    process.env.AI_PROVIDER = 'mock';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-location-uncertain');

    expect(result.extracted_data?.location?.status).toBe('uncertain');
    expect(researchSpy).toHaveBeenCalledWith('Acme Corp', expect.objectContaining({ location: undefined }));
    expect(benchmarkSpy).not.toHaveBeenCalledWith(expect.objectContaining({ location: 'Mumbai' }));
  });
});

describe('Groq fallback (pipeline-level)', () => {
  const groqFixtureData = {
    companyName: { value: 'Acme Corp', status: 'found', confidence: 0.9, evidence: { sourceText: 'Welcome to Acme Corp', sourcePage: 1, sourceLocation: 'p1' } },
    candidateName: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    role: { value: 'Software Engineer', status: 'found', confidence: 0.9, evidence: { sourceText: 'position of Software Engineer', sourcePage: 1, sourceLocation: 'p1' } },
    fixedSalary: { value: 1200000, status: 'found', confidence: 0.9, evidence: { sourceText: 'Base salary of INR 12,00,000 per annum', sourcePage: 2, sourceLocation: 'p2' } },
    variableSalary: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    joiningBonus: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    currency: { value: 'INR', status: 'found', confidence: 1, evidence: { sourceText: 'INR', sourcePage: 2, sourceLocation: 'p2' } },
    probationPeriodMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    noticePeriodDays: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasBond: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondDurationMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondBuyoutAmount: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasNonCompete: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } }
  };

  const mockDownstreamServices = () => {
    vi.doMock('../services/companyResearch/companyResearchService', () => ({
      companyResearchService: { researchCompany: vi.fn().mockResolvedValue({ status: 'unavailable', reason: 'company_name_unverified' }) }
    }));
    vi.doMock('../services/offerComparison/marketData/realMarketDataProvider', () => ({
      realMarketDataProvider: { getCompensationBenchmark: vi.fn().mockResolvedValue(null) }
    }));
  };

  class MockAvailabilityError extends Error {
    constructor(m: string) { super(m); this.name = 'GeminiModelAvailabilityError'; }
  }
  class MockRateLimitError extends Error {
    constructor(m: string) { super(m); this.name = 'GeminiRateLimitError'; }
  }

  it('Gemini fails + GROQ_API_KEY configured -> falls back to Groq, pipeline succeeds, extraction_version marked -fallback', async () => {
    vi.resetModules();
    mockDownstreamServices();
    vi.doMock('../providers/ai/GeminiProvider', () => ({
      extractWithGemini: vi.fn().mockRejectedValue(new Error('simulated Gemini quota exhaustion')),
      GeminiModelAvailabilityError: MockAvailabilityError,
      GeminiRateLimitError: MockRateLimitError
    }));
    vi.doMock('../providers/ai/GroqProvider', () => ({
      extractWithGroq: vi.fn().mockResolvedValue(groqFixtureData)
    }));

    process.env.AI_PROVIDER = 'gemini';
    process.env.GROQ_API_KEY = 'test-groq-key';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-groq-fallback');

    expect(result.extracted_data?.companyName.value).toBe('Acme Corp');
    expect(result.extraction_version).toContain('-fallback');
  });

  it('Gemini fails + no GROQ_API_KEY -> original Gemini error propagates unchanged (no fallback exists)', async () => {
    vi.resetModules();
    mockDownstreamServices();
    vi.doMock('../providers/ai/GeminiProvider', () => ({
      extractWithGemini: vi.fn().mockRejectedValue(new Error('simulated Gemini quota exhaustion')),
      GeminiModelAvailabilityError: MockAvailabilityError,
      GeminiRateLimitError: MockRateLimitError
    }));
    const groqSpy = vi.fn();
    vi.doMock('../providers/ai/GroqProvider', () => ({ extractWithGroq: groqSpy }));

    process.env.AI_PROVIDER = 'gemini';
    delete process.env.GROQ_API_KEY;
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');

    await expect(runAnalysisPipelineFromText(sampleOfferText, 'test-no-fallback')).rejects.toThrow('simulated Gemini quota exhaustion');
    expect(groqSpy).not.toHaveBeenCalled();
  });

  it('AI_PROVIDER=groq -> uses Groq directly, Gemini never called', async () => {
    vi.resetModules();
    mockDownstreamServices();
    const geminiSpy = vi.fn();
    vi.doMock('../providers/ai/GeminiProvider', () => ({
      extractWithGemini: geminiSpy,
      GeminiModelAvailabilityError: MockAvailabilityError,
      GeminiRateLimitError: MockRateLimitError
    }));
    vi.doMock('../providers/ai/GroqProvider', () => ({
      extractWithGroq: vi.fn().mockResolvedValue(groqFixtureData)
    }));

    process.env.AI_PROVIDER = 'groq';
    const { runAnalysisPipelineFromText } = await import('../services/pipeline');
    const result = await runAnalysisPipelineFromText(sampleOfferText, 'test-groq-direct');

    expect(geminiSpy).not.toHaveBeenCalled();
    expect(result.extracted_data?.companyName.value).toBe('Acme Corp');
    expect(result.extraction_version).not.toContain('fallback');

    process.env.AI_PROVIDER = 'mock'; // restore for subsequent tests in this file
  });
});

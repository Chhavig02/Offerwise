import { describe, it, expect } from 'vitest';
import { OfferComparisonService } from '../services/offerComparison/offerComparisonService';
import { NullMarketDataProvider } from '../services/offerComparison/marketData/nullMarketDataProvider';
import { MarketCompensationData, MarketDataProvider } from '../services/offerComparison/types';
import { CompanyResearchOutcome, CompanyResearchResult } from '../services/companyResearch/types';
import { Flag, NormalizedOfferData } from '../types';

const emptyOfferData = (): NormalizedOfferData => ({
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
  hasNonCompete: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } }
});

const offerWithSalary = (fixed: number, currency = 'INR'): NormalizedOfferData => {
  const data = emptyOfferData();
  data.role = { value: 'Software Engineer', status: 'found', confidence: 0.9, evidence: { sourceText: 'Software Engineer', sourcePage: 1, sourceLocation: 'p1' } };
  data.fixedSalary = { value: fixed, status: 'found', confidence: 0.9, evidence: { sourceText: `Fixed salary ${fixed}`, sourcePage: 2, sourceLocation: 'p2' } };
  data.currency = { value: currency, status: 'found', confidence: 1, evidence: { sourceText: currency, sourcePage: 2, sourceLocation: 'p2' } };
  return data;
};

const fakeFlag = (ruleId: string, sourceFieldIds: string[], reason = 'reason text'): Flag => ({
  id: `id_${ruleId}`,
  type: 'risk',
  severity: 'medium',
  title: ruleId,
  reason,
  evidence: [{ sourceText: `${ruleId} evidence`, sourcePage: 1, sourceLocation: 'p1' }],
  ruleId,
  sourceFieldIds,
  jurisdiction: 'IN',
  disclaimerRequired: true
});

const now = new Date().toISOString();
const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString();

function availableResearch(overrides: Partial<CompanyResearchResult> = {}): CompanyResearchOutcome {
  return {
    status: 'available',
    result: {
      companyName: 'Acme Corp',
      companyIdentityConfidence: 'high',
      signals: [],
      sources: [],
      researchedAt: now,
      ...overrides
    }
  };
}

const unavailableResearch: CompanyResearchOutcome = { status: 'unavailable', reason: 'company_name_unverified' };

describe('OfferComparisonService — compensation', () => {
  it('salary + valid benchmark -> produces a below-range comparison insight', async () => {
    const benchmarkProvider: MarketDataProvider = {
      getCompensationBenchmark: async (): Promise<MarketCompensationData> => ({
        role: 'Software Engineer',
        currency: 'INR',
        minimum: 800000,
        maximum: 1500000,
        source: { claim: 'Market survey', evidenceType: 'market_data' }
      })
    };
    const service = new OfferComparisonService(benchmarkProvider);
    const result = await service.compare(offerWithSalary(500000), availableResearch(), []);

    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight).toBeDefined();
    expect(insight?.severity).toBe('caution');
    expect(result.comparedFields).toContain('fixedSalary');
  });

  it('salary + no benchmark -> limitation, no fabricated insight', async () => {
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(offerWithSalary(500000), availableResearch(), []);

    expect(result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK')).toBeUndefined();
    expect(result.limitations).toContain('Insufficient reliable salary benchmark data was available.');
  });

  it('missing salary -> no compensation comparison attempted at all', async () => {
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), availableResearch(), []);

    expect(result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK')).toBeUndefined();
    expect(result.limitations.some(l => l.includes('benchmark'))).toBe(false);
    expect(result.comparedFields).not.toContain('fixedSalary');
  });

  it('currency mismatch -> comparison skipped, not an unsafe conversion', async () => {
    const mismatchedProvider: MarketDataProvider = {
      getCompensationBenchmark: async (): Promise<MarketCompensationData> => ({
        role: 'Software Engineer',
        currency: 'USD',
        minimum: 80000,
        maximum: 150000,
        source: { claim: 'Market survey', evidenceType: 'market_data' }
      })
    };
    const service = new OfferComparisonService(mismatchedProvider);
    const result = await service.compare(offerWithSalary(500000, 'INR'), availableResearch(), []);

    expect(result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK')).toBeUndefined();
    expect(result.limitations.some(l => l.toLowerCase().includes('currency'))).toBe(true);
  });
});

describe('OfferComparisonService — company signals', () => {
  it('recent restructuring -> caution insight with careful wording, not "unstable"', async () => {
    const research = availableResearch({
      signals: [{
        type: 'restructuring',
        summary: 'Company restructuring reported',
        confidence: 'medium',
        evidence: [{ claim: 'Company announced restructuring', sourceId: 'src_1', confidence: 'medium' }]
      }],
      sources: [{ id: 'src_1', title: 'News', url: 'https://reuters.com/x', publisher: 'reuters.com', publishedAt: now, retrievedAt: now, sourceType: 'news' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    const insight = result.insights.find(i => i.title.includes('restructuring'));
    expect(insight).toBeDefined();
    expect(insight?.severity).toBe('caution');
    expect(insight?.explanation.toLowerCase()).not.toContain('unstable');
    expect(insight?.explanation).toContain('may be relevant');
  });

  it('recent hiring -> positive signal insight', async () => {
    const research = availableResearch({
      signals: [{
        type: 'hiring',
        summary: 'Company is hiring',
        confidence: 'medium',
        evidence: [{ claim: 'Company is expanding its team', sourceId: 'src_1', confidence: 'medium' }]
      }],
      sources: [{ id: 'src_1', title: 'News', url: 'https://acme.com/careers', publisher: 'acme.com', publishedAt: now, retrievedAt: now, sourceType: 'official' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    const insight = result.insights.find(i => i.category === 'positive_signal');
    expect(insight).toBeDefined();
    expect(insight?.severity).toBe('positive');
  });

  it('legal signal -> caution insight, no misconduct conclusion', async () => {
    const research = availableResearch({
      signals: [{
        type: 'legal',
        summary: 'Legal matter reported',
        confidence: 'medium',
        evidence: [{ claim: 'Company faces a lawsuit', sourceId: 'src_1', confidence: 'medium' }]
      }],
      sources: [{ id: 'src_1', title: 'News', url: 'https://reuters.com/legal', publisher: 'reuters.com', publishedAt: now, retrievedAt: now, sourceType: 'news' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    const insight = result.insights.find(i => i.title.includes('legal'));
    expect(insight).toBeDefined();
    expect(insight?.severity).toBe('caution');
    expect(insight?.explanation).toContain('does not by itself establish misconduct');
  });

  it('old event -> explanation explicitly marked historical', async () => {
    const research = availableResearch({
      signals: [{
        type: 'layoffs',
        summary: 'Old layoffs',
        confidence: 'medium',
        evidence: [{ claim: 'Layoffs occurred', sourceId: 'src_1', confidence: 'medium' }]
      }],
      sources: [{ id: 'src_1', title: 'Old news', url: 'https://reuters.com/old', publisher: 'reuters.com', publishedAt: twoYearsAgo, retrievedAt: now, sourceType: 'news' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    const insight = result.insights.find(i => i.title.includes('layoffs'));
    expect(insight?.explanation).toContain('historical');
  });

  it('no matching signal type (company_status/other) -> no fabricated insight', async () => {
    const research = availableResearch({
      signals: [{
        type: 'other',
        summary: 'Generic mention',
        confidence: 'low',
        evidence: [{ claim: 'Some generic mention', sourceId: 'src_1', confidence: 'low' }]
      }],
      sources: [{ id: 'src_1', title: 'X', url: 'https://example.com', publisher: 'example.com', retrievedAt: now, sourceType: 'other' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    expect(result.insights).toHaveLength(0);
  });
});

describe('OfferComparisonService — identity confidence', () => {
  it('high-confidence company -> insight confidence reflects signal confidence, no disclosure limitation', async () => {
    const research = availableResearch({
      companyIdentityConfidence: 'high',
      signals: [{
        type: 'hiring',
        summary: 'Hiring',
        confidence: 'high',
        evidence: [{ claim: 'is hiring', sourceId: 'src_1', confidence: 'high' }]
      }],
      sources: [{ id: 'src_1', title: 'X', url: 'https://acme.com', publisher: 'acme.com', retrievedAt: now, sourceType: 'official' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    expect(result.insights[0].confidence).toBe('high');
    expect(result.limitations.some(l => l.includes('could not be verified with high confidence'))).toBe(false);
  });

  it('low/ambiguous identity confidence -> every insight downgraded to low + explicit disclosure limitation', async () => {
    const research = availableResearch({
      companyIdentityConfidence: 'low',
      signals: [{
        type: 'hiring',
        summary: 'Hiring',
        confidence: 'high',
        evidence: [{ claim: 'is hiring', sourceId: 'src_1', confidence: 'high' }]
      }],
      sources: [{ id: 'src_1', title: 'X', url: 'https://maybe-acme.com', publisher: 'maybe-acme.com', retrievedAt: now, sourceType: 'other' }]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    expect(result.insights[0].confidence).toBe('low');
    expect(result.limitations).toContain(
      'The company identity could not be verified with high confidence, so company-specific findings should be treated cautiously.'
    );
  });
});

describe('OfferComparisonService — failure handling', () => {
  it('company research unavailable -> comparison unavailable, matches exact spec shape', async () => {
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(offerWithSalary(500000), unavailableResearch, []);

    expect(result).toEqual({
      status: 'unavailable',
      insights: [],
      comparedFields: [],
      limitations: ['Company research was unavailable, so employer-specific comparison could not be completed.']
    });
  });
});

describe('OfferComparisonService — employment terms (reuses rules-engine flags)', () => {
  it('bond flag -> exact spec wording, non-compete flag -> exact spec wording', async () => {
    const flags = [
      fakeFlag('TERM_BOND_PRESENT', ['hasBond', 'bondDurationMonths']),
      fakeFlag('LEGAL_NON_COMPETE', ['hasNonCompete'])
    ];
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), availableResearch(), flags);

    const bond = result.insights.find(i => i.id === 'TERM_BOND_PRESENT');
    const nonCompete = result.insights.find(i => i.id === 'LEGAL_NON_COMPETE');
    expect(bond?.explanation).toBe('Offer contains a training/employment bond.');
    expect(nonCompete?.explanation).toBe('This clause may warrant legal review depending on jurisdiction and exact wording.');
    expect(result.comparedFields).toEqual(expect.arrayContaining(['hasBond', 'bondDurationMonths', 'hasNonCompete']));
  });

  it('a flag with no matching ruleId in the lookup table produces no insight', async () => {
    const flags = [fakeFlag('GAP_INSURANCE', ['insurance'])];
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), availableResearch(), flags);

    expect(result.insights).toHaveLength(0);
  });
});

describe('OfferComparisonService — evidence integrity', () => {
  it('every signal insight sourceId resolves to a real entry in companyResearch sources', async () => {
    const research = availableResearch({
      signals: [
        { type: 'hiring', summary: 'A', confidence: 'medium', evidence: [{ claim: 'a', sourceId: 'src_1', confidence: 'medium' }] },
        { type: 'legal', summary: 'B', confidence: 'medium', evidence: [{ claim: 'b', sourceId: 'src_2', confidence: 'medium' }] }
      ],
      sources: [
        { id: 'src_1', title: 'A', url: 'https://a.com', retrievedAt: now, sourceType: 'other' },
        { id: 'src_2', title: 'B', url: 'https://b.com', retrievedAt: now, sourceType: 'news' }
      ]
    });
    const service = new OfferComparisonService(new NullMarketDataProvider());
    const result = await service.compare(emptyOfferData(), research, []);

    const sourceIds = new Set(research.status === 'available' ? research.result.sources.map(s => s.id) : []);
    for (const insight of result.insights) {
      for (const ev of insight.evidence) {
        if (ev.sourceId) expect(sourceIds.has(ev.sourceId)).toBe(true);
      }
    }
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { RealMarketDataProvider, deriveBenchmarkFromHistogram, normalizeRole, normalizeLocation } from '../services/offerComparison/marketData/realMarketDataProvider';
import { AdzunaClient, RealAdzunaClient } from '../services/offerComparison/marketData/adzunaClient';
import { combineMarketData } from '../services/offerComparison/combineMarketData';
import { OfferComparisonService } from '../services/offerComparison/offerComparisonService';
import { MarketCompensationData, MarketDataProvider } from '../services/offerComparison/types';
import { NormalizedOfferData } from '../types';

vi.mock('axios');

describe('RealAdzunaClient — locks in the where= fix (was location0=, returned HTTP 400)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queries the histogram endpoint with "where", never "location0"', async () => {
    process.env.ADZUNA_APP_ID = 'test-id';
    process.env.ADZUNA_APP_KEY = 'test-key';
    const getMock = vi.mocked(axios.get).mockResolvedValue({ data: { histogram: { '700000': 10, '900000': 10 } } });

    const client = new RealAdzunaClient();
    await client.getSalaryHistogram({ country: 'in', what: 'Software Engineer', location: 'Bengaluru' });

    expect(getMock).toHaveBeenCalledWith(
      expect.stringContaining('histogram'),
      expect.objectContaining({ params: expect.objectContaining({ where: 'Bengaluru' }) })
    );
    const callArgs = getMock.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(callArgs.params).not.toHaveProperty('location0');
  });

  it('omits the location filter entirely when no location is given', async () => {
    process.env.ADZUNA_APP_ID = 'test-id';
    process.env.ADZUNA_APP_KEY = 'test-key';
    const getMock = vi.mocked(axios.get).mockResolvedValue({ data: { histogram: { '700000': 10 } } });

    const client = new RealAdzunaClient();
    await client.getSalaryHistogram({ country: 'in', what: 'Software Engineer' });

    const callArgs = getMock.mock.calls[0][1] as { params: Record<string, unknown> };
    expect(callArgs.params).not.toHaveProperty('where');
  });
});

function makeFakeClient(opts: {
  configured?: boolean;
  histogram?: Record<string, number> | null;
  throws?: boolean;
}): AdzunaClient {
  return {
    isConfigured: () => opts.configured ?? true,
    getSalaryHistogram: vi.fn(async () => {
      if (opts.throws) throw new Error('simulated Adzuna outage');
      return opts.histogram === undefined ? {} : opts.histogram;
    })
  };
}

const offerWithSalary = (fixed: number, role = 'Software Engineer', currency = 'INR'): NormalizedOfferData => ({
  companyName: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  candidateName: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  role: { value: role, status: 'found', confidence: 0.9, evidence: { sourceText: role, sourcePage: 1, sourceLocation: 'p1' } },
  fixedSalary: { value: fixed, status: 'found', confidence: 0.9, evidence: { sourceText: `Fixed salary ${fixed}`, sourcePage: 2, sourceLocation: 'p2' } },
  variableSalary: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  joiningBonus: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  currency: { value: currency, status: 'found', confidence: 1, evidence: { sourceText: currency, sourcePage: 2, sourceLocation: 'p2' } },
  probationPeriodMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  noticePeriodDays: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  hasBond: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  bondDurationMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  bondBuyoutAmount: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
  hasNonCompete: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } }
});

const unavailableResearch = { status: 'unavailable' as const, reason: 'company_name_unverified' as const };
const availableResearch = {
  status: 'available' as const,
  result: { companyName: 'Acme Corp', companyIdentityConfidence: 'high' as const, signals: [], sources: [], researchedAt: new Date().toISOString() }
};

describe('deriveBenchmarkFromHistogram', () => {
  it('successful histogram -> derives min/median/max using grouped-data estimation', () => {
    const histogram = { '700000': 10, '900000': 20, '1100000': 10 };
    const result = deriveBenchmarkFromHistogram(histogram);

    expect(result).not.toBeNull();
    expect(result?.minimum).toBe(700000);
    expect(result?.maximum).toBe(1300000); // top bucket lower bound (1100000) + inferred width (200000)
    expect(result?.totalSample).toBe(40);
    // median should fall inside the 900000 bucket somewhere between 800000 (cumulative before) and 900000 boundary logic
    expect(result?.median).toBeGreaterThanOrEqual(700000);
    expect(result?.median).toBeLessThanOrEqual(1100000);
  });

  it('empty histogram -> null', () => {
    expect(deriveBenchmarkFromHistogram({})).toBeNull();
  });

  it('single non-zero bucket -> null (cannot infer spread/width)', () => {
    expect(deriveBenchmarkFromHistogram({ '700000': 50 })).toBeNull();
  });

  it('below total-sample threshold -> null', () => {
    expect(deriveBenchmarkFromHistogram({ '700000': 1, '900000': 1 })).toBeNull();
  });

  it('a "0" bucket (unspecified/placeholder salaries in real Adzuna data) is excluded, never presented as a genuine minimum', () => {
    const result = deriveBenchmarkFromHistogram({ '0': 500, '700000': 10, '900000': 20, '1100000': 10 });
    expect(result?.minimum).toBe(700000);
    expect(result?.minimum).not.toBe(0);
  });

  it('malformed entries (non-numeric keys/values) are ignored, not fabricated', () => {
    const result = deriveBenchmarkFromHistogram({ 'not-a-number': 100, '700000': 3, '900000': 3 } as unknown as Record<string, number>);
    // total sample from valid buckets only = 6, below MIN_TOTAL_VACANCIES(5)? 6 >= 5 so should derive
    expect(result).not.toBeNull();
    expect(result?.minimum).toBe(700000);
  });
});

describe('normalizeRole / normalizeLocation', () => {
  it('strips seniority modifiers but keeps the original role too', () => {
    const result = normalizeRole('Senior Software Engineer');
    expect(result.originalRole).toBe('Senior Software Engineer');
    expect(result.normalizedRole.toLowerCase()).toContain('software engineer');
    expect(result.normalizedRole.toLowerCase()).not.toContain('senior');
  });

  it('does not mangle a role with no seniority modifier', () => {
    const result = normalizeRole('Software Engineer');
    expect(result.normalizedRole).toBe('Software Engineer');
  });

  it('normalizes known city aliases', () => {
    expect(normalizeLocation('Bangalore').normalizedLocation).toBe('Bengaluru');
    expect(normalizeLocation('bengaluru, karnataka').normalizedLocation).toBe('Bengaluru');
  });

  it('leaves an unrecognized location unchanged rather than guessing', () => {
    expect(normalizeLocation('Some Random Town').normalizedLocation).toBe('Some Random Town');
  });
});

describe('RealMarketDataProvider', () => {
  it('successful response -> returns a benchmark with a clean, credential-free source URL', async () => {
    const client = makeFakeClient({ histogram: { '700000': 10, '900000': 20, '1100000': 10 } });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'INR' });

    expect(result).not.toBeNull();
    expect(result?.source.url).not.toContain('app_key');
    expect(result?.source.url).not.toContain('app_id');
    expect(result?.source.publisher).toBe('Adzuna');
    expect(result?.confidence).toBe('low'); // no location provided
  });

  it('empty histogram -> null', async () => {
    const client = makeFakeClient({ histogram: {} });
    const provider = new RealMarketDataProvider(client);
    expect(await provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'INR' })).toBeNull();
  });

  it('malformed/null histogram from client -> null, no throw', async () => {
    const client = makeFakeClient({ histogram: null });
    const provider = new RealMarketDataProvider(client);
    await expect(provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'INR' })).resolves.toBeNull();
  });

  it('missing credentials -> null, client.getSalaryHistogram never called', async () => {
    const client = makeFakeClient({ configured: false });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'INR' });

    expect(result).toBeNull();
    expect(client.getSalaryHistogram).not.toHaveBeenCalled();
  });

  it('client throws (timeout/API failure) -> resolves to null, never throws', async () => {
    const client = makeFakeClient({ throws: true });
    const provider = new RealMarketDataProvider(client);
    await expect(provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'INR' })).resolves.toBeNull();
  });

  it('unsupported currency -> no API call attempted', async () => {
    const client = makeFakeClient({ histogram: { '700000': 10, '900000': 20 } });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', currency: 'JPY' });

    expect(result).toBeNull();
    expect(client.getSalaryHistogram).not.toHaveBeenCalled();
  });

  it('role and location are normalized before querying the client', async () => {
    const client = makeFakeClient({ histogram: { '700000': 10, '900000': 20, '1100000': 10 } });
    const provider = new RealMarketDataProvider(client);
    await provider.getCompensationBenchmark({ role: 'Senior Software Engineer', location: 'Bangalore', currency: 'INR' });

    expect(client.getSalaryHistogram).toHaveBeenCalledWith(
      expect.objectContaining({ country: 'in', location: 'Bengaluru' })
    );
    const call = (client.getSalaryHistogram as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.what.toLowerCase()).not.toContain('senior');
  });

  it('with location and a large sample -> confidence upgrades to medium (never high)', async () => {
    const client = makeFakeClient({ histogram: { '700000': 15, '900000': 15, '1100000': 15 } });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', location: 'Bengaluru', currency: 'INR' });

    expect(result?.confidence).toBe('medium');
  });

  it('"Remote - India" is not a real place -- treated as no location, never sent as a nonsense place-name query', async () => {
    const client = makeFakeClient({ histogram: { '700000': 10, '900000': 20, '1100000': 10 } });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', location: 'Remote - India', currency: 'INR' });

    expect(client.getSalaryHistogram).toHaveBeenCalledWith(expect.objectContaining({ location: undefined }));
    expect(result?.location).toBeUndefined();
  });

  it('experienceLevel is echoed on the result but never used to filter the query', async () => {
    const client = makeFakeClient({ histogram: { '700000': 10, '900000': 20, '1100000': 10 } });
    const provider = new RealMarketDataProvider(client);
    const result = await provider.getCompensationBenchmark({ role: 'Software Engineer', experienceLevel: 'entry', currency: 'INR' });

    const call = (client.getSalaryHistogram as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.what.toLowerCase()).not.toContain('entry');
    expect(result?.experienceLevel).toBe('entry');
  });
});

describe('combineMarketData', () => {
  const dataAt = (median: number): MarketCompensationData => ({
    role: 'Software Engineer', currency: 'INR', median,
    source: { title: 'x', url: 'https://x.com', sourceType: 'job_market' },
    retrievedAt: new Date().toISOString(), confidence: 'low'
  });

  it('no candidates -> none', () => {
    expect(combineMarketData([]).status).toBe('none');
  });

  it('single candidate -> single, used as primary', () => {
    const result = combineMarketData([dataAt(900000)]);
    expect(result.status).toBe('single');
    expect(result.primary?.median).toBe(900000);
  });

  it('agreeing sources (small divergence) -> agreeing, primary set', () => {
    const result = combineMarketData([dataAt(900000), dataAt(950000)]);
    expect(result.status).toBe('agreeing');
    expect(result.primary).toBeDefined();
  });

  it('conflicting sources (large divergence) -> conflicting, no primary chosen', () => {
    const result = combineMarketData([dataAt(700000), dataAt(1500000)]);
    expect(result.status).toBe('conflicting');
    expect(result.primary).toBeUndefined();
    expect(result.all).toHaveLength(2);
  });
});

describe('OfferComparisonService — market benchmark boundaries', () => {
  const providerWithBenchmark = (benchmark: Partial<MarketCompensationData>): MarketDataProvider => ({
    getCompensationBenchmark: async (): Promise<MarketCompensationData> => ({
      role: 'Software Engineer', currency: 'INR', minimum: 800000, median: 1000000, maximum: 1200000,
      source: { title: 'Adzuna salary distribution', url: 'https://www.adzuna.in/search?q=Software+Engineer', publisher: 'Adzuna', sourceType: 'job_market' },
      retrievedAt: new Date().toISOString(), confidence: 'low',
      ...benchmark
    })
  });

  it('experienceLevel present on the benchmark -> explanation discloses the source has no experience segmentation', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({ location: 'Bengaluru', experienceLevel: 'entry' }));
    const result = await service.compare(offerWithSalary(500000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.explanation).toContain('does not provide an experience-specific salary distribution');
    // Never labeled as if it were a genuine experience-segmented figure.
    expect(insight?.explanation).not.toMatch(/0[-–]2 years market salary/i);
  });

  it('below range -> caution severity', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(500000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.severity).toBe('caution');
  });

  it('within range -> neutral severity', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(1000000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.severity).toBe('neutral');
  });

  it('above range -> positive severity', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(1500000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.severity).toBe('positive');
  });

  it('exact minimum boundary -> neutral, not caution', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(800000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.severity).toBe('neutral');
  });

  it('exact maximum boundary -> neutral, not positive', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(1200000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.severity).toBe('neutral');
  });

  it('evidence includes a market_data entry with a real source URL and title', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({}));
    const result = await service.compare(offerWithSalary(500000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    const marketEvidence = insight?.evidence.find(e => e.evidenceType === 'market_data');
    expect(marketEvidence?.sourceUrl).toBeTruthy();
    expect(marketEvidence?.sourceTitle).toBeTruthy();
  });

  it('conflicting internal sources -> limitation, no fabricated single-range insight', async () => {
    // Simulate a provider whose single call already represents disagreement by
    // directly exercising combineMarketData via two differing benchmarks is
    // covered above; here we confirm compareCompensation's null/insufficient
    // path still yields the correct limitation wording end-to-end.
    const nullLikeProvider: MarketDataProvider = { getCompensationBenchmark: async () => null };
    const service = new OfferComparisonService(nullLikeProvider);
    const result = await service.compare(offerWithSalary(500000), availableResearch, []);
    expect(result.limitations).toContain('Insufficient reliable salary benchmark data was available.');
  });

  it('market provider throws -> only compensation degrades, employment-terms insights survive', async () => {
    const throwingProvider: MarketDataProvider = { getCompensationBenchmark: async () => { throw new Error('simulated Adzuna outage'); } };
    const service = new OfferComparisonService(throwingProvider);
    const flags = [{
      id: 'id_TERM_BOND_PRESENT', type: 'risk' as const, severity: 'medium' as const, title: 'TERM_BOND_PRESENT', reason: 'Bond present',
      evidence: [{ sourceText: 'bond evidence', sourcePage: 1, sourceLocation: 'p1' }],
      ruleId: 'TERM_BOND_PRESENT', sourceFieldIds: ['hasBond'], jurisdiction: 'IN', disclaimerRequired: true
    }];
    const result = await service.compare(offerWithSalary(500000), availableResearch, flags);

    expect(result.status).not.toBe('unavailable');
    expect(result.limitations).toContain('Market compensation data was unavailable.');
    expect(result.insights.find(i => i.id === 'TERM_BOND_PRESENT')).toBeDefined();
    expect(result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK')).toBeUndefined();
  });

  it('missing location never silently substitutes a location -- benchmark stays location-less and low-confidence', async () => {
    const service = new OfferComparisonService(providerWithBenchmark({ location: undefined, confidence: 'low' }));
    const result = await service.compare(offerWithSalary(500000), availableResearch, []);
    const insight = result.insights.find(i => i.id === 'CMP_COMPENSATION_BENCHMARK');
    expect(insight?.explanation).toContain('does not include sufficient location or experience context');
    expect(insight?.confidence).toBe('low');
  });
});

describe('Pipeline-level: unavailable company research still allows offer analysis to succeed regardless of market data', () => {
  it('unavailable company research short-circuits comparison before market data is even attempted', async () => {
    const spyProvider: MarketDataProvider = { getCompensationBenchmark: vi.fn(async () => null) };
    const service = new OfferComparisonService(spyProvider);
    const result = await service.compare(offerWithSalary(500000), unavailableResearch, []);

    expect(result.status).toBe('unavailable');
    expect(spyProvider.getCompensationBenchmark).not.toHaveBeenCalled();
  });
});

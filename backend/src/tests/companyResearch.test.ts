import { describe, it, expect, vi } from 'vitest';
import { CompanyResearchService } from '../services/companyResearch/companyResearchService';
import { RawSearchResult, SearchClient } from '../services/companyResearch/types';

function makeFakeSearchClient(opts: {
  configured?: boolean;
  responses?: RawSearchResult[][];
  throwOn?: number; // 0-indexed call to throw on
}): SearchClient {
  let call = 0;
  return {
    isConfigured: () => opts.configured ?? true,
    search: vi.fn(async (): Promise<RawSearchResult[]> => {
      const idx = call++;
      if (opts.throwOn === idx) {
        throw new Error('simulated search provider failure');
      }
      return opts.responses?.[idx] ?? [];
    })
  };
}

const now = new Date().toISOString();

describe('CompanyResearchService', () => {
  it('valid company: agreeing domains across both queries yields high identity confidence', async () => {
    const client = makeFakeSearchClient({
      responses: [
        [{ title: 'Acme Corp - Official Site', url: 'https://acme.com/about', content: 'Acme Corp is headquartered in Bengaluru, India.' }],
        [{ title: 'Acme Corp raises Series B', url: 'https://acme.com/news/funding', content: 'Acme Corp raised $10M in a funding round.' }]
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    expect(outcome.result.companyIdentityConfidence).toBe('high');
    expect(outcome.result.officialWebsite).toBe('https://acme.com/about');
  });

  it('ambiguous company: disagreeing domains yields low identity confidence, never fabricates a match', async () => {
    const client = makeFakeSearchClient({
      responses: [
        [{ title: 'Acme Corp (UK)', url: 'https://acme-uk-holdings.example/about', content: 'A UK holding company.' }],
        [{ title: 'Acme Corp (unrelated)', url: 'https://totally-different.example/news', content: 'Some unrelated company news.' }]
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    expect(outcome.result.companyIdentityConfidence).toBe('low');
  });

  it('missing company name: returns company_name_unverified without calling the search client', async () => {
    const client = makeFakeSearchClient({ responses: [[], []] });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('   ');

    expect(outcome).toEqual({ status: 'unavailable', reason: 'company_name_unverified' });
    expect(client.search).not.toHaveBeenCalled();
  });

  it('provider not configured: returns provider_not_configured without calling search', async () => {
    const client = makeFakeSearchClient({ configured: false });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome).toEqual({ status: 'unavailable', reason: 'provider_not_configured' });
    expect(client.search).not.toHaveBeenCalled();
  });

  it('empty results from both queries: returns research_provider_error, not a fabricated result', async () => {
    const client = makeFakeSearchClient({ responses: [[], []] });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Totally Unknown Company Xyzzy');

    expect(outcome).toEqual({ status: 'unavailable', reason: 'research_provider_error' });
  });

  it('search throws: resolves to research_provider_error, never throws out of researchCompany', async () => {
    const client = makeFakeSearchClient({ throwOn: 0 });
    const service = new CompanyResearchService(client);
    await expect(service.researchCompany('Acme Corp')).resolves.toEqual({
      status: 'unavailable',
      reason: 'research_provider_error'
    });
  });

  it('every signal.evidence sourceId resolves to an entry in sources[]', async () => {
    const client = makeFakeSearchClient({
      responses: [
        [{ title: 'Acme Corp', url: 'https://acme.com', content: 'Acme Corp official site.' }],
        [
          { title: 'Acme Corp announces layoffs', url: 'https://reuters.com/acme-layoffs', content: 'Acme Corp laid off 200 employees.', publishedAt: now },
          { title: 'Acme Corp is hiring', url: 'https://acme.com/careers', content: 'Acme Corp is hiring across engineering teams.' }
        ]
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    const sourceIds = new Set(outcome.result.sources.map(s => s.id));
    for (const signal of outcome.result.signals) {
      for (const evidence of signal.evidence) {
        expect(sourceIds.has(evidence.sourceId)).toBe(true);
      }
    }
    // Reuters should classify as a 'news' source with medium confidence
    const layoffSignal = outcome.result.signals.find(s => s.type === 'layoffs');
    expect(layoffSignal).toBeDefined();
    expect(layoffSignal?.confidence).toBe('medium');
  });

  it('never attaches evidence about an unrelated company just because it matched a broad query', async () => {
    const client = makeFakeSearchClient({
      responses: [
        // Identity result doesn't mention "Nosuch Ventures" either -- fully generic/irrelevant.
        [{ title: 'Venture Capital Homepage', url: 'https://somevc.example', content: 'A generic venture capital firm site.' }],
        [
          // Unrelated companies that happened to match the broad query -- neither mentions "Nosuch Ventures".
          { title: 'Fountain raises $100M Series C', url: 'https://fortune.com/fountain-funding', content: 'Fountain, a hiring platform, raised $100 million in Series C funding.' },
          { title: 'UniQure restructuring cuts 300 jobs', url: 'https://biopharmadive.com/uniqure', content: 'The job cuts affect 65% of UniQure workforce.' }
        ]
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Nosuch Ventures Inc');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    expect(outcome.result.companyIdentityConfidence).toBe('low');
    expect(outcome.result.signals).toEqual([]);
    expect(outcome.result.sources).toEqual([]);
    expect(outcome.result.officialWebsite).toBeUndefined();
  });

  it('officialWebsite claim is backed by a registered source', async () => {
    const client = makeFakeSearchClient({
      responses: [
        [{ title: 'Acme Corp - Official Site', url: 'https://acme.com/about', content: 'Acme Corp homepage.' }],
        []
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    expect(outcome.result.officialWebsite).toBe('https://acme.com/about');
    expect(outcome.result.sources.some(s => s.url === 'https://acme.com/about')).toBe(true);
  });

  it('a result matching no signal keyword is dropped, not labeled "other"', async () => {
    const client = makeFakeSearchClient({
      responses: [
        [{ title: 'Acme Corp', url: 'https://acme.com', content: 'Acme Corp official site.' }],
        [{ title: 'Acme Corp holiday party recap', url: 'https://blog.example/acme-party', content: 'The team enjoyed a nice holiday party this year.' }]
      ]
    });
    const service = new CompanyResearchService(client);
    const outcome = await service.researchCompany('Acme Corp');

    expect(outcome.status).toBe('available');
    if (outcome.status !== 'available') return;
    expect(outcome.result.signals.find(s => s.summary.includes('holiday party'))).toBeUndefined();
  });
});

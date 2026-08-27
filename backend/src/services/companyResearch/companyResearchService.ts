import {
  CompanyIdentity,
  CompanyResearchContext,
  CompanyResearchOutcome,
  CompanyResearchProvider,
  CompanyResearchResult,
  CompanySignal,
  RawSearchResult,
  ResearchConfidence,
  ResearchSource,
  SearchClient,
  SignalType
} from './types';
import { tavilySearchProvider } from './providers/tavilySearchProvider';

const NEWS_DOMAINS = new Set([
  'reuters.com', 'bloomberg.com', 'techcrunch.com', 'economictimes.indiatimes.com',
  'livemint.com', 'moneycontrol.com', 'business-standard.com', 'thehindubusinessline.com'
]);
const EMPLOYMENT_DOMAINS = new Set(['glassdoor.com', 'ambitionbox.com', 'indeed.com', 'linkedin.com']);
const GOVERNMENT_DOMAIN_HINTS = ['.gov', 'mca.gov.in', 'zaubacorp.com'];

const SIGNAL_KEYWORDS: { type: SignalType; patterns: RegExp[] }[] = [
  { type: 'layoffs', patterns: [/laid off/i, /layoffs?/i, /job cuts?/i] },
  { type: 'funding', patterns: [/raised \$/i, /funding round/i, /series [a-e]\b/i, /secured funding/i] },
  { type: 'acquisition', patterns: [/acquir(e|ed|es|ing|ition)/i, /merger/i] },
  { type: 'legal', patterns: [/lawsuit/i, /\bsued\b/i, /legal action/i, /court case/i] },
  { type: 'restructuring', patterns: [/restructuring/i, /reorgani[sz]ation/i] },
  { type: 'hiring', patterns: [/is hiring/i, /expanding (its |the )?team/i, /hiring spree/i] }
];

function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function classifySourceType(domain: string | null, officialDomain: string | null): ResearchSource['sourceType'] {
  if (!domain) return 'other';
  if (officialDomain && domain === officialDomain) return 'official';
  if (GOVERNMENT_DOMAIN_HINTS.some(hint => domain.includes(hint))) return 'government';
  if (NEWS_DOMAINS.has(domain)) return 'news';
  if (EMPLOYMENT_DOMAINS.has(domain)) return 'employment';
  return 'other';
}

function confidenceForSourceType(sourceType: ResearchSource['sourceType']): ResearchConfidence {
  if (sourceType === 'official' || sourceType === 'government') return 'high';
  if (sourceType === 'news' || sourceType === 'financial') return 'medium';
  return 'low';
}

function classifySignalType(text: string): SignalType | null {
  for (const { type, patterns } of SIGNAL_KEYWORDS) {
    if (patterns.some(p => p.test(text))) return type;
  }
  return null;
}

const GENERIC_COMPANY_SUFFIXES = /\b(inc|incorporated|ltd|limited|llc|corp|corporation|pvt|private|co)\b\.?/gi;

function coreCompanyName(companyName: string): string {
  return companyName
    .replace(GENERIC_COMPANY_SUFFIXES, ' ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// A broad search query can return results about an entirely different,
// similarly-named or unrelated company (especially for obscure/fake names).
// Never treat a result as evidence unless the company itself is actually
// mentioned in it — this is what stops us from silently attaching another
// company's layoffs/funding news to the one being researched.
function mentionsCompany(result: RawSearchResult, companyName: string): boolean {
  const haystack = `${result.title} ${result.content}`.toLowerCase();
  const core = coreCompanyName(companyName);
  return core.length > 0 && haystack.includes(core);
}

function extractHeadquarters(text: string): { headquarters?: string; country?: string } {
  const match = text.match(/headquartered in ([A-Z][a-zA-Z\s]+?),?\s*([A-Z][a-zA-Z\s]+)?[.,]/);
  if (!match) return {};
  return {
    headquarters: match[1]?.trim(),
    country: match[2]?.trim() || undefined
  };
}

export class CompanyResearchService implements CompanyResearchProvider {
  constructor(private readonly searchClient: SearchClient) {}

  async researchCompany(companyName: string, context?: CompanyResearchContext): Promise<CompanyResearchOutcome> {
    if (!companyName || !companyName.trim()) {
      return { status: 'unavailable', reason: 'company_name_unverified' };
    }

    if (!this.searchClient.isConfigured()) {
      console.warn('[CompanyResearch] No search provider configured, skipping research');
      return { status: 'unavailable', reason: 'provider_not_configured' };
    }

    console.log(`[CompanyResearch] Company research started for "${companyName}"`);

    try {
      const identityQuery = context?.location || context?.industry
        ? `"${companyName}" official website ${context.location || ''} ${context.industry || ''}`.trim()
        : `"${companyName}" official website`;
      const signalsQuery = `"${companyName}" news layoffs funding acquisition restructuring legal hiring`;

      const [rawIdentityResults, rawSignalResults] = await Promise.all([
        this.searchClient.search(identityQuery),
        this.searchClient.search(signalsQuery)
      ]);
      const rawCount = rawIdentityResults.length + rawSignalResults.length;
      console.log(`[CompanyResearch] Search completed: ${rawCount} raw results`);

      if (rawCount === 0) {
        console.warn('[CompanyResearch] No results returned for either query');
        return { status: 'unavailable', reason: 'research_provider_error' };
      }

      // Discard anything that doesn't actually mention the company — a broad
      // query can surface results about a differently-named or unrelated
      // company, especially for obscure or fake names.
      const identityResults = rawIdentityResults.filter(r => mentionsCompany(r, companyName));
      const signalResults = rawSignalResults.filter(r => mentionsCompany(r, companyName));

      if (identityResults.length === 0 && signalResults.length === 0) {
        console.warn('[CompanyResearch] No results genuinely mention this company; returning low-confidence empty result');
        return {
          status: 'available',
          result: {
            companyName,
            companyIdentityConfidence: 'low',
            signals: [],
            sources: [],
            researchedAt: new Date().toISOString()
          }
        };
      }

      const { officialWebsite, officialDomain, confidence } = this.resolveIdentity(identityResults, signalResults);
      console.log(`[CompanyResearch] Company identity resolved (confidence: ${confidence})`);

      const sources: ResearchSource[] = [];
      const sourceIdByUrl = new Map<string, string>();
      const retrievedAt = new Date().toISOString();

      const registerSource = (item: RawSearchResult): string => {
        const existing = sourceIdByUrl.get(item.url);
        if (existing) return existing;
        const domain = extractDomain(item.url);
        const id = `src_${sources.length + 1}`;
        sources.push({
          id,
          title: item.title,
          url: item.url,
          publisher: domain || undefined,
          publishedAt: item.publishedAt,
          retrievedAt,
          sourceType: classifySourceType(domain, officialDomain)
        });
        sourceIdByUrl.set(item.url, id);
        return id;
      };

      // The officialWebsite claim needs its own source registered too, not
      // just fields that happened to be regex-extracted from it.
      if (identityResults[0] && officialWebsite) {
        registerSource(identityResults[0]);
      }

      let identity: CompanyIdentity | undefined;
      for (const item of identityResults) {
        const hq = extractHeadquarters(item.content);
        if (hq.headquarters) {
          identity = { ...identity, ...hq };
          registerSource(item);
        }
      }

      const signals: CompanySignal[] = [];
      for (const item of signalResults) {
        const type = classifySignalType(item.content) || classifySignalType(item.title);
        if (!type) continue; // don't fabricate a signal for content that doesn't clearly match a category

        const sourceId = registerSource(item);
        const source = sources.find(s => s.id === sourceId)!;
        signals.push({
          type,
          summary: item.title,
          confidence: confidenceForSourceType(source.sourceType),
          evidence: [{ claim: item.content.slice(0, 300), sourceId, confidence: confidenceForSourceType(source.sourceType) }]
        });
      }

      const result: CompanyResearchResult = {
        companyName,
        officialWebsite,
        companyIdentityConfidence: confidence,
        identity,
        signals: signals.slice(0, 5),
        sources,
        researchedAt: retrievedAt
      };

      console.log(`[CompanyResearch] Company research completed: ${sources.length} sources, ${signals.length} signals`);
      return { status: 'available', result };
    } catch (err) {
      console.error('[CompanyResearch] Research provider error:', err instanceof Error ? err.message : 'unknown error');
      return { status: 'unavailable', reason: 'research_provider_error' };
    }
  }

  private resolveIdentity(
    identityResults: RawSearchResult[],
    signalResults: RawSearchResult[]
  ): { officialWebsite?: string; officialDomain: string | null; confidence: ResearchConfidence } {
    const identityDomains = identityResults.map(r => extractDomain(r.url)).filter((d): d is string => Boolean(d));
    const signalDomains = signalResults.map(r => extractDomain(r.url)).filter((d): d is string => Boolean(d));

    const topIdentityDomain = identityDomains[0] || null;
    if (!topIdentityDomain) {
      return { officialDomain: null, confidence: 'low' };
    }

    // High confidence only when the top identity-query domain also shows up
    // independently in the broader signals query — two queries agreeing.
    const corroborated = signalDomains.includes(topIdentityDomain) || identityDomains.filter(d => d === topIdentityDomain).length > 1;

    return {
      officialWebsite: identityResults[0]?.url,
      officialDomain: topIdentityDomain,
      confidence: corroborated ? 'high' : 'low'
    };
  }
}

export const companyResearchService: CompanyResearchProvider = new CompanyResearchService(tavilySearchProvider);

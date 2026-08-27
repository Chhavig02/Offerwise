export type ResearchConfidence = 'high' | 'medium' | 'low';

export type SourceType = 'official' | 'government' | 'news' | 'financial' | 'employment' | 'other';

export type SignalType =
  | 'company_status'
  | 'layoffs'
  | 'restructuring'
  | 'funding'
  | 'acquisition'
  | 'legal'
  | 'regulatory'
  | 'hiring'
  | 'other';

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  retrievedAt: string;
  sourceType: SourceType;
}

export interface ResearchEvidence {
  claim: string;
  sourceId: string;
  confidence: ResearchConfidence;
}

export interface CompanySignal {
  type: SignalType;
  summary: string;
  confidence: ResearchConfidence;
  evidence: ResearchEvidence[];
}

export interface CompanyIdentity {
  legalName?: string;
  industry?: string;
  headquarters?: string;
  country?: string;
  companyStatus?: string;
}

export interface CompanyResearchResult {
  companyName: string;
  officialWebsite?: string;
  companyIdentityConfidence: ResearchConfidence;
  identity?: CompanyIdentity;
  signals: CompanySignal[];
  sources: ResearchSource[];
  researchedAt: string;
}

export type UnavailableReason = 'company_name_unverified' | 'provider_not_configured' | 'research_provider_error';

export type CompanyResearchOutcome =
  | { status: 'available'; result: CompanyResearchResult }
  | { status: 'unavailable'; reason: UnavailableReason };

export interface CompanyResearchContext {
  location?: string;
  industry?: string;
}

export interface CompanyResearchProvider {
  researchCompany(companyName: string, context?: CompanyResearchContext): Promise<CompanyResearchOutcome>;
}

/**
 * Low-level abstraction over a raw web search API. companyResearchService
 * depends only on this — swapping search vendors means writing a new
 * SearchClient implementation, nothing else.
 */
export interface RawSearchResult {
  title: string;
  url: string;
  content: string;
  publishedAt?: string;
}

export interface SearchClient {
  isConfigured(): boolean;
  search(query: string): Promise<RawSearchResult[]>;
}

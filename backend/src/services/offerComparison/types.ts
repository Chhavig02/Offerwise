export type InsightCategory =
  | 'compensation'
  | 'company'
  | 'employment_terms'
  | 'market_context'
  | 'positive_signal'
  | 'caution';

export type InsightSeverity = 'positive' | 'neutral' | 'caution';
export type InsightConfidence = 'high' | 'medium' | 'low';
export type EvidenceType = 'offer_letter' | 'company_research' | 'market_data';

export interface ComparisonEvidence {
  sourceId?: string;
  sourceUrl?: string;
  sourceTitle?: string;
  claim: string;
  evidenceType: EvidenceType;
}

export interface OfferComparisonInsight {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  explanation: string;
  evidence: ComparisonEvidence[];
  confidence: InsightConfidence;
}

export interface OfferComparisonResult {
  status: 'available' | 'partial' | 'unavailable';
  insights: OfferComparisonInsight[];
  summary?: string;
  comparedFields: string[];
  limitations: string[];
  marketCompensation?: MarketCompensationData | null;
}

export type MarketSourceType = 'salary_platform' | 'government' | 'industry_report' | 'job_market' | 'other';

export interface MarketDataSource {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  sourceType: MarketSourceType;
}

/**
 * A derived benchmark -- never presented as an exact salary statistic.
 * Phase 3's RealMarketDataProvider (Adzuna) derives min/median/max from a
 * salary-bracket distribution using a standard grouped-data estimation
 * method; NullMarketDataProvider (the fallback when no provider is
 * configured, or as the default in tests) always returns null instead of
 * fabricating one.
 */
export interface MarketCompensationData {
  role: string;
  location?: string;
  experienceLevel?: string;
  currency: string;
  minimum?: number;
  median?: number;
  maximum?: number;
  source: MarketDataSource;
  retrievedAt: string;
  confidence: InsightConfidence;
}

export interface MarketCompensationQuery {
  role: string;
  location?: string;
  experienceLevel?: string;
  industry?: string;
  currency: string;
}

export interface MarketDataProvider {
  getCompensationBenchmark(query: MarketCompensationQuery): Promise<MarketCompensationData | null>;
}

/**
 * Not wired into compare() logic yet -- defined so a future phase can pass
 * user preferences without changing this phase's types. Do not require it.
 */
export interface UserOfferPreferences {
  preferredLocation?: string;
  minimumSalary?: number;
  preferredRole?: string;
  riskTolerance?: 'low' | 'medium' | 'high';
  remotePreference?: 'remote' | 'hybrid' | 'onsite';
}

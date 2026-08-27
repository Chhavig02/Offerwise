export type FieldStatus = 'found' | 'not_specified' | 'uncertain';

export interface Evidence {
  sourceText: string | null;
  sourcePage: number | null;
  sourceLocation: string | null;
}

export interface ExtractedField<T> {
  value: T | null;
  status: FieldStatus;
  confidence: number;
  evidence: Evidence;
}

export interface Flag {
  id: string;
  type: 'risk' | 'information_gap' | 'document' | 'opportunity' | 'positive';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  reason: string;
  evidence: Evidence[];
  ruleId: string | null;
  sourceFieldIds: string[];
  jurisdiction: string | null;
  disclaimerRequired: boolean;
  scoreImpact?: number;
}

// Representing the structured data extracted from the offer letter
export interface NormalizedOfferData {
  companyName: ExtractedField<string>;
  candidateName: ExtractedField<string>;
  role: ExtractedField<string>;
  fixedSalary: ExtractedField<number>;
  variableSalary: ExtractedField<number>;
  joiningBonus: ExtractedField<number>;
  currency: ExtractedField<string>;
  probationPeriodMonths: ExtractedField<number>;
  noticePeriodDays: ExtractedField<number>;
  hasBond: ExtractedField<boolean>;
  bondDurationMonths: ExtractedField<number>;
  bondBuyoutAmount: ExtractedField<number>;
  hasNonCompete: ExtractedField<boolean>;
  insurance?: ExtractedField<boolean>;
  relocationAllowance?: ExtractedField<number>;
  hasRelocation?: ExtractedField<boolean>;
  location?: ExtractedField<string>;
  workMode?: ExtractedField<'remote' | 'hybrid' | 'onsite' | 'unknown'>;
  experienceLevel?: ExtractedField<'intern' | 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'unknown'>;
}

export type ResearchConfidence = 'high' | 'medium' | 'low';
export type SourceType = 'official' | 'government' | 'news' | 'financial' | 'employment' | 'other';
export type SignalType =
  | 'company_status' | 'layoffs' | 'restructuring' | 'funding'
  | 'acquisition' | 'legal' | 'regulatory' | 'hiring' | 'other';

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

export type CompanyResearchOutcome =
  | { status: 'available'; result: CompanyResearchResult }
  | { status: 'unavailable'; reason: 'company_name_unverified' | 'provider_not_configured' | 'research_provider_error' };

export type InsightCategory =
  | 'compensation' | 'company' | 'employment_terms' | 'market_context' | 'positive_signal' | 'caution';
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

export interface MarketDataSource {
  title: string;
  url: string;
  publisher?: string;
  publishedAt?: string;
  sourceType: string;
}

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
  confidence: string;
}

export interface OfferComparisonResult {
  status: 'available' | 'partial' | 'unavailable';
  insights: OfferComparisonInsight[];
  summary?: string;
  comparedFields: string[];
  limitations: string[];
  marketCompensation?: MarketCompensationData | null;
}

// Summary shape returned by GET /api/offers (one row per offer, with its latest analysis)
export interface Offer {
  id: string;
  userId: string;
  companyName: string | null;
  status: string;
  storagePath: string | null;
  createdAt: string;
  analysis: {
    score: number;
    createdAt: string;
    extractedData: NormalizedOfferData;
    informationGaps: Flag[];
  } | null;
}

export type Recommendation = 'accept' | 'negotiate' | 'reject' | 'needs_more_information';
export type DecisionConfidence = 'high' | 'medium' | 'low';
export type FactorSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type FactorSource = 'offer_letter' | 'market_data' | 'company_research' | 'rules_engine' | 'information_gap';
export type BasisDimension = 'compensation' | 'contract_terms' | 'market_position' | 'company_profile' | 'completeness';
export type BasisStatus = 'favorable' | 'acceptable' | 'unfavorable' | 'incomplete';

export interface DecisionFactor {
  title: string;
  explanation: string;
  severity: FactorSeverity;
  source: FactorSource;
  evidence?: unknown;
}

export interface DecisionBasis {
  dimension: BasisDimension;
  status: BasisStatus;
  summary: string;
  scoreContribution?: number;
}

export interface DecisionAssessment {
  recommendation: Recommendation;
  confidence: DecisionConfidence;
  summary: string;
  positiveFactors: DecisionFactor[];
  concerns: DecisionFactor[];
  negotiationPriorities: DecisionFactor[];
  beforeAccepting: DecisionFactor[];
  decisionBasis: DecisionBasis[];
  decisionEngineVersion: string;
}

export interface AnalysisResult {
  offer_id: string;
  extraction_version: string;
  rules_version: string;
  flags: Flag[];
  information_gaps: Flag[];
  evidence_flags: Flag[];
  positive_signals: Flag[];
  score: number;
  scam_score: number;
  summary: string;
  negotiation_points: string[];
  affordability: unknown;
  created_at: string;
  user_id?: string;
  extracted_data?: NormalizedOfferData;
  company_research?: CompanyResearchOutcome;
  comparison?: OfferComparisonResult;
  decision?: DecisionAssessment;
}

import { CompanyResearchOutcome } from '@/services/companyResearch/types';
import { OfferComparisonResult } from '@/services/offerComparison/types';
import { DecisionAssessment } from '@/services/decisionEngine/types';

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

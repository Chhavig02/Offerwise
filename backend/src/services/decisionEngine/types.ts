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
  evidence?: any; 
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

import { evaluateOfferDecision, DecisionEngineInput } from '../services/decisionEngine/decisionEngine';
import { NormalizedOfferData } from '@/types';

describe('Decision Engine', () => {
  const baseData: NormalizedOfferData = {
    companyName: { value: 'Test Corp', status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    candidateName: { value: 'John Doe', status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    role: { value: 'Software Engineer', status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    fixedSalary: { value: 100000, status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    variableSalary: { value: 0, status: 'not_specified', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    joiningBonus: { value: 0, status: 'not_specified', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    currency: { value: 'USD', status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    probationPeriodMonths: { value: 3, status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    noticePeriodDays: { value: 30, status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasBond: { value: false, status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondDurationMonths: { value: 0, status: 'not_specified', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    bondBuyoutAmount: { value: 0, status: 'not_specified', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
    hasNonCompete: { value: false, status: 'found', confidence: 1, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } }
  };

  const baseInput: DecisionEngineInput = {
    extractedData: baseData,
    riskFlags: [],
    infoGaps: [],
    opportunities: [],
    companyResearch: { status: 'unavailable', reason: 'provider_not_configured' },
    comparison: { status: 'unavailable', insights: [], comparedFields: [], limitations: [] },
    score: 100
  };

  it('1. Strong offer -> ACCEPT', () => {
    const result = evaluateOfferDecision(baseInput);
    expect(result.recommendation).toBe('accept');
  });

  it('2. Good offer with negotiable contractual issue -> NEGOTIATE', () => {
    const input = { ...baseInput, score: 90, riskFlags: [{ id: '1', type: 'risk' as const, severity: 'high' as const, title: 'Notice', reason: '90 days', evidence: [], ruleId: null, sourceFieldIds: [], jurisdiction: null, disclaimerRequired: false }] };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('negotiate');
  });

  it('3. Poor compensation + severe contractual risks -> REJECT', () => {
    const input: DecisionEngineInput = {
      ...baseInput,
      score: 55,
      extractedData: { ...baseData, fixedSalary: { ...baseData.fixedSalary, value: 50000 } },
      riskFlags: [{ id: '1', type: 'risk' as const, severity: 'critical' as const, title: 'Bond', reason: 'Severe', evidence: [], ruleId: null, sourceFieldIds: [], jurisdiction: null, disclaimerRequired: false }],
      comparison: { status: 'available', insights: [], comparedFields: [], limitations: [], marketCompensation: { role: 'SE', currency: 'USD', median: 100000, source: { title: 'T', url: '', sourceType: 'industry_report' }, retrievedAt: '', confidence: 'high' } }
    };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('reject');
  });

  it('4. Major missing information -> NEEDS_MORE_INFORMATION', () => {
    const input: DecisionEngineInput = { ...baseInput, infoGaps: [{ id: '1', type: 'information_gap' as const, severity: 'critical' as const, title: 'No salary', reason: '', evidence: [], ruleId: null, sourceFieldIds: ['fixedSalary'], jurisdiction: null, disclaimerRequired: false }] };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('needs_more_information');
  });

  it('5. Missing market data -> does not automatically reject', () => {
    const result = evaluateOfferDecision(baseInput);
    expect(result.recommendation).not.toBe('reject');
    expect(result.confidence).toBe('medium');
  });

  it('6. Missing company research -> does not automatically reject', () => {
    const result = evaluateOfferDecision(baseInput);
    expect(result.recommendation).not.toBe('reject');
  });

  it('7. Missing benefits -> information gap, not risk', () => {
    const input: DecisionEngineInput = { ...baseInput, infoGaps: [{ id: '1', type: 'information_gap' as const, severity: 'medium' as const, title: 'No benefits', reason: '', evidence: [], ruleId: null, sourceFieldIds: ['insurance'], jurisdiction: null, disclaimerRequired: false }] };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('accept');
    expect(result.beforeAccepting.length).toBe(1);
  });

  it('8. Employment bond affects decision', () => {
    const input: DecisionEngineInput = { ...baseInput, riskFlags: [{ id: '1', type: 'risk' as const, severity: 'critical' as const, title: 'Bond', reason: '', evidence: [], ruleId: null, sourceFieldIds: ['hasBond'], jurisdiction: null, disclaimerRequired: false }] };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('negotiate'); // It's negotiate because salary isn't poorly below market here.
  });

  it('13. Below-market compensation -> negotiation factor', () => {
    const input: DecisionEngineInput = {
      ...baseInput,
      extractedData: { ...baseData, fixedSalary: { ...baseData.fixedSalary, value: 90000 } },
      comparison: { status: 'available', insights: [], comparedFields: [], limitations: [], marketCompensation: { role: 'SE', currency: 'USD', median: 100000, source: { title: 'T', url: '', sourceType: 'industry_report' }, retrievedAt: '', confidence: 'high' } }
    };
    const result = evaluateOfferDecision(input);
    expect(result.recommendation).toBe('negotiate');
  });

  it('14. Uncertain evidence -> lowers confidence', () => {
    const input: DecisionEngineInput = { ...baseInput, extractedData: { ...baseData, fixedSalary: { ...baseData.fixedSalary, status: 'uncertain' } } };
    const result = evaluateOfferDecision(input);
    expect(result.confidence).toBe('low');
  });

  it('Score 100 -> ACCEPT', () => {
    const result = evaluateOfferDecision({ ...baseInput, score: 100 });
    expect(result.recommendation).toBe('accept');
  });

  it('Score below 50 -> REJECT', () => {
    const result = evaluateOfferDecision({ ...baseInput, score: 40 });
    expect(result.recommendation).toBe('reject');
  });
});

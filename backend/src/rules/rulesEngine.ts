import { NormalizedOfferData, Flag, Evidence } from '@/types';

export function runRulesEngine(data: NormalizedOfferData): Flag[] {
  const flags: Flag[] = [];

  // Helper to create a flag
  const addFlag = (
    ruleId: string,
    type: Flag['type'],
    severity: Flag['severity'],
    title: string,
    reason: string,
    sourceFields: (keyof NormalizedOfferData)[]
  ) => {
    // Only a field that's actually 'found' can contribute evidence to a
    // flag -- a 'not_specified'/'uncertain' field must never surface as
    // evidence even if it happens to carry a stray non-null sourceText.
    const evidence = sourceFields
      .filter(f => data[f]?.status === 'found')
      .map(f => data[f]?.evidence)
      .filter((e): e is Evidence => e !== undefined && e.sourceText !== null);
    
    // Evidence Requirement Audit: No evidence = no material risk flag
    if (type === 'risk' && evidence.length === 0) {
      return; 
    }
    
    flags.push({
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      reason,
      evidence,
      ruleId,
      sourceFieldIds: sourceFields,
      jurisdiction: 'IN', // Default MVP
      disclaimerRequired: type === 'risk'
    });
  };

  // Rule 1: High Variable Pay (>30% of Total Compensation)
  if (data.fixedSalary?.status === 'found' && data.variableSalary?.status === 'found') {
    const fixed = data.fixedSalary.value || 0;
    const variable = data.variableSalary.value || 0;
    const total = fixed + variable;
    if (total > 0 && (variable / total) > 0.3) {
      addFlag(
        'COMP_VARIABLE_HIGH',
        'risk',
        'high',
        'High Variable Pay Component',
        'More than 30% of your compensation is variable, which may be tied to aggressive performance metrics or company performance.',
        ['fixedSalary', 'variableSalary']
      );
    }
  }

  // Rule 2: Extended Probation Period (>6 months)
  if (data.probationPeriodMonths?.status === 'found' && data.probationPeriodMonths.value! > 6) {
    addFlag(
      'TERM_PROBATION_EXTENDED',
      'risk',
      'medium',
      'Extended Probation Period',
      `The probation period is ${data.probationPeriodMonths.value} months. Standard probation is typically 3-6 months.`,
      ['probationPeriodMonths']
    );
  }

  // Rule 3: Training Bond
  if (data.hasBond?.status === 'found' && data.hasBond.value === true) {
    addFlag(
      'TERM_BOND_PRESENT',
      'risk',
      'high',
      'Mandatory Training Bond',
      `This offer includes a training or employment bond of ${data.bondDurationMonths?.value || 'unspecified'} months. You may be liable to pay ${data.bondBuyoutAmount?.value ? data.bondBuyoutAmount.value + ' ' + (data.currency?.value || 'INR') : 'an unspecified penalty'} if you leave early.`,
      ['hasBond', 'bondDurationMonths', 'bondBuyoutAmount']
    );
  }

  // Rule 4: Non-Compete Clause
  if (data.hasNonCompete?.status === 'found' && data.hasNonCompete.value === true) {
    addFlag(
      'LEGAL_NON_COMPETE',
      'risk',
      'medium',
      'Non-Compete Clause Present',
      'This offer restricts you from working for competitors after leaving the company. Note that broad non-competes may be legally unenforceable in certain jurisdictions (e.g., India).',
      ['hasNonCompete']
    );
  }

  // Information Gaps
  if (!data.noticePeriodDays || data.noticePeriodDays.status === 'not_specified') {
    addFlag(
      'GAP_NOTICE_PERIOD',
      'information_gap',
      'low',
      'Missing Notice Period',
      'The offer does not specify the required notice period for resignation or termination.',
      []
    );
  } else if (data.noticePeriodDays.status === 'found' && data.noticePeriodDays.value! >= 90) {
    addFlag(
      'TERM_NOTICE_EXTENDED',
      'risk',
      'medium',
      'Extended Notice Period',
      `A notice period of ${data.noticePeriodDays.value} days is quite long. This restricts your ability to switch jobs quickly.`,
      ['noticePeriodDays']
    );
  }
  
  if (!data.joiningBonus || data.joiningBonus.status === 'not_specified') {
    // Only flag as an opportunity if not found. If explicitly stated as 0, that's 'found'.
    addFlag(
      'GAP_JOINING_BONUS',
      'opportunity',
      'info',
      'Potential for Joining Bonus',
      'There is no mention of a joining or sign-on bonus. You may want to negotiate this.',
      ['joiningBonus']
    );
  }

  if (!data.insurance || data.insurance.status === 'not_specified') {
    addFlag(
      'GAP_INSURANCE',
      'information_gap',
      'low',
      'Missing Insurance Details',
      'The offer does not specify health insurance benefits.',
      []
    );
  }

  if (!data.probationPeriodMonths || data.probationPeriodMonths.status === 'not_specified') {
    addFlag(
      'GAP_PROBATION',
      'information_gap',
      'low',
      'Missing Probation Details',
      'The offer does not clearly specify a probation period.',
      []
    );
  }

  // "No fixed amount given" and "relocation never mentioned" are different
  // facts and must read differently -- hasRelocation distinguishes them.
  if (data.relocationAllowance?.status !== 'found') {
    if (data.hasRelocation?.status === 'found' && data.hasRelocation.value === true) {
      addFlag(
        'GAP_RELOCATION_AMOUNT',
        'information_gap',
        'low',
        'Relocation Policy Present, Amount Unspecified',
        'The offer indicates relocation may be required and expenses will be reimbursed, but does not specify a fixed allowance amount.',
        ['hasRelocation']
      );
    } else if (!(data.hasRelocation?.status === 'found' && data.hasRelocation.value === false)) {
      addFlag(
        'GAP_RELOCATION',
        'information_gap',
        'low',
        'Missing Relocation Policy',
        'The offer does not specify relocation assistance or allowance.',
        []
      );
    }
  }

  // Fields the evidence validator rejected (cited text didn't match the source
  // document) fall into neither the 'found' nor 'not_specified' branches above.
  // Surface them explicitly instead of letting them silently disappear.
  const humanizeFieldName = (key: string) =>
    key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim();

  for (const key of Object.keys(data) as (keyof NormalizedOfferData)[]) {
    if (data[key]?.status === 'uncertain') {
      addFlag(
        `UNVERIFIED_${key.toUpperCase()}`,
        'information_gap',
        'low',
        `Unverified: ${humanizeFieldName(key)}`,
        'We extracted a value for this field, but the cited text did not match the document exactly, so we could not confirm it. Please check this manually in the original offer letter.',
        [key]
      );
    }
  }

  return flags;
}

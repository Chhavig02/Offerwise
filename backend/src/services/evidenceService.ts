import { NormalizedOfferData, ExtractedField } from '@/types';

export function validateEvidence(data: NormalizedOfferData, rawText: string): NormalizedOfferData {
  const normalizedText = rawText.toLowerCase().replace(/\s+/g, ' ');

  const validateField = <T>(field: ExtractedField<T> | undefined) => {
    if (field && field.status === 'found' && field.evidence?.sourceText) {
      const evidenceString = field.evidence.sourceText.toLowerCase().replace(/\s+/g, ' ');
      if (!normalizedText.includes(evidenceString)) {
        console.warn('Hallucination detected for evidence:', field.evidence.sourceText);
        field.status = 'uncertain';
        field.confidence = 0;
        field.evidence.sourceText = null;
      }
    }
  };

  validateField(data.companyName);
  validateField(data.candidateName);
  validateField(data.role);
  validateField(data.fixedSalary);
  validateField(data.variableSalary);
  validateField(data.joiningBonus);
  validateField(data.currency);
  validateField(data.probationPeriodMonths);
  validateField(data.noticePeriodDays);
  validateField(data.hasBond);
  validateField(data.bondDurationMonths);
  validateField(data.bondBuyoutAmount);
  validateField(data.hasNonCompete);
  validateField(data.insurance);
  validateField(data.relocationAllowance);
  validateField(data.hasRelocation);
  validateField(data.location);
  validateField(data.workMode);
  validateField(data.experienceLevel);

  return data;
}

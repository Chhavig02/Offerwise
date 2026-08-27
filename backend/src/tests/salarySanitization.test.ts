import { describe, it, expect } from 'vitest';
import { normalizeExtractedText } from '../services/documentService';
import { sanitizeExtractedData } from '../providers/ai/sanitizeExtractedData';

describe('Salary Extraction & Normalization', () => {
  describe('normalizeExtractedText', () => {
    it('normalizes common corrupted rupee prefixes (e.g. n9,60,000 -> Rs. 9,60,000)', () => {
      const text = 'Your total annual compensation will be n9,60,000 per annum.';
      const normalized = normalizeExtractedText(text);
      expect(normalized).toBe('Your total annual compensation will be Rs. 9,60,000 per annum.');
    });

    it('normalizes without commas if 5 or more digits (e.g. n960000 -> Rs. 960000)', () => {
      const text = 'Base salary: n960000 per annum';
      const normalized = normalizeExtractedText(text);
      expect(normalized).toBe('Base salary: Rs. 960000 per annum');
    });

    it('preserves normal English text containing "n"', () => {
      const text = 'The new notice period is normal and none of the terms are negotiable.';
      const normalized = normalizeExtractedText(text);
      expect(normalized).toBe(text);
    });

    it('does not replace "n" when not preceding a digit/number pattern (e.g. version v1 or a1)', () => {
      const text = 'Please check page n or section a1 or version v1.';
      const normalized = normalizeExtractedText(text);
      expect(normalized).toBe(text);
    });

    it('does not replace "n" followed by a 4-digit number without comma (e.g. year 2026)', () => {
      const text = 'Created in year 2026';
      const normalized = normalizeExtractedText(text);
      expect(normalized).toBe(text);
    });
  });

  describe('sanitizeExtractedData numberField parsing', () => {
    const createRawDataWithSalary = (val: unknown) => ({
      companyName: { value: 'NovaTech', status: 'found', confidence: 0.9, evidence: { sourceText: 'NovaTech', sourcePage: 1, sourceLocation: 'Header' } },
      candidateName: { value: 'Chhavi', status: 'found', confidence: 0.9, evidence: { sourceText: 'Chhavi', sourcePage: 1, sourceLocation: 'To' } },
      role: { value: 'Engineer', status: 'found', confidence: 0.9, evidence: { sourceText: 'Engineer', sourcePage: 1, sourceLocation: 'Role' } },
      fixedSalary: { value: val, status: 'found', confidence: 0.9, evidence: { sourceText: String(val), sourcePage: 1, sourceLocation: 'Comp' } },
      variableSalary: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
      joiningBonus: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
      currency: { value: 'INR', status: 'found', confidence: 0.9, evidence: { sourceText: 'INR', sourcePage: 1, sourceLocation: 'Comp' } },
      probationPeriodMonths: { value: 6, status: 'found', confidence: 0.9, evidence: { sourceText: '6 months', sourcePage: 1, sourceLocation: 'Prob' } },
      noticePeriodDays: { value: 90, status: 'found', confidence: 0.9, evidence: { sourceText: '90 days', sourcePage: 1, sourceLocation: 'Notice' } },
      hasBond: { value: false, status: 'found', confidence: 0.9, evidence: { sourceText: 'No bond', sourcePage: 1, sourceLocation: 'Bond' } },
      bondDurationMonths: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
      bondBuyoutAmount: { value: null, status: 'not_specified', confidence: 0, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } },
      hasNonCompete: { value: false, status: 'found', confidence: 0.9, evidence: { sourceText: 'No non-compete', sourcePage: 1, sourceLocation: 'NC' } }
    });

    it('parses salary with rupee symbol (e.g. ₹12,00,000 -> 1200000)', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('₹12,00,000'));
      expect(sanitized.fixedSalary.value).toBe(1200000);
      expect(sanitized.fixedSalary.status).toBe('found');
    });

    it('parses salary with Rs. (e.g. Rs. 12,00,000 -> 1200000)', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('Rs. 12,00,000'));
      expect(sanitized.fixedSalary.value).toBe(1200000);
    });

    it('parses salary with INR suffix (e.g. 12,00,000 INR -> 1200000)', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('12,00,000 INR'));
      expect(sanitized.fixedSalary.value).toBe(1200000);
    });

    it('parses salary with commas (e.g. 12,00,000 -> 1200000)', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('12,00,000'));
      expect(sanitized.fixedSalary.value).toBe(1200000);
    });

    it('parses salary without commas (e.g. 1200000 -> 1200000)', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('1200000'));
      expect(sanitized.fixedSalary.value).toBe(1200000);
    });

    it('handles malformed text by setting value to null and status to not_specified', () => {
      const sanitized = sanitizeExtractedData(createRawDataWithSalary('not specified or variable components'));
      // Zod schema failure maps to EMPTY_FIELD
      expect(sanitized.fixedSalary.value).toBeNull();
      expect(sanitized.fixedSalary.status).toBe('not_specified');
    });

    it('properly validates variable salary and joining bonus parsed from strings', () => {
      const baseRaw = createRawDataWithSalary(900000);
      baseRaw.variableSalary = { value: '₹3,00,000', status: 'found', confidence: 0.9, evidence: { sourceText: '3L variable', sourcePage: 1, sourceLocation: 'Comp' } };
      baseRaw.joiningBonus = { value: 'Rs 50,000', status: 'found', confidence: 0.9, evidence: { sourceText: '50k bonus', sourcePage: 1, sourceLocation: 'Comp' } };

      const sanitized = sanitizeExtractedData(baseRaw);
      expect(sanitized.variableSalary.value).toBe(300000);
      expect(sanitized.joiningBonus.value).toBe(50000);
    });
  });
});

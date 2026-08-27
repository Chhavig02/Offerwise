import { z } from 'zod';
import { NormalizedOfferData } from '@/types';

const EMPTY_FIELD = {
  value: null,
  status: 'not_specified' as const,
  confidence: 0,
  evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
};

const evidenceSchema = z
  .object({
    sourceText: z.string().nullable(),
    sourcePage: z.number().nullable(),
    sourceLocation: z.string().nullable()
  })
  .catch(EMPTY_FIELD.evidence);

// Deliberately no per-property .catch() inside this object: if ANY part of
// a field (value/status/confidence/evidence) is malformed, the whole field
// defaults to EMPTY_FIELD atomically, rather than e.g. silently nulling out
// `value` while leaving a stale `status: 'found'` behind.
function fieldSchema<T extends z.ZodTypeAny>(valueSchema: T) {
  return z
    .object({
      value: valueSchema.nullable(),
      status: z.enum(['found', 'not_specified', 'uncertain']),
      confidence: z.number(),
      evidence: evidenceSchema
    })
    .catch(EMPTY_FIELD)
    .transform(field => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const f = field as any;
      if (f.status === 'found' && f.value === null) {
        return {
          ...f,
          status: 'not_specified' as const,
          confidence: 0,
          evidence: { sourceText: null, sourcePage: null, sourceLocation: null }
        };
      }
      if (f.status !== 'found') {
        return { ...f, value: null, evidence: { sourceText: null, sourcePage: null, sourceLocation: null } };
      }
      return f;
    });
}

const stringField = () => fieldSchema(z.string());
const numberField = () => fieldSchema(
  z.union([z.number(), z.string()])
    .transform((val) => {
      if (typeof val === 'number') return val;
      const cleanText = val.replace(/Rs\./gi, '')
                           .replace(/Rs/gi, '')
                           .replace(/INR/gi, '')
                           .replace(/₹/gi, '');
      const cleaned = cleanText.replace(/[\s,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    })
);
const booleanField = () => fieldSchema(z.boolean());
const enumField = <T extends [string, ...string[]]>(values: T) => fieldSchema(z.enum(values));

/**
 * Gemini's native responseSchema already guarantees well-formed output;
 * this exists mainly as a backstop for Groq (JSON-mode reliability varies
 * more by model) and any future provider without that guarantee -- applied
 * once to whichever provider's raw output, before evidence validation.
 * Any single malformed field defaults to a safe 'not_specified' rather
 * than crashing the whole extraction.
 */
const normalizedOfferDataSchema = z.object({
  companyName: stringField(),
  candidateName: stringField(),
  role: stringField(),
  fixedSalary: numberField(),
  variableSalary: numberField(),
  joiningBonus: numberField(),
  currency: stringField(),
  probationPeriodMonths: numberField(),
  noticePeriodDays: numberField(),
  hasBond: booleanField(),
  bondDurationMonths: numberField(),
  bondBuyoutAmount: numberField(),
  hasNonCompete: booleanField(),
  insurance: booleanField().optional(),
  relocationAllowance: numberField().optional(),
  hasRelocation: booleanField().optional(),
  location: stringField().optional(),
  workMode: enumField(['remote', 'hybrid', 'onsite', 'unknown']).optional(),
  experienceLevel: enumField(['intern', 'entry', 'junior', 'mid', 'senior', 'lead', 'unknown']).optional()
});

export function sanitizeExtractedData(raw: unknown): NormalizedOfferData {
  if (typeof raw !== 'object' || raw === null) {
    console.warn('[sanitizeExtractedData] Provider returned a non-object response; defaulting to an empty extraction.');
    raw = {};
  }
  return normalizedOfferDataSchema.parse(raw) as NormalizedOfferData;
}

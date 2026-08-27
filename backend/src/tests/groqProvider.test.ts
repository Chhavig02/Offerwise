/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { extractWithGroq } from '../providers/ai/GroqProvider';
import { sanitizeExtractedData } from '../providers/ai/sanitizeExtractedData';

vi.mock('axios');

const wellFormedField = (value: unknown = null, status: 'found' | 'not_specified' | 'uncertain' = 'not_specified') => ({
  value, status, confidence: status === 'found' ? 0.9 : 0,
  evidence: { sourceText: status === 'found' ? 'evidence text' : null, sourcePage: status === 'found' ? 1 : null, sourceLocation: status === 'found' ? 'p1' : null }
});

const wellFormedOfferData = {
  companyName: wellFormedField('NovaTech Solutions Pvt. Ltd.', 'found'),
  candidateName: wellFormedField('Chhavi Sharma', 'found'),
  role: wellFormedField('Software Engineer', 'found'),
  fixedSalary: wellFormedField(900000, 'found'),
  variableSalary: wellFormedField(300000, 'found'),
  joiningBonus: wellFormedField(50000, 'found'),
  currency: wellFormedField('INR', 'found'),
  probationPeriodMonths: wellFormedField(6, 'found'),
  noticePeriodDays: wellFormedField(90, 'found'),
  hasBond: wellFormedField(true, 'found'),
  bondDurationMonths: wellFormedField(18, 'found'),
  bondBuyoutAmount: wellFormedField(150000, 'found'),
  hasNonCompete: wellFormedField(true, 'found'),
  insurance: wellFormedField(true, 'found'),
  relocationAllowance: wellFormedField(),
  hasRelocation: wellFormedField(true, 'found'),
  location: wellFormedField('Bengaluru', 'found'),
  workMode: wellFormedField('hybrid', 'found'),
  experienceLevel: wellFormedField('entry', 'found')
};

function mockGroqResponse(content: string) {
  vi.mocked(axios.post).mockResolvedValue({ data: { choices: [{ message: { content } }] } });
}

describe('extractWithGroq', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'test-groq-key';
  });

  it('successful extraction returns parsed NormalizedOfferData', async () => {
    mockGroqResponse(JSON.stringify(wellFormedOfferData));
    const result = await extractWithGroq('some offer letter text');
    expect(result.companyName.value).toBe('NovaTech Solutions Pvt. Ltd.');
    expect(result.hasRelocation?.value).toBe(true);
  });

  it('uses json_object response format mode in the request', async () => {
    mockGroqResponse(JSON.stringify(wellFormedOfferData));
    await extractWithGroq('some text');
    const call = vi.mocked(axios.post).mock.calls[0][1] as any;
    expect(call.response_format.type).toBe('json_object');
  });

  it('sets a generous max_tokens -- locks in the fix for gpt-oss truncating longer schema output mid-object', async () => {
    mockGroqResponse(JSON.stringify(wellFormedOfferData));
    await extractWithGroq('some text');
    const call = vi.mocked(axios.post).mock.calls[0][1] as any;
    expect(call.max_tokens).toBeGreaterThanOrEqual(4000);
  });

  it('empty response content -> throws a clear error, not a crash', async () => {
    mockGroqResponse('');
    await expect(extractWithGroq('some text')).rejects.toThrow();
  });

  it('missing GROQ_API_KEY -> throws before any network call', async () => {
    delete process.env.GROQ_API_KEY;
    await expect(extractWithGroq('some text')).rejects.toThrow('GROQ_API_KEY is not set');
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('API error (500) -> throws a clear message, not a raw axios error', async () => {
    const axiosError = Object.assign(new Error('Request failed with status code 500'), {
      isAxiosError: true,
      response: { status: 500 }
    });
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.post).mockRejectedValue(axiosError);

    await expect(extractWithGroq('some text')).rejects.toThrow('Internal server error from Groq');
  });

  it('timeout -> resolves to a thrown error, never hangs or crashes the process', async () => {
    const timeoutError = Object.assign(new Error('timeout of 30000ms exceeded'), { isAxiosError: true, code: 'ECONNABORTED' });
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    vi.mocked(axios.post).mockRejectedValue(timeoutError);

    await expect(extractWithGroq('some text')).rejects.toThrow();
  });
});

describe('sanitizeExtractedData', () => {
  it('well-formed data passes through unchanged', () => {
    const result = sanitizeExtractedData(wellFormedOfferData);
    expect(result.companyName.value).toBe('NovaTech Solutions Pvt. Ltd.');
    expect(result.hasRelocation?.value).toBe(true);
    expect(result.workMode?.value).toBe('hybrid');
  });

  it('a malformed field defaults safely to not_specified instead of throwing', () => {
    const malformed = { ...wellFormedOfferData, fixedSalary: { value: 'not-a-number', status: 'found', confidence: 0.9, evidence: {} } };
    const result = sanitizeExtractedData(malformed);
    expect(result.fixedSalary.status).toBe('not_specified');
    expect(result.fixedSalary.value).toBeNull();
    // Unrelated fields are unaffected by one field's corruption.
    expect(result.companyName.value).toBe('NovaTech Solutions Pvt. Ltd.');
  });

  it('a completely missing field defaults safely rather than crashing', () => {
    const { hasBond, ...rest } = wellFormedOfferData;
    const result = sanitizeExtractedData(rest);
    expect(result.hasBond.status).toBe('not_specified');
    expect(result.hasBond.value).toBeNull();
  });

  it('a non-object response (null, string, etc.) defaults to a fully empty extraction, never throws', () => {
    expect(() => sanitizeExtractedData(null)).not.toThrow();
    expect(() => sanitizeExtractedData('garbage')).not.toThrow();
    const result = sanitizeExtractedData(null);
    expect(result.companyName.status).toBe('not_specified');
  });

  it('a not_specified field carrying a stray non-null evidence.sourceText is normalized to fully-null evidence', () => {
    // The exact real-world bug: Groq set status correctly but left a
    // placeholder-like sourceText behind instead of null.
    const withStrayEvidence = {
      ...wellFormedOfferData,
      joiningBonus: { value: null, status: 'not_specified', confidence: 1, evidence: { sourceText: 'joining bonus', sourcePage: null, sourceLocation: null } }
    };
    const result = sanitizeExtractedData(withStrayEvidence);
    expect(result.joiningBonus.status).toBe('not_specified');
    expect(result.joiningBonus.value).toBeNull();
    expect(result.joiningBonus.evidence.sourceText).toBeNull();
  });

  it('optional context fields entirely absent stay absent (not fabricated)', () => {
    const { location, workMode, experienceLevel, insurance, relocationAllowance, hasRelocation, ...requiredOnly } = wellFormedOfferData;
    const result = sanitizeExtractedData(requiredOnly);
    expect(result.location).toBeUndefined();
    expect(result.workMode).toBeUndefined();
  });
});

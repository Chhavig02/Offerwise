import axios from 'axios';
import { NormalizedOfferData } from '@/types';
import { buildOfferExtractionPrompt } from './offerExtractionPrompt';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const REQUEST_TIMEOUT_MS = 60000;

/**
 * Token-efficient schema specification injected into the prompt string.
 *
 * The previous approach embedded a full JSON Schema object (~24KB pretty,
 * ~10KB compact) which consumed ~3,000–6,000 tokens — immediately blowing
 * through Groq free-tier's 8,000 TPM (tokens per minute) budget.
 *
 * This inline format conveys the same structural requirements in ~600 chars
 * (~150 tokens), leaving maximum headroom for the offer document itself.
 */
const INLINE_SCHEMA_SPEC = `Return ONLY a JSON object (no markdown, no code fences). For each field: {"value":<val>,"status":"found"|"not_specified"|"uncertain","confidence":<0-1>,"evidence":{"sourceText":<str|null>,"sourcePage":<int|null>,"sourceLocation":<str|null>}}. Fields: companyName,candidateName,role,fixedSalary,variableSalary,joiningBonus,currency,probationPeriodMonths,noticePeriodDays,hasBond,bondDurationMonths,bondBuyoutAmount,hasNonCompete,insurance,relocationAllowance,hasRelocation,location,workMode,experienceLevel.`;

interface GroqChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

/**
 * Configurable maximum input text length (in characters) before truncation.
 * Default 6,000 chars (~1,500 tokens) keeps the total request (prompt +
 * max_tokens) well under the 8,000 TPM free-tier limit.
 * Override via GROQ_MAX_INPUT_CHARS environment variable.
 */
const MAX_INPUT_CHARS = parseInt(process.env.GROQ_MAX_INPUT_CHARS || '6000', 10);

/**
 * Maximum output tokens requested from Groq. The free tier counts
 * input_tokens + max_tokens against the 8,000 TPM budget. 4000 leaves
 * ~4,000 tokens for the prompt (~16,000 chars of offer text + schema).
 * Override via GROQ_MAX_OUTPUT_TOKENS environment variable.
 */
const MAX_OUTPUT_TOKENS = parseInt(process.env.GROQ_MAX_OUTPUT_TOKENS || '4000', 10);

/**
 * Intelligently truncate offer text while preserving the most important
 * sections: beginning (company name, role, compensation details) and end
 * (legal clauses, signatures, dates). The middle is replaced with a marker.
 */
function truncateOfferText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;

  // Keep 60% from start (company, role, compensation) and 40% from end (legal terms)
  const headChars = Math.floor(maxChars * 0.6);
  const tailChars = maxChars - headChars;
  const head = text.slice(0, headChars);
  const tail = text.slice(text.length - tailChars);

  return `${head}\n\n[... ${text.length - maxChars} characters omitted ...]\n\n${tail}`;
}

/**
 * Extraction provider using Groq's API. Used as primary (AI_PROVIDER=groq)
 * or as automatic fallback when Gemini fails (see pipeline.ts).
 *
 * Key design decisions for Groq free-tier compatibility:
 * 1. Compact inline schema (~150 tokens vs ~3,000–6,000 for JSON Schema)
 * 2. max_tokens=4000 (Groq counts input_tokens + max_tokens against 8K TPM)
 * 3. response_format: json_object for reliable structured output
 * 4. Input text truncation guard for abnormally large documents
 */
export async function extractWithGroq(text: string): Promise<NormalizedOfferData> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set. Add it to backend/.env or set AI_PROVIDER=mock for local testing.');
  }

  // openai/gpt-oss-20b: supports json_object mode, no thinking overhead,
  // works within 8K TPM free-tier budget with compact prompts.
  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-20b';

  // Guard: truncate abnormally large input to stay within token budget
  const processedText = truncateOfferText(text, MAX_INPUT_CHARS);

  const prompt = `${buildOfferExtractionPrompt(processedText)}\n\n${INLINE_SCHEMA_SPEC}`;

  const bodyPayload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' as const },
    temperature: 0.1,
    max_tokens: MAX_OUTPUT_TOKENS
  };

  const bodySize = Buffer.byteLength(JSON.stringify(bodyPayload), 'utf-8');
  console.log(
    `[Groq] Model: ${model} | Input: ${text.length} chars` +
    `${text.length !== processedText.length ? ` (truncated to ${processedText.length})` : ''}` +
    ` | Prompt: ${prompt.length} chars | Body: ${(bodySize / 1024).toFixed(1)} KB` +
    ` | max_tokens: ${MAX_OUTPUT_TOKENS}`
  );

  try {
    const response = await axios.post<GroqChatCompletionResponse>(
      GROQ_ENDPOINT,
      bodyPayload,
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: REQUEST_TIMEOUT_MS
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Groq returned an empty response.');
    }
    return JSON.parse(content) as NormalizedOfferData;
  } catch (error: unknown) {
    // Strip the Authorization header from the Axios error config in place
    // to prevent the GROQ_API_KEY from appearing in error logs or stack traces.
    if (axios.isAxiosError(error) && error.config?.headers) {
      error.config.headers.Authorization = '***';
    }
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorBody = error.response?.data;
      const errorMsg = errorBody?.error?.message || error.message;

      console.error(`[Groq] HTTP ${status} | Error: ${errorMsg}`);

      if (status === 401) {
        throw new Error('Groq API key unauthorized.', { cause: error });
      }
      if (status === 404) {
        throw new Error('Groq model not found. Check GROQ_MODEL mapping.', { cause: error });
      }
      if (status === 413) {
        // Groq returns 413 when input_tokens + max_tokens exceeds the
        // model's TPM budget. This is NOT a standard "payload too large"
        // — it's Groq's token-budget enforcement.
        throw new Error(
          `Groq token budget exceeded for model "${model}". ` +
          `Try reducing GROQ_MAX_INPUT_CHARS (currently ${MAX_INPUT_CHARS}) or ` +
          `GROQ_MAX_OUTPUT_TOKENS (currently ${MAX_OUTPUT_TOKENS}), ` +
          `or upgrade the Groq plan. (${errorMsg})`,
          { cause: error }
        );
      }
      if (status === 429) {
        throw new Error(
          `Groq rate limit exceeded. Please wait and try again. (${errorMsg})`,
          { cause: error }
        );
      }
      if (status && status >= 500) {
        throw new Error('Internal server error from Groq.', { cause: error });
      }
      throw new Error(`Failed to extract data via Groq: ${errorMsg}`, { cause: error });
    }

    console.error('[Groq] Extraction failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error) {
      throw new Error(`Failed to extract data via Groq: ${error.message}`, { cause: error });
    }
    throw new Error('Failed to extract data via Groq due to an unknown error', { cause: error });
  }
}

import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NormalizedOfferData } from '@/types';
import { buildOfferExtractionPrompt } from './offerExtractionPrompt';
import dotenv from 'dotenv';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const evidenceSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    sourceText: { type: Type.STRING, nullable: true },
    sourcePage: { type: Type.INTEGER, nullable: true },
    sourceLocation: { type: Type.STRING, nullable: true },
  },
};

const buildFieldSchema = (type: Type, enumValues?: string[]): Schema => ({
  type: Type.OBJECT,
  properties: {
    value: { type, nullable: true, ...(enumValues ? { enum: enumValues } : {}) },
    status: { type: Type.STRING, enum: ['found', 'not_specified', 'uncertain'] },
    confidence: { type: Type.NUMBER },
    evidence: evidenceSchema,
  },
});

const offerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    companyName: buildFieldSchema(Type.STRING),
    candidateName: buildFieldSchema(Type.STRING),
    role: buildFieldSchema(Type.STRING),
    fixedSalary: buildFieldSchema(Type.NUMBER),
    variableSalary: buildFieldSchema(Type.NUMBER),
    joiningBonus: buildFieldSchema(Type.NUMBER),
    currency: buildFieldSchema(Type.STRING),
    probationPeriodMonths: buildFieldSchema(Type.NUMBER),
    noticePeriodDays: buildFieldSchema(Type.NUMBER),
    hasBond: buildFieldSchema(Type.BOOLEAN),
    bondDurationMonths: buildFieldSchema(Type.NUMBER),
    bondBuyoutAmount: buildFieldSchema(Type.NUMBER),
    hasNonCompete: buildFieldSchema(Type.BOOLEAN),
    insurance: buildFieldSchema(Type.BOOLEAN),
    relocationAllowance: buildFieldSchema(Type.NUMBER),
    hasRelocation: buildFieldSchema(Type.BOOLEAN),
    location: buildFieldSchema(Type.STRING),
    workMode: buildFieldSchema(Type.STRING, ['remote', 'hybrid', 'onsite', 'unknown']),
    experienceLevel: buildFieldSchema(Type.STRING, ['intern', 'entry', 'junior', 'mid', 'senior', 'lead', 'unknown']),
  }
};

export class GeminiModelAvailabilityError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GeminiModelAvailabilityError';
  }
}

export class GeminiRateLimitError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GeminiRateLimitError';
  }
}

export async function extractWithGemini(text: string): Promise<NormalizedOfferData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to backend/.env or set AI_PROVIDER=mock for local testing.');
  }

  const prompt = buildOfferExtractionPrompt(text);

  const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  
  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: offerSchema,
        temperature: 0.1,
      }
    });

    const rawJson = response.text || '{}';
    return JSON.parse(rawJson) as NormalizedOfferData;
  } catch (error: unknown) {
    console.error('Gemini extraction failed:', error);
    
    let status: number | undefined;
    let message = 'Unknown error';

    if (error instanceof Error) {
      message = error.message;
      const errObj = error as unknown as Record<string, unknown>;
      const statusProp = errObj.status || errObj.statusCode;
      if (typeof statusProp === 'number') {
        status = statusProp;
      } else {
        // Fallback: check status in standard error formats
        if (message.includes('404')) status = 404;
        else if (message.includes('429')) status = 429;
        else if (message.includes('403')) status = 403;
        else if (message.includes('500')) status = 500;
      }
    }

    // Safety: Ensure no API keys, internal reasoning, or raw requests are exposed in error messages
    const cleanMessage = message
      .replace(new RegExp(process.env.GEMINI_API_KEY || 'AI_KEY_NOT_FOUND', 'g'), '***')
      .replace(new RegExp(process.env.GROQ_API_KEY || 'GROQ_KEY_NOT_FOUND', 'g'), '***');

    if (status === 404) {
      throw new GeminiModelAvailabilityError(
        `Gemini model availability/configuration error: The model "${MODEL_NAME}" is no longer available or was not found. Please verify GEMINI_MODEL setting in your backend configuration.`,
        { cause: error }
      );
    }

    if (status === 429) {
      throw new GeminiRateLimitError(
        `Gemini API rate limit or quota exceeded (429). Please check your plan and billing details on Google AI Studio.`,
        { cause: error }
      );
    }

    if (status === 403) {
      throw new Error('API Key unauthorized or billing disabled for Gemini.', { cause: error });
    }

    if (status === 500) {
      throw new Error('Internal server error from Gemini.', { cause: error });
    }

    throw new Error(`Failed to extract data via Gemini: ${cleanMessage}`, { cause: error });
  }
}

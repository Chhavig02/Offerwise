/* eslint-disable @typescript-eslint/no-explicit-any, preserve-caught-error */
import { describe, it, expect } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

describe('Gemini Provider Health Check', () => {
  it('should successfully call the configured model', async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeDefined();

    const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
    const ai = new GoogleGenAI({ apiKey });

    // Verify model accessibility by calling generateContent with a tiny prompt
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: 'reply with OK',
      });
      expect(response.text).toBeDefined();
    } catch (error: any) {
      console.error('Health Check Failed:', error);
      throw new Error(`Configured model ${modelName} is not accessible: ${error.status || error.message}`);
    }
  }, 30000);
});

import { GoogleGenAI } from '@google/genai';
import { env } from './env.js';

if (!env.GEMINI_API_KEY) {
  console.warn('⚠️ Warning: GEMINI_API_KEY is not defined in environment variables.');
}

export const ai = new GoogleGenAI({
  apiKey: env.GEMINI_API_KEY || 'dummy_key',
});

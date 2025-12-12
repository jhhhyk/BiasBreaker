
import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// Helper to get API key safely
export const getApiKey = () => {
  // Vite replaces process.env.API_KEY with the actual string during build.
  // However, accessing 'process' directly can cause ReferenceError in browser if not defined.
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    // If process is undefined, we assume the environment variable wasn't replaced or we are in a weird state.
    console.error("Failed to access API_KEY", e);
    return '';
  }
};

// --- Helper: Robust JSON Extraction ---
export function extractJSON<T>(text: string): T {
  try {
    if (!text) throw new Error("Empty response text");

    // Remove markdown code blocks
    let clean = text.replace(/```json/g, '').replace(/```/g, '');
    
    // Find the outer-most braces
    const firstOpen = clean.indexOf('{');
    const lastClose = clean.lastIndexOf('}');
    
    if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
      clean = clean.substring(firstOpen, lastClose + 1);
    }
    
    return JSON.parse(clean);
  } catch (error) {
    console.error("JSON Parse failed for text:", text);
    throw new Error("Failed to parse response. The AI model might have returned unstructured text instead of JSON.");
  }
}

// --- Base Agent Class ---
export class BaseAgent {
  protected ai: GoogleGenAI;
  protected model: string = 'gemini-2.5-flash';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: getApiKey() });
  }

  protected getLangInstruction(language: Language): string {
    // Basic overrides
    if (language === 'ko') return "IMPORTANT: Output ALL text content values in KOREAN (한국어).";
    if (language === 'en') return "IMPORTANT: Output ALL text content values in ENGLISH.";

    // Dynamic support for other languages
    try {
      const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(language);
      return `IMPORTANT: Output ALL text content values in ${languageName || language} language.`;
    } catch (e) {
      // Fallback if Intl is not supported or code is invalid
      return `IMPORTANT: Output ALL text content values in the language code: ${language}.`;
    }
  }

  /**
   * Executes an async operation with exponential backoff for rate limits (429).
   * Increased default delay and retries to handle RESOURCE_EXHAUSTED errors better.
   */
  protected async retryOperation<T>(operation: () => Promise<T>, retries = 10, delay = 10000): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      // Check for common rate limit indicators in Gemini API errors
      const isRateLimit = 
        (error?.status === 429) || 
        (error?.code === 429) || 
        (error?.message && (
          error.message.includes('429') || 
          error.message.includes('quota') || 
          error.message.includes('RESOURCE_EXHAUSTED')
        )) ||
        (error?.error?.code === 429); // Check nested error object

      if (retries > 0 && isRateLimit) {
        console.warn(`Rate limit hit (429). Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        // Exponential backoff
        return this.retryOperation(operation, retries - 1, delay * 1.5); 
      }
      throw error;
    }
  }
}

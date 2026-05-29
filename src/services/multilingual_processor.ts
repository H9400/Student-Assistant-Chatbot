import { translate } from './translation';
import type { Message } from '../types/chat';
import { processInput, type SemanticAnalysis } from './nlpProcessor';

interface LanguageDetectionResult {
  detectedLanguage: string;
  confidence: number;
}

interface ProcessedQuery {
  translatedText: string;
  originalLanguage: string;
  analysis: SemanticAnalysis;
}

interface Entity {
  type: string;
  value: string;
}



interface ConversationContext {
  conversationHistory?: Message[];
  userPreferences?: Record<string, any>;
}

export class MultilingualProcessor {
  private supportedLanguages = ['en', 'hi', 'mr', 'gu', 'bn', 'ta', 'te', 'kn', 'ml', 'pa'];
  
  private readonly API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:5000/api';
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour
  private languageCache = new Map<string, {result: LanguageDetectionResult; timestamp: number}>();

  async detectLanguage(text: string): Promise<LanguageDetectionResult> {
    const cacheKey = text.slice(0, 100); // Cache based on first 100 chars
    const cached = this.languageCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.result;
    }

    try {
      const response = await fetch(`${this.API_ENDPOINT}/detect-language`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ text }),
        signal: AbortSignal.timeout(5000) // 5s timeout
      });
      
      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.languageCache.set(cacheKey, {result, timestamp: Date.now()});
      return result;
    } catch (error) {
      console.error('Language detection error:', error);
      // Fallback to basic language detection heuristics
      const fallbackResult = this.fallbackLanguageDetection(text);
      return fallbackResult;
    }
  }

  private fallbackLanguageDetection(text: string): LanguageDetectionResult {
    // Basic heuristic detection based on character sets
    const scripts = {
      devanagari: /[\u0900-\u097F]/,
      bengali: /[\u0980-\u09FF]/,
      gujarati: /[\u0A80-\u0AFF]/,
      tamil: /[\u0B80-\u0BFF]/,
      telugu: /[\u0C00-\u0C7F]/,
      kannada: /[\u0C80-\u0CFF]/,
      malayalam: /[\u0D00-\u0D7F]/,
      punjabi: /[\u0A00-\u0A7F]/
    };

    for (const [lang, pattern] of Object.entries(scripts)) {
      if (pattern.test(text)) {
        return { detectedLanguage: lang, confidence: 0.7 };
      }
    }

    return { detectedLanguage: 'en', confidence: 0.5 };
  }

  async processMultilingualQuery(
    query: string,
    targetLanguage = 'en',
    context?: {
      conversationHistory?: Message[];
      userPreferences?: Record<string, any>;
    }
  ): Promise<ProcessedQuery> {
    // Use targetLanguage parameter
    if (!this.supportedLanguages.includes(targetLanguage)) {
      targetLanguage = 'en';
    }
    // Detect input language
    const { detectedLanguage } = await this.detectLanguage(query);
    
    // Translate to English for processing if needed
    const translatedText = detectedLanguage !== 'en' 
      ? await translate(query, 'en')
      : query;
    
    // Extract entities from conversation history
    const mentionedEntities = context?.conversationHistory
      ?.flatMap(msg => msg.entities || [])
      .filter((e, i, arr) => arr.findIndex(a => a.value === e.value) === i) || [];
    
    // Process the query with context
    const analysis = processInput(translatedText, {
      mentionedEntities: mentionedEntities.map(e => e.value),
      history: context?.conversationHistory?.map(msg => msg.content) || [],
      preferences: context?.userPreferences || {}
    });
    
    return {
      translatedText,
      originalLanguage: detectedLanguage,
      analysis
    };
  }

  async translateResponse(
    response: Message,
    targetLanguage: string
  ): Promise<Message> {
    if (!this.supportedLanguages.includes(targetLanguage)) {
      throw new Error(`Language ${targetLanguage} is not supported`);
    }

    if (targetLanguage === 'en') {
      return response;
    }

    const translatedContent = await translate(response.content, targetLanguage);
    
    return {
      ...response,
      content: translatedContent
    };
  }
}

export const multilingualProcessor = new MultilingualProcessor();
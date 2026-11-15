import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './ai-provider.js';
import type { AIChatMessage, AIRequestOptions, AIResponse } from './types.js';
import { AIProviderError } from './types.js';

const DEFAULT_MODEL = 'gemini-1.5-flash';
const DEFAULT_TIMEOUT_MS = 30_000;

export class GeminiProvider implements AIProvider {
  public readonly name = 'Google Gemini';
  public readonly model: string;

  private client: GoogleGenAI | null = null;
  private readonly apiKey: string;

  constructor(config?: {
    apiKey?: string;
    model?: string;
  }) {
    this.apiKey = config?.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = config?.model || DEFAULT_MODEL;

    if (this.isAvailable()) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
      console.log(`[AI] Gemini provider initialized (model: ${this.model})`);
    } else {
      console.log('[AI] Gemini provider registered but inactive (no API key configured)');
    }
  }

  public isAvailable(): boolean {
    return this.apiKey.trim().length > 10;
  }

  public async chat(messages: AIChatMessage[], options?: AIRequestOptions): Promise<AIResponse> {
    if (!this.client || !this.isAvailable()) {
      throw new AIProviderError(
        'Gemini provider is not configured. Set GEMINI_API_KEY to enable.',
        'gemini'
      );
    }

    const model = options?.model || this.model;
    const timeoutMs = options?.timeoutMs || DEFAULT_TIMEOUT_MS;

    // Convert chat messages to a single prompt string for Gemini
    // Gemini's generateContent accepts a string or parts array
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    let prompt = '';
    if (systemMessage) {
      prompt += systemMessage.content + '\n\n';
    }
    for (const msg of userMessages) {
      prompt += msg.content + '\n';
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const config: any = {};
      if (options?.responseFormat === 'json') {
        config.responseMimeType = 'application/json';
      }
      if (options?.temperature !== undefined) {
        config.temperature = options.temperature;
      }
      if (options?.maxTokens) {
        config.maxOutputTokens = options.maxTokens;
      }

      const response = await this.client.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const content = response.text || '';
      if (!content) {
        throw new AIProviderError('Empty response from Gemini', 'gemini');
      }

      return {
        content,
        model,
        usage: response.usageMetadata
          ? {
              promptTokens: (response.usageMetadata as any).promptTokenCount || 0,
              completionTokens: (response.usageMetadata as any).candidatesTokenCount || 0,
              totalTokens: (response.usageMetadata as any).totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (err: any) {
      if (err instanceof AIProviderError) throw err;

      if (err.name === 'AbortError') {
        throw new AIProviderError(
          `Gemini request timed out after ${timeoutMs}ms`,
          'gemini',
          408,
          true
        );
      }

      throw new AIProviderError(
        `Gemini request failed: ${err.message}`,
        'gemini',
        err.status || err.statusCode,
        true
      );
    } finally {
      clearTimeout(timer);
    }
  }
}

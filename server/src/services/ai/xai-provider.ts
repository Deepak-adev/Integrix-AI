import OpenAI from 'openai';
import type { AIProvider } from './ai-provider.js';
import type { AIChatMessage, AIRequestOptions, AIResponse } from './types.js';
import { AIProviderError } from './types.js';

const DEFAULT_MODEL = 'grok-4.7';
const DEFAULT_BASE_URL = 'https://api.x.ai/v1';
const DEFAULT_TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 2_000;

/** Local type for the chat completion request body (OpenAI-compatible). */
interface ChatRequestBody {
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: string };
}

export class XAIProvider implements AIProvider {
  public readonly name = 'xAI Grok';
  public readonly model: string;

  private client: OpenAI | null = null;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    timeoutMs?: number;
  }) {
    this.apiKey = config?.apiKey || process.env.XAI_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.XAI_BASE_URL || DEFAULT_BASE_URL;
    this.model = config?.model || process.env.XAI_MODEL || DEFAULT_MODEL;
    this.defaultTimeoutMs = config?.timeoutMs || DEFAULT_TIMEOUT_MS;

    if (this.isAvailable()) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseUrl,
      });
      console.log(`[AI] xAI Grok provider initialized (model: ${this.model}, base: ${this.baseUrl})`);
    } else {
      console.log('[AI] xAI Grok provider registered but inactive (no API key configured)');
    }
  }

  public isAvailable(): boolean {
    return this.apiKey.length > 10;
  }

  public async chat(messages: AIChatMessage[], options?: AIRequestOptions): Promise<AIResponse> {
    if (!this.client || !this.isAvailable()) {
      throw new AIProviderError(
        'xAI Grok provider is not configured. Set XAI_API_KEY to enable.',
        'xai'
      );
    }

    const model = options?.model || this.model;
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;

    const requestBody: ChatRequestBody = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.3,
    };

    if (options?.maxTokens) {
      requestBody.max_tokens = options.maxTokens;
    }

    if (options?.responseFormat === 'json') {
      requestBody.response_format = { type: 'json_object' };
    }

    // First attempt
    try {
      return await this.executeRequest(requestBody, model, timeoutMs);
    } catch (err: any) {
      // Retry once on rate limit (429)
      if (err instanceof AIProviderError && err.isRetryable) {
        console.warn(`[AI] xAI rate limited, retrying in ${RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        return await this.executeRequest(requestBody, model, timeoutMs);
      }
      throw err;
    }
  }

  private async executeRequest(
    body: ChatRequestBody,
    model: string,
    timeoutMs: number
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const completion = await this.client!.chat.completions.create(body as any, {
        signal: controller.signal,
      });

      const choice = completion.choices[0];
      if (!choice?.message?.content) {
        throw new AIProviderError('Empty response from xAI Grok', 'xai');
      }

      return {
        content: choice.message.content,
        model: completion.model || model,
        usage: completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
            }
          : undefined,
        finishReason: choice.finish_reason || undefined,
      };
    } catch (err: any) {
      clearTimeout(timer);

      if (err.name === 'AbortError') {
        throw new AIProviderError(
          `xAI Grok request timed out after ${timeoutMs}ms`,
          'xai',
          408,
          true
        );
      }

      if (err instanceof AIProviderError) throw err;

      // OpenAI SDK error handling
      const status = err.status || err.statusCode;
      if (status === 429) {
        throw new AIProviderError('xAI rate limit exceeded', 'xai', 429, true);
      }
      if (status === 401) {
        throw new AIProviderError('xAI authentication failed — check XAI_API_KEY', 'xai', 401);
      }
      if (status === 403) {
        throw new AIProviderError('xAI access forbidden — check API key permissions', 'xai', 403);
      }

      throw new AIProviderError(
        `xAI Grok request failed: ${err.message}`,
        'xai',
        status,
        status === 500 || status === 502 || status === 503
      );
    } finally {
      clearTimeout(timer);
    }
  }
}


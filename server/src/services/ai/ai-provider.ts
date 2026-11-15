import type { AIChatMessage, AIRequestOptions, AIResponse } from './types.js';

/**
 * Provider-independent interface for AI services.
 * All AI adapters (xAI Grok, Gemini, etc.) implement this contract.
 */
export interface AIProvider {
  /** Human-readable provider name (e.g. 'xAI Grok', 'Google Gemini') */
  readonly name: string;

  /** The model identifier currently configured */
  readonly model: string;

  /** Send a chat completion request */
  chat(messages: AIChatMessage[], options?: AIRequestOptions): Promise<AIResponse>;

  /** Check whether this provider is properly configured and can accept requests */
  isAvailable(): boolean;
}

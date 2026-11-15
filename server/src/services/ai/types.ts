// Chat message format (OpenAI-compatible)
export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Request options
export interface AIRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  timeoutMs?: number;
}

// Standardised response
export interface AIResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
}

// Provider configuration
export type AIProviderName = 'xai' | 'gemini' | 'none';

export interface AIProviderConfig {
  provider: AIProviderName;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  defaultTimeoutMs?: number;
}

// AI-generated audit analysis (returned alongside deterministic findings)
export interface AIAuditAnalysis {
  headlineVerdict: string;
  summary: string;
  autoFixSuggestions: {
    suggestedHeadline: string;
    suggestedBodyCopy: string;
    suggestedDisclaimer: string;
    keyCorrectionsList: string[];
  };
  strengths: string[];
  semanticFaults: SemanticFault[];
  analysisEngine: string;
}

export interface SemanticFault {
  title: string;
  category: string;
  severity: 'CRITICAL' | 'WARNING' | 'TIP';
  observedText: string;
  violationReason: string;
  approvedStandard: string;
  doThisInstead: string;
  sourceReference: string;
}

// Error types for AI providers
export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number,
    public readonly isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}

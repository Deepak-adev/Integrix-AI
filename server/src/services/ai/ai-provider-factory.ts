import type { AIProvider } from './ai-provider.js';
import type { AIProviderName } from './types.js';
import { XAIProvider } from './xai-provider.js';
import { GeminiProvider } from './gemini-provider.js';

let cachedAuditProvider: AIProvider | null | undefined = undefined;
let cachedExtractionProvider: AIProvider | null | undefined = undefined;

/**
 * Create an AI provider by name.
 * Returns null if the provider cannot be configured (e.g., missing API key).
 */
export function createProvider(name: AIProviderName): AIProvider | null {
  switch (name) {
    case 'xai': {
      const provider = new XAIProvider();
      return provider.isAvailable() ? provider : null;
    }
    case 'gemini': {
      const provider = new GeminiProvider();
      return provider.isAvailable() ? provider : null;
    }
    case 'none':
      return null;
    default:
      console.warn(`[AI] Unknown AI provider: '${name}'. Falling back to 'none'.`);
      return null;
  }
}

/**
 * Get the configured AI provider for semantic audit analysis.
 * Reads AI_PROVIDER from environment. Defaults to 'none'.
 * Result is cached after first call.
 */
export function getAuditProvider(): AIProvider | null {
  if (cachedAuditProvider !== undefined) return cachedAuditProvider;

  const providerName = (process.env.AI_PROVIDER || 'none') as AIProviderName;
  cachedAuditProvider = createProvider(providerName);

  if (cachedAuditProvider) {
    console.log(`[AI] Audit provider: ${cachedAuditProvider.name} (${cachedAuditProvider.model})`);
  } else {
    console.log('[AI] Audit provider: none (deterministic rules only)');
  }

  return cachedAuditProvider;
}

/**
 * Get the configured AI provider for content extraction enrichment.
 * Uses GEMINI by default for extraction if available, regardless of AI_PROVIDER.
 * This allows using Gemini for extraction while using xAI for audit analysis.
 */
export function getExtractionProvider(): AIProvider | null {
  if (cachedExtractionProvider !== undefined) return cachedExtractionProvider;

  // Try Gemini first for extraction (existing behavior)
  const gemini = new GeminiProvider();
  if (gemini.isAvailable()) {
    cachedExtractionProvider = gemini;
  } else {
    // Fall back to the audit provider if Gemini is not configured
    cachedExtractionProvider = getAuditProvider();
  }

  if (cachedExtractionProvider) {
    console.log(`[AI] Extraction provider: ${cachedExtractionProvider.name} (${cachedExtractionProvider.model})`);
  } else {
    console.log('[AI] Extraction provider: none (deterministic extraction only)');
  }

  return cachedExtractionProvider;
}

/**
 * Get a summary of the current AI provider configuration.
 * Safe to log — never includes API keys.
 */
export function getProviderStatus(): {
  auditProvider: string;
  auditModel: string;
  auditAvailable: boolean;
  extractionProvider: string;
  extractionModel: string;
  extractionAvailable: boolean;
} {
  const audit = getAuditProvider();
  const extraction = getExtractionProvider();

  return {
    auditProvider: audit?.name || 'none',
    auditModel: audit?.model || 'N/A',
    auditAvailable: audit?.isAvailable() || false,
    extractionProvider: extraction?.name || 'none',
    extractionModel: extraction?.model || 'N/A',
    extractionAvailable: extraction?.isAvailable() || false,
  };
}

/**
 * Reset cached providers. Useful for testing or reconfiguration.
 */
export function resetProviders(): void {
  cachedAuditProvider = undefined;
  cachedExtractionProvider = undefined;
}

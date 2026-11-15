import type { AIProvider } from './ai-provider.js';
import type { AIAuditAnalysis, SemanticFault } from './types.js';
import type { ExtractedAdContent, Finding, AuditSubmissionMetadata } from '../../types/index.js';
import { getAuditProvider } from './ai-provider-factory.js';
import type { AuditDataSource } from '../audit-engine/audit-data-source.interface.js';
import { FileAuditDataSource } from '../audit-engine/file-audit-data-source.js';

/**
 * AI-powered semantic audit analyzer.
 * Complements deterministic rule findings with AI semantic analysis.
 * Returns null when no AI provider is available — audit proceeds deterministically.
 */
export class AIAuditAnalyzer {
  /**
   * Run AI semantic analysis on extracted ad content.
   * @returns AIAuditAnalysis if AI provider is available, null otherwise.
   */
  public async analyze(
    extractedContent: ExtractedAdContent,
    metadata?: AuditSubmissionMetadata,
    deterministicFindings?: Finding[],
    dataSource?: AuditDataSource
  ): Promise<AIAuditAnalysis | null> {
    const provider = getAuditProvider();

    if (!provider || !provider.isAvailable()) {
      return null;
    }

    try {
      const systemPrompt = this.buildSystemPrompt(dataSource ?? new FileAuditDataSource());
      const userPrompt = this.buildUserPrompt(extractedContent, metadata, deterministicFindings);

      const response = await provider.chat(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.3,
          responseFormat: 'json',
        }
      );

      return this.parseAIResponse(response.content, provider.name, provider.model);
    } catch (err: any) {
      console.warn(`[AIAuditAnalyzer] AI analysis failed, proceeding with deterministic results only: ${err.message}`);
      return null;
    }
  }

  /**
   * Check whether AI semantic analysis is currently available.
   */
  public isAvailable(): boolean {
    const provider = getAuditProvider();
    return provider !== null && provider.isAvailable();
  }

  /**
   * Get a human-readable description of the current analysis engine.
   */
  public getEngineDescription(): string {
    const provider = getAuditProvider();
    if (provider && provider.isAvailable()) {
      return `Integrix AI Policy Engine (${provider.name} ${provider.model})`;
    }
    return 'Integrix AI Deterministic Policy Engine';
  }

  private buildSystemPrompt(dataSource: AuditDataSource): string {
    const products = dataSource.getAllProducts();
    const campaigns = dataSource.getAllCampaigns();

    // Build product catalogue context from live repository data
    let productContext = '';
    for (const prod of products) {
      const prodCampaigns = dataSource.getCampaignsForSku(prod.sku);
      let campaignInfo = '';
      if (prodCampaigns.length > 0) {
        campaignInfo = prodCampaigns
          .map(c => `Campaign ${c.campaignId}: ₹${c.campaignPriceInr} (${c.startDate} to ${c.endDate}, Status: ${c.approvalStatus})`)
          .join('. ');
      }

      productContext += `  * ${prod.sku} (${prod.productName}): ${prod.composition}, base selling price ₹${prod.sellingPriceInr}, ${prod.fit}. Claims Not Approved: ${prod.claimsNotApproved.join(', ') || 'none'}. ${campaignInfo}\n`;
    }

    return `You are INTEGRIX AI — Chief Advertising Governance & Compliance Intelligence Engine.
You audit advertisement posters, banners, and marketing copy for compliance, truth in advertising, and policy rules.

Brand Repository & Policy Context:
- Brand: NOVAWEAR (NovaWear Retail Private Limited)
- Approved Products in Catalogue:
${productContext}
- Currency Standard:
  * Brand currency is Indian Rupee (₹ / INR). Numbers like ₹1,299 or ₹999 are legitimate INR amounts.
- Campaign Rules:
  * Displayed campaign prices are permitted ONLY when an approved campaign record exists, dates match, and required conditions are kept visible.
  * Expired or pending campaigns cannot authorise public prices.
- Performance Claims:
  * Unsupported claims must be substantiated with certified test reports. If not in approved claims, flag.
- Delivery Claims:
  * Operational dispatch target is 1-2 business days. "Guaranteed next-day delivery" or "Delivered tomorrow guaranteed" is prohibited.
- Brand Voice:
  * Avoid exaggerated terms like "luxury", "revolutionary", "life-changing", "guaranteed", "fashion that transforms you".

Task:
Analyze the provided advertisement text. Find EVERY fault, violation, inaccuracy, or compliance issue.
For every fault, provide clear, actionable guidance in 'doThisInstead'.

Respond ONLY with valid JSON matching this schema:
{
  "headlineVerdict": "Punchy one-line executive verdict",
  "summary": "Clear 2-sentence summary of findings",
  "semanticFaults": [
    {
      "title": "Short title of fault",
      "category": "PRICE_VIOLATION" | "UNSUPPORTED_CLAIM" | "COMPOSITION_MISMATCH" | "DELIVERY_PROMISE" | "BRAND_VOICE" | "LEGAL_DISCLAIMER",
      "severity": "CRITICAL" | "WARNING" | "TIP",
      "observedText": "Exact quote from the ad",
      "violationReason": "Why this violates policy",
      "approvedStandard": "What the approved fact or rule is",
      "doThisInstead": "Exact rewritten copy or action to take",
      "sourceReference": "Source citation"
    }
  ],
  "autoFixSuggestions": {
    "suggestedHeadline": "Compliant headline",
    "suggestedBodyCopy": "Compliant revised ad body copy",
    "suggestedDisclaimer": "Mandatory disclaimer text if needed",
    "keyCorrectionsList": ["Key fix 1", "Key fix 2"]
  },
  "strengths": ["Compliant aspect 1", "Compliant aspect 2"]
}`;
  }

  private buildUserPrompt(
    extractedContent: ExtractedAdContent,
    metadata?: AuditSubmissionMetadata,
    deterministicFindings?: Finding[]
  ): string {
    let prompt = `Advertisement Content to Audit:
"""
${extractedContent.rawText || 'No text extracted from creative.'}
"""

Target Product:
- SKU: ${extractedContent.detectedSku || metadata?.sku || 'Auto-detect'}
- Detected Price: ${extractedContent.advertisedPriceFormatted || 'Not detected'}
- Detected Composition: ${extractedContent.detectedComposition || 'Not detected'}
- Performance Claims: ${extractedContent.performanceClaims.length > 0 ? extractedContent.performanceClaims.join(', ') : 'None'}
- Delivery Statements: ${extractedContent.deliveryStatements.length > 0 ? extractedContent.deliveryStatements.join(', ') : 'None'}
- Publication Channel: ${metadata?.publicationChannel || 'Social / E-commerce'}`;

    if (deterministicFindings && deterministicFindings.length > 0) {
      prompt += `\n\nDeterministic Rule Findings (already verified — do NOT contradict these):\n`;
      for (const f of deterministicFindings) {
        prompt += `- [${f.status}] ${f.policyName}: ${f.explanation}\n`;
      }
      prompt += `\nYou may find ADDITIONAL semantic issues not covered by deterministic rules. Do NOT override or contradict the deterministic findings above.`;
    }

    return prompt;
  }

  private parseAIResponse(
    content: string,
    providerName: string,
    providerModel: string
  ): AIAuditAnalysis {
    try {
      let cleaned = content.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '').trim();
      }
      const parsed = JSON.parse(cleaned);

      // Normalize semantic faults
      const rawFaults = Array.isArray(parsed.semanticFaults) ? parsed.semanticFaults : [];
      const semanticFaults: SemanticFault[] = rawFaults.map((f: any) => ({
        title: f.title || 'Policy Violation',
        category: f.category || 'BRAND_VOICE',
        severity: f.severity === 'CRITICAL' ? 'CRITICAL' : f.severity === 'TIP' ? 'TIP' : 'WARNING',
        observedText: f.observedText || '',
        violationReason: f.violationReason || '',
        approvedStandard: f.approvedStandard || '',
        doThisInstead: f.doThisInstead || '',
        sourceReference: f.sourceReference || 'Brand Guidelines & Product Repository',
      }));

      return {
        headlineVerdict: parsed.headlineVerdict || 'Audit analysis complete',
        summary: parsed.summary || 'AI semantic analysis completed.',
        autoFixSuggestions: {
          suggestedHeadline: parsed.autoFixSuggestions?.suggestedHeadline || '',
          suggestedBodyCopy: parsed.autoFixSuggestions?.suggestedBodyCopy || '',
          suggestedDisclaimer: parsed.autoFixSuggestions?.suggestedDisclaimer || '',
          keyCorrectionsList: Array.isArray(parsed.autoFixSuggestions?.keyCorrectionsList)
            ? parsed.autoFixSuggestions.keyCorrectionsList
            : [],
        },
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        semanticFaults,
        analysisEngine: `${providerName} (${providerModel})`,
      };
    } catch (err: any) {
      console.warn(`[AIAuditAnalyzer] Failed to parse AI response: ${err.message}`);
      return {
        headlineVerdict: 'AI analysis response could not be parsed',
        summary: 'The AI provider returned a response that could not be parsed. Deterministic results are still valid.',
        autoFixSuggestions: {
          suggestedHeadline: '',
          suggestedBodyCopy: '',
          suggestedDisclaimer: '',
          keyCorrectionsList: [],
        },
        strengths: [],
        semanticFaults: [],
        analysisEngine: `${providerName} (${providerModel}) — parse error`,
      };
    }
  }
}

export const aiAuditAnalyzer = new AIAuditAnalyzer();

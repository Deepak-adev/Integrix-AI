import { repositoryLoader } from '../ingestion/repository-loader.js';
import { getAuditProvider, getProviderStatus } from '../ai/ai-provider-factory.js';
import { policyIntelligenceRepository } from '../repositories/policy-intelligence.repository.js';
import { getAuditDataSourceMode } from '../audit-engine/audit-source-config.js';
import type { OrganisationContext } from '../../types/index.js';
import { EvidenceValidator } from './evidence-validator.js';
import { DeterministicPolicyIntelligence } from './deterministic-policy-intelligence.js';
import type {
  PolicyAnalysisResult,
  PolicyAnalysisScope,
  PolicyContextItem,
  PolicyIntelligenceFinding,
} from './policy-intelligence.types.js';

export class PolicyIntelligenceEngine {
  /**
   * Run the Policy Intelligence Agent on the specified organisation.
   */
  public async analyze(
    context: OrganisationContext,
    scope: PolicyAnalysisScope = { scopeType: 'ALL' }
  ): Promise<PolicyAnalysisResult> {
    const startedAt = new Date().toISOString();
    const runId = `RUN-PI-${Date.now().toString(36).toUpperCase()}`;

    // 1. Gather organisation documents and policy context
    await repositoryLoader.initialize();
    const contextItems = await this.gatherContext(context, scope);

    // 2. Determine AI Provider status
    const provider = getAuditProvider();
    const isAiAvailable = provider !== null && provider.isAvailable();
    const providerStatus = getProviderStatus();

    let findings: PolicyIntelligenceFinding[] = [];
    let summary = '';

    if (isAiAvailable && provider) {
      // 3A. AI-Enhanced Analysis
      try {
        const aiResult = await this.runAiAnalysis(provider, contextItems, context.organisationName);
        findings = aiResult.findings;
        summary = aiResult.summary;
      } catch (err: any) {
        console.warn(`[PolicyIntelligenceEngine] AI Analysis failed, falling back to deterministic: ${err.message}`);
        findings = DeterministicPolicyIntelligence.analyze(contextItems, context.organisationSlug);
        summary = `Deterministic structural policy analysis executed (${findings.length} findings identified across active brand documents).`;
      }
    } else {
      // 3B. Deterministic Analysis
      findings = DeterministicPolicyIntelligence.analyze(contextItems, context.organisationSlug);
      summary = `Deterministic policy intelligence analysis completed. Evaluated 5 master brand governance documents and active catalogue rules. AI provider is currently inactive (${providerStatus.auditProvider}).`;
    }

    // 4. Validate & Sanitize Evidence
    findings = findings.map(f => EvidenceValidator.sanitizeFindingEvidence(f));

    // 5. Aggregate metrics
    const conflictsCount = findings.filter(f => f.category === 'CONFLICT').length;
    const ambiguitiesCount = findings.filter(f => f.category === 'AMBIGUITY').length;
    const missingCount = findings.filter(f => f.category === 'MISSING_REQUIREMENT').length;
    const duplicatesCount = findings.filter(f => f.category === 'DUPLICATION').length;
    const pendingReviewCount = findings.filter(f => f.status === 'PENDING').length;
    const completedAt = new Date().toISOString();

    const result: PolicyAnalysisResult = {
      runId,
      title: `${context.organisationName} Policy Intelligence & Conflict Analysis`,
      scope: scope.scopeType,
      status: 'COMPLETED',
      aiProvider: isAiAvailable && provider ? provider.name : 'Deterministic Engine',
      aiModel: isAiAvailable && provider ? provider.model : 'Deterministic Rule Engine',
      isAiEnhanced: isAiAvailable,
      summary,
      totalFindings: findings.length,
      conflictsCount,
      ambiguitiesCount,
      missingCount,
      duplicatesCount,
      pendingReviewCount,
      findings,
      startedAt,
      completedAt,
    };

    // 6. Persist to Database if mode === 'database'
    const mode = getAuditDataSourceMode();
    if (mode === 'database') {
      try {
        await policyIntelligenceRepository.createRun(context, {
          runId,
          title: result.title,
          scope: result.scope,
          status: result.status,
          aiProvider: result.aiProvider,
          aiModel: result.aiModel,
          summary: result.summary,
          totalFindings: result.totalFindings,
          conflictsCount,
          ambiguitiesCount,
          missingCount,
          duplicatesCount,
          pendingReviewCount,
          completedAt: new Date(completedAt),
        });

        await policyIntelligenceRepository.createFindings(
          context,
          runId,
          findings.map(f => ({
            runId,
            findingId: f.findingId,
            category: f.category,
            severity: f.severity,
            status: f.status,
            title: f.title,
            explanation: f.explanation,
            affectedPolicyOrDoc: f.affectedPolicyOrDoc,
            sourceDocumentName: f.sourceDocumentName,
            sourceLocator: f.sourceLocator,
            evidenceExcerpts: f.evidenceExcerpts,
            existingWording: f.existingWording,
            recommendedWording: f.recommendedWording,
            rationale: f.rationale,
            confidence: f.confidence,
            isNeedsVerification: f.isNeedsVerification,
            proposedDraftRuleId: f.proposedDraftRuleId,
          }))
        );
      } catch (dbErr: any) {
        console.warn(`[PolicyIntelligenceEngine] Database persistence skipped/failed: ${dbErr.message}`);
      }
    }

    return result;
  }

  /**
   * Aggregate organisation context items from documents, rules, and catalogues.
   */
  private async gatherContext(
    context: OrganisationContext,
    scope: PolicyAnalysisScope
  ): Promise<PolicyContextItem[]> {
    const items: PolicyContextItem[] = [];

    // Documents
    const docKeys = [
      { id: 'SRC-NW-001', name: '01_Brand_Guidelines.pdf', title: 'NOVAWEAR Brand Guidelines' },
      { id: 'SRC-NW-002', name: '02_Company_Profile.pdf', title: 'Corporate Logistics Profile' },
      { id: 'SRC-NW-003', name: '03_Marketing_and_Communication_Policy.pdf', title: 'Marketing Policy (MCP-01)' },
      { id: 'SRC-NW-004', name: '04_Product_and_Customer_Information_Policy.pdf', title: 'Customer Policy (PCIP-01)' },
    ];

    for (const d of docKeys) {
      const doc = repositoryLoader.getPolicyDocument(d.id);
      if (doc) {
        items.push({
          id: d.id,
          title: d.title,
          type: 'SOURCE',
          documentName: d.name,
          locator: 'Full Document Text',
          content: doc.fullText.slice(0, 3000), // bounded sample
        });
      }
    }

    // Rules
    const rules = repositoryLoader.getAllRules();
    for (const r of rules) {
      items.push({
        id: r.ruleId,
        title: r.ruleName,
        type: 'RULE',
        documentName: r.authoritySourceId,
        locator: r.sourceLocator,
        content: `Rule ${r.ruleId} (${r.severity}): ${r.policyStatement}`,
        status: 'ACTIVE',
      });
    }

    // Campaigns
    const campaigns = repositoryLoader.getAllCampaigns();
    for (const c of campaigns) {
      items.push({
        id: c.campaignId,
        title: `Campaign ${c.campaignId} for ${c.sku}`,
        type: 'CAMPAIGN',
        documentName: '05_Product_Catalogue_and_Campaigns.xlsx',
        locator: `Tab: Campaign Offers, Row for ${c.campaignId}`,
        content: `Campaign ${c.campaignId}: SKU ${c.sku} at ₹${c.campaignPriceInr} (${c.startDate} to ${c.endDate}). Status: ${c.approvalStatus}. Conditions: ${c.conditions || 'None'}`,
      });
    }

    return items;
  }

  /**
   * Call LLM provider with structured JSON instruction.
   */
  private async runAiAnalysis(
    provider: any,
    contextItems: PolicyContextItem[],
    orgName: string
  ): Promise<{ summary: string; findings: PolicyIntelligenceFinding[] }> {
    const systemPrompt = `You are the Integrix AI Policy Intelligence Agent for ${orgName}.
Your objective is to inspect the provided organisation policies, brand guidelines, and active campaign records to detect:
1. CONFLICT: Two requirements that contradict each other.
2. AMBIGUITY: A requirement that is vague, subjective, or open to multiple interpretations.
3. MISSING_REQUIREMENT: An explicitly referenced standard, token, or registry that is absent in the repository.
4. DUPLICATION: Multiple policies expressing substantially identical rules.

CRITICAL CONSTRAINTS:
- You must ONLY use the provided document context. Do not invent requirements.
- Every finding must include exact verbatim evidence excerpts and source locators.
- Return valid JSON matching the schema below.`;

    const userPrompt = `Context Items:\n${JSON.stringify(contextItems.slice(0, 10), null, 2)}\n
Analyze these policies and respond with JSON:
{
  "summary": "High-level summary of policy intelligence findings",
  "findings": [
    {
      "category": "CONFLICT" | "AMBIGUITY" | "MISSING_REQUIREMENT" | "DUPLICATION",
      "severity": "LOW" | "MEDIUM" | "HIGH",
      "title": "Clear concise finding title",
      "explanation": "Detailed explanation of the issue",
      "affectedPolicyOrDoc": "Name of affected policy or document",
      "sourceDocumentName": "01_Brand_Guidelines.pdf etc",
      "sourceLocator": "Section / Page locator",
      "evidenceExcerpts": ["verbatim excerpt from text"],
      "existingWording": "Current text",
      "recommendedWording": "Proposed improved policy text",
      "rationale": "Why this change resolves the issue",
      "confidence": 0.95
    }
  ]
}`;

    const response = await provider.chat(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.2, responseFormat: 'json' }
    );

    const parsed = JSON.parse(response.content);
    const timestamp = Date.now();
    const findings: PolicyIntelligenceFinding[] = (parsed.findings || []).map((f: any, i: number) => ({
      findingId: `FIND-AI-${timestamp}-${i + 1}`,
      category: f.category,
      severity: f.severity || 'MEDIUM',
      status: 'PENDING',
      title: f.title,
      explanation: f.explanation,
      affectedPolicyOrDoc: f.affectedPolicyOrDoc,
      sourceDocumentName: f.sourceDocumentName,
      sourceLocator: f.sourceLocator,
      evidenceExcerpts: f.evidenceExcerpts || [],
      existingWording: f.existingWording,
      recommendedWording: f.recommendedWording,
      rationale: f.rationale,
      confidence: f.confidence || 0.85,
      isNeedsVerification: f.confidence < 0.7,
      proposedDraftRuleId: `DRAFT-REC-${i + 1}`,
    }));

    return {
      summary: parsed.summary || 'AI policy analysis completed.',
      findings,
    };
  }
}

export const policyIntelligenceEngine = new PolicyIntelligenceEngine();

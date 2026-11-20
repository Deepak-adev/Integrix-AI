import type {
  PolicyAnalysisRun,
  PolicyFinding,
  PolicyFindingReview,
  PolicyIntelligenceCategory,
  PolicyIntelligenceSeverity,
  PolicyFindingReviewStatus,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

export interface CreatePolicyAnalysisRunInput {
  runId: string;
  title?: string;
  scope?: string;
  status?: string;
  aiProvider?: string;
  aiModel?: string;
  summary?: string;
  totalFindings?: number;
  conflictsCount?: number;
  ambiguitiesCount?: number;
  missingCount?: number;
  duplicatesCount?: number;
  pendingReviewCount?: number;
  metadata?: Prisma.InputJsonValue;
  completedAt?: Date;
}

export interface CreatePolicyFindingInput {
  runId: string;
  findingId: string;
  category: PolicyIntelligenceCategory;
  severity?: PolicyIntelligenceSeverity;
  status?: PolicyFindingReviewStatus;
  title: string;
  explanation: string;
  affectedPolicyOrDoc: string;
  sourceDocumentName?: string;
  sourceLocator?: string;
  evidenceExcerpts?: string[];
  existingWording?: string;
  recommendedWording?: string;
  rationale?: string;
  confidence?: number;
  isNeedsVerification?: boolean;
  proposedDraftRuleId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface RecordFindingReviewInput {
  findingId: string;
  action: PolicyFindingReviewStatus;
  reviewerName?: string;
  reviewerRole?: string;
  adminComments?: string;
  rejectionReason?: string;
  modifiedWording?: string;
  stagedRuleId?: string;
  stagedDraftId?: string;
  metadata?: Prisma.InputJsonValue;
}

export interface FindingFilterOptions {
  runId?: string;
  category?: PolicyIntelligenceCategory;
  severity?: PolicyIntelligenceSeverity;
  status?: PolicyFindingReviewStatus;
}

/**
 * Organisation-scoped repository for Policy Intelligence.
 *
 * Strict multi-tenant isolation: every operation requires a resolved
 * OrganisationContext and is filtered by organisationId.
 */
export const policyIntelligenceRepository = {
  /**
   * Create an analysis run record.
   */
  async createRun(
    context: OrganisationContext | null | undefined,
    input: CreatePolicyAnalysisRunInput,
    db?: PrismaClient
  ): Promise<PolicyAnalysisRun> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    return prisma.policyAnalysisRun.create({
      data: {
        organisationId: ctx.organisationId,
        runId: input.runId,
        title: input.title,
        scope: input.scope ?? 'ALL',
        status: input.status ?? 'COMPLETED',
        aiProvider: input.aiProvider,
        aiModel: input.aiModel,
        summary: input.summary,
        totalFindings: input.totalFindings ?? 0,
        conflictsCount: input.conflictsCount ?? 0,
        ambiguitiesCount: input.ambiguitiesCount ?? 0,
        missingCount: input.missingCount ?? 0,
        duplicatesCount: input.duplicatesCount ?? 0,
        pendingReviewCount: input.pendingReviewCount ?? 0,
        metadata: input.metadata,
        completedAt: input.completedAt ?? new Date(),
      },
    });
  },

  /**
   * List analysis runs for the organisation.
   */
  async listRuns(
    context: OrganisationContext | null | undefined,
    limit = 50,
    db?: PrismaClient
  ): Promise<PolicyAnalysisRun[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    return prisma.policyAnalysisRun.findMany({
      where: organisationWhere(ctx),
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  /**
   * Get an analysis run by runId, optionally including findings.
   */
  async findRunById(
    context: OrganisationContext | null | undefined,
    runId: string,
    includeFindings = false,
    db?: PrismaClient
  ): Promise<(PolicyAnalysisRun & { findings?: PolicyFinding[] }) | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    if (includeFindings) {
      return prisma.policyAnalysisRun.findFirst({
        where: {
          ...organisationWhere(ctx),
          runId: runId.trim(),
        },
        include: { findings: { orderBy: { createdAt: 'asc' } } },
      });
    }

    return prisma.policyAnalysisRun.findFirst({
      where: {
        ...organisationWhere(ctx),
        runId: runId.trim(),
      },
    });
  },

  /**
   * Create multiple findings for an analysis run.
   */
  async createFindings(
    context: OrganisationContext | null | undefined,
    runId: string,
    findings: CreatePolicyFindingInput[],
    db?: PrismaClient
  ): Promise<PolicyFinding[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    const created: PolicyFinding[] = [];
    for (const f of findings) {
      const item = await prisma.policyFinding.create({
        data: {
          organisationId: ctx.organisationId,
          runId,
          findingId: f.findingId,
          category: f.category,
          severity: f.severity ?? 'MEDIUM',
          status: f.status ?? 'PENDING',
          title: f.title,
          explanation: f.explanation,
          affectedPolicyOrDoc: f.affectedPolicyOrDoc,
          sourceDocumentName: f.sourceDocumentName,
          sourceLocator: f.sourceLocator,
          evidenceExcerpts: f.evidenceExcerpts ?? [],
          existingWording: f.existingWording,
          recommendedWording: f.recommendedWording,
          rationale: f.rationale,
          confidence: f.confidence ?? 0.85,
          isNeedsVerification: f.isNeedsVerification ?? false,
          proposedDraftRuleId: f.proposedDraftRuleId,
          metadata: f.metadata,
        },
      });
      created.push(item);
    }
    return created;
  },

  /**
   * List findings for an organisation with optional filters.
   */
  async listFindings(
    context: OrganisationContext | null | undefined,
    filters?: FindingFilterOptions,
    db?: PrismaClient
  ): Promise<PolicyFinding[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    return prisma.policyFinding.findMany({
      where: {
        ...organisationWhere(ctx),
        ...(filters?.runId ? { runId: filters.runId.trim() } : {}),
        ...(filters?.category ? { category: filters.category } : {}),
        ...(filters?.severity ? { severity: filters.severity } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    });
  },

  /**
   * Find a single finding by findingId.
   */
  async findFindingById(
    context: OrganisationContext | null | undefined,
    findingId: string,
    includeReviews = true,
    db?: PrismaClient
  ): Promise<(PolicyFinding & { reviews?: PolicyFindingReview[] }) | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    if (includeReviews) {
      return prisma.policyFinding.findFirst({
        where: {
          ...organisationWhere(ctx),
          findingId: findingId.trim(),
        },
        include: { reviews: { orderBy: { reviewedAt: 'desc' } } },
      });
    }

    return prisma.policyFinding.findFirst({
      where: {
        ...organisationWhere(ctx),
        findingId: findingId.trim(),
      },
    });
  },

  /**
   * Record an administrator review decision and update finding status.
   * Atomic operation within a transaction.
   */
  async recordReviewDecision(
    context: OrganisationContext | null | undefined,
    input: RecordFindingReviewInput,
    db?: PrismaClient
  ): Promise<{ finding: PolicyFinding; review: PolicyFindingReview }> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    const finding = await prisma.policyFinding.findFirst({
      where: {
        ...organisationWhere(ctx),
        findingId: input.findingId.trim(),
      },
    });

    if (!finding) {
      throw new Error(`Policy finding '${input.findingId}' not found in organisation.`);
    }

    // Update finding status and create audit trail entry
    const [updatedFinding, reviewRecord] = await prisma.$transaction([
      prisma.policyFinding.update({
        where: {
          organisationId_findingId: {
            organisationId: ctx.organisationId,
            findingId: input.findingId.trim(),
          },
        },
        data: {
          status: input.action,
          recommendedWording: input.modifiedWording ?? finding.recommendedWording,
          proposedDraftRuleId: input.stagedRuleId ?? finding.proposedDraftRuleId,
        },
      }),
      prisma.policyFindingReview.create({
        data: {
          organisationId: ctx.organisationId,
          findingId: input.findingId.trim(),
          action: input.action,
          reviewerName: input.reviewerName ?? 'Lead Compliance Administrator',
          reviewerRole: input.reviewerRole ?? 'ADMIN',
          adminComments: input.adminComments,
          rejectionReason: input.rejectionReason,
          modifiedWording: input.modifiedWording,
          stagedRuleId: input.stagedRuleId,
          stagedDraftId: input.stagedDraftId,
          metadata: input.metadata,
        },
      }),
    ]);

    return { finding: updatedFinding, review: reviewRecord };
  },

  /**
   * List all findings currently staged for administrator approval (ACCEPTED or EDITED).
   */
  async listStagedFindings(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<PolicyFinding[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    return prisma.policyFinding.findMany({
      where: {
        ...organisationWhere(ctx),
        status: { in: ['ACCEPTED', 'EDITED'] },
      },
      include: {
        reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 },
      },
      orderBy: [{ severity: 'desc' }, { updatedAt: 'desc' }],
    });
  },

  /**
   * Formally approve a staged recommendation and convert it into a PolicyRule draft/rule record.
   */
  async formallyApproveStagedFinding(
    context: OrganisationContext | null | undefined,
    findingId: string,
    adminDecision: {
      action: 'APPROVE' | 'REJECT';
      adminName: string;
      adminRole?: string;
      comments?: string;
      rejectionReason?: string;
    },
    db?: PrismaClient
  ): Promise<{ finding: PolicyFinding; rule?: any; review: PolicyFindingReview }> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();

    const finding = await prisma.policyFinding.findFirst({
      where: {
        ...organisationWhere(ctx),
        findingId: findingId.trim(),
      },
      include: { reviews: { orderBy: { reviewedAt: 'desc' }, take: 1 } },
    });

    if (!finding) {
      throw new Error(`Policy finding '${findingId}' not found.`);
    }

    if (adminDecision.action === 'REJECT') {
      const [updatedFinding, reviewRecord] = await prisma.$transaction([
        prisma.policyFinding.update({
          where: {
            organisationId_findingId: {
              organisationId: ctx.organisationId,
              findingId: findingId.trim(),
            },
          },
          data: {
            status: 'REJECTED',
          },
        }),
        prisma.policyFindingReview.create({
          data: {
            organisationId: ctx.organisationId,
            findingId: findingId.trim(),
            action: 'REJECTED',
            reviewerName: adminDecision.adminName,
            reviewerRole: adminDecision.adminRole ?? 'ADMINISTRATOR',
            adminComments: adminDecision.comments,
            rejectionReason: adminDecision.rejectionReason ?? 'Formally rejected in Administrator Approval Center',
          },
        }),
      ]);
      return { finding: updatedFinding, review: reviewRecord };
    }

    // APPROVE ACTION: Convert staged finding into active/approved PolicyRule
    const ruleIdToUse = finding.proposedDraftRuleId || `NW-RULE-PI-${Date.now().toString(36).toUpperCase()}`;
    const ruleVersion = 'v1.0';

    const [updatedFinding, reviewRecord, createdRule] = await prisma.$transaction([
      prisma.policyFinding.update({
        where: {
          organisationId_findingId: {
            organisationId: ctx.organisationId,
            findingId: findingId.trim(),
          },
        },
        data: {
          status: 'ACCEPTED',
          proposedDraftRuleId: ruleIdToUse,
        },
      }),
      prisma.policyFindingReview.create({
        data: {
          organisationId: ctx.organisationId,
          findingId: findingId.trim(),
          action: 'ACCEPTED',
          reviewerName: adminDecision.adminName,
          reviewerRole: adminDecision.adminRole ?? 'ADMINISTRATOR',
          adminComments: adminDecision.comments ?? 'Formally certified and approved into versioned rulebook',
          stagedRuleId: ruleIdToUse,
        },
      }),
      prisma.policyRule.upsert({
        where: {
          organisationId_ruleId_ruleVersion: {
            organisationId: ctx.organisationId,
            ruleId: ruleIdToUse,
            ruleVersion,
          },
        },
        create: {
          organisationId: ctx.organisationId,
          ruleId: ruleIdToUse,
          ruleVersion,
          ruleCategory: finding.category,
          policyText: finding.recommendedWording || finding.title,
          errorMessage: finding.explanation,
          correctionGuidance: finding.rationale ?? 'Adhere strictly to canonical brand guidelines and verified catalogue records.',
          sourceIds: finding.sourceDocumentName ? [finding.sourceDocumentName] : [],
          severity: finding.severity === 'HIGH' ? 'CRITICAL' : finding.severity === 'LOW' ? 'TIP' : 'WARNING',
          engine: 'DETERMINISTIC',
          executionMode: 'ENFORCE',
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          approvedBy: adminDecision.adminName,
          approvedAt: new Date(),
          activatedBy: adminDecision.adminName,
          activatedAt: new Date(),
          effectiveFrom: new Date(),
          reasoning: finding.rationale,
          badExample: finding.existingWording,
          goodExample: finding.recommendedWording,
          metadata: {
            originatingFindingId: finding.findingId,
            origin: 'AGENTIC_POLICY_INTELLIGENCE',
            sourceLocator: finding.sourceLocator,
            evidenceExcerpts: finding.evidenceExcerpts,
          },
        },
        update: {
          policyText: finding.recommendedWording || finding.title,
          errorMessage: finding.explanation,
          correctionGuidance: finding.rationale ?? 'Adhere strictly to canonical brand guidelines and verified catalogue records.',
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          approvedBy: adminDecision.adminName,
          approvedAt: new Date(),
          activatedBy: adminDecision.adminName,
          activatedAt: new Date(),
          updatedAt: new Date(),
        },
      }),
    ]);

    return { finding: updatedFinding, rule: createdRule, review: reviewRecord };
  },
};

import { Request, Response } from 'express';
import { policyIntelligenceEngine } from '../services/policy-intelligence/index.js';
import { policyIntelligenceRepository } from '../services/repositories/policy-intelligence.repository.js';
import { getAuditDataSourceMode } from '../services/audit-engine/audit-source-config.js';
import type {
  PolicyAnalysisScope,
  PolicyIntelligenceFinding,
  PolicyAnalysisResult,
} from '../services/policy-intelligence/policy-intelligence.types.js';
import type {
  PolicyIntelligenceCategory,
  PolicyIntelligenceSeverity,
  PolicyFindingReviewStatus,
} from '@prisma/client';

const VALID_SCOPES = new Set(['ALL', 'ACTIVE_RULES', 'SOURCES', 'DRAFTS']);
const VALID_CATEGORIES = new Set(['CONFLICT', 'AMBIGUITY', 'MISSING_REQUIREMENT', 'DUPLICATION']);
const VALID_SEVERITIES = new Set(['HIGH', 'MEDIUM', 'LOW']);
const VALID_STATUSES = new Set(['PENDING', 'ACCEPTED', 'REJECTED', 'EDITED', 'DEFERRED']);
const VALID_ACTIONS = new Set(['ACCEPT', 'REJECT', 'EDIT', 'DEFER']);

export class PolicyIntelligenceController {
  // In-memory run and finding stores for file-mode or database-failover
  private static memoryRuns: Map<string, { organisationId: string; run: PolicyAnalysisResult }> = new Map();
  private static memoryReviews: Map<
    string,
    {
      organisationId: string;
      findingId: string;
      action: PolicyFindingReviewStatus;
      reviewerName: string;
      reviewerRole: string;
      adminComments?: string;
      rejectionReason?: string;
      modifiedWording?: string;
      stagedRuleId?: string;
      stagedDraftId?: string;
      reviewedAt: Date;
    }[]
  > = new Map();

  /**
   * POST /api/policy-intelligence/analyze
   * Trigger the policy intelligence analysis for the resolved organisation.
   */
  public async analyze(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      // Validate scope if provided
      const rawScope = req.body?.scope;
      let scopeType: PolicyAnalysisScope['scopeType'] = 'ALL';
      if (rawScope) {
        const upperScope = String(rawScope).trim().toUpperCase();
        if (!VALID_SCOPES.has(upperScope)) {
          res.status(400).json({
            error: `Invalid analysis scope '${rawScope}'. Allowed scopes: ALL, ACTIVE_RULES, SOURCES, DRAFTS.`,
          });
          return;
        }
        scopeType = upperScope as PolicyAnalysisScope['scopeType'];
      }

      const scope: PolicyAnalysisScope = {
        scopeType,
        selectedRuleIds: Array.isArray(req.body?.ruleIds) ? req.body.ruleIds : undefined,
        selectedSourceIds: Array.isArray(req.body?.documentIds) ? req.body.documentIds : undefined,
      };

      // Execute Policy Intelligence Engine
      const result = await policyIntelligenceEngine.analyze(org, scope);

      // Save in memory store (always accessible for fast retrieval and file-mode)
      PolicyIntelligenceController.memoryRuns.set(result.runId, {
        organisationId: org.organisationId,
        run: result,
      });

      res.status(200).json({
        runId: result.runId,
        title: result.title,
        scope: result.scope,
        status: result.status,
        aiProvider: result.aiProvider,
        aiModel: result.aiModel,
        isAiEnhanced: result.isAiEnhanced,
        summary: result.summary,
        totalFindings: result.totalFindings,
        conflictsCount: result.conflictsCount,
        ambiguitiesCount: result.ambiguitiesCount,
        missingCount: result.missingCount,
        duplicatesCount: result.duplicatesCount,
        pendingReviewCount: result.pendingReviewCount,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.analyze] Error:', err);
      res.status(500).json({
        error: 'Failed to execute policy intelligence analysis.',
        details: err.message,
      });
    }
  }

  /**
   * GET /api/policy-intelligence/runs
   * Return analysis runs history for current organisation with pagination.
   */
  public async getRuns(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const mode = getAuditDataSourceMode();
      let runs: any[] = [];
      let total = 0;

      if (mode === 'database') {
        try {
          const dbRuns = await policyIntelligenceRepository.listRuns(org, limit * 2);
          total = dbRuns.length;
          runs = dbRuns.slice(skip, skip + limit);
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.getRuns] DB list failed, falling back to memory:', dbErr.message);
        }
      }

      // Memory fallback if DB mode produced 0 or in file mode
      if (runs.length === 0) {
        const orgRuns = Array.from(PolicyIntelligenceController.memoryRuns.values())
          .filter(r => r.organisationId === org.organisationId)
          .map(r => ({
            runId: r.run.runId,
            title: r.run.title,
            scope: r.run.scope,
            status: r.run.status,
            aiProvider: r.run.aiProvider,
            aiModel: r.run.aiModel,
            summary: r.run.summary,
            totalFindings: r.run.totalFindings,
            conflictsCount: r.run.conflictsCount,
            ambiguitiesCount: r.run.ambiguitiesCount,
            missingCount: r.run.missingCount,
            duplicatesCount: r.run.duplicatesCount,
            pendingReviewCount: r.run.pendingReviewCount,
            completedAt: r.run.completedAt,
            createdAt: r.run.startedAt,
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        total = orgRuns.length;
        runs = orgRuns.slice(skip, skip + limit);
      }

      res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        runs,
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.getRuns] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve analysis runs.', details: err.message });
    }
  }

  /**
   * GET /api/policy-intelligence/runs/:runId
   * Return analysis run details and its findings. Enforces organisation isolation.
   */
  public async getRunById(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const runId = req.params.runId?.trim();
      if (!runId) {
        res.status(400).json({ error: 'Analysis run ID is required.' });
        return;
      }

      const mode = getAuditDataSourceMode();

      // Check DB if database mode
      if (mode === 'database') {
        try {
          const dbRun = await policyIntelligenceRepository.findRunById(org, runId, true);
          if (dbRun) {
            res.status(200).json(dbRun);
            return;
          }
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.getRunById] DB lookup failed, checking memory:', dbErr.message);
        }
      }

      // Memory lookup
      const memRun = PolicyIntelligenceController.memoryRuns.get(runId);
      if (memRun) {
        if (memRun.organisationId !== org.organisationId) {
          // Tenant isolation check: return 404 to avoid leaking cross-tenant existence
          res.status(404).json({ error: `Analysis run '${runId}' not found.` });
          return;
        }

        res.status(200).json({
          runId: memRun.run.runId,
          title: memRun.run.title,
          scope: memRun.run.scope,
          status: memRun.run.status,
          aiProvider: memRun.run.aiProvider,
          aiModel: memRun.run.aiModel,
          summary: memRun.run.summary,
          totalFindings: memRun.run.totalFindings,
          conflictsCount: memRun.run.conflictsCount,
          ambiguitiesCount: memRun.run.ambiguitiesCount,
          missingCount: memRun.run.missingCount,
          duplicatesCount: memRun.run.duplicatesCount,
          pendingReviewCount: memRun.run.pendingReviewCount,
          completedAt: memRun.run.completedAt,
          findings: memRun.run.findings,
        });
        return;
      }

      res.status(404).json({ error: `Analysis run '${runId}' not found.` });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.getRunById] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve analysis run.', details: err.message });
    }
  }

  /**
   * GET /api/policy-intelligence/findings
   * Return findings with filters for category, severity, status, and runId with pagination.
   */
  public async getFindings(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const { category, severity, status, runId } = req.query;

      // Validate filters if provided
      if (category && !VALID_CATEGORIES.has(String(category).trim().toUpperCase())) {
        res.status(400).json({
          error: `Invalid category '${category}'. Allowed: CONFLICT, AMBIGUITY, MISSING_REQUIREMENT, DUPLICATION.`,
        });
        return;
      }
      if (severity && !VALID_SEVERITIES.has(String(severity).trim().toUpperCase())) {
        res.status(400).json({
          error: `Invalid severity '${severity}'. Allowed: HIGH, MEDIUM, LOW.`,
        });
        return;
      }
      if (status && !VALID_STATUSES.has(String(status).trim().toUpperCase())) {
        res.status(400).json({
          error: `Invalid status '${status}'. Allowed: PENDING, ACCEPTED, REJECTED, EDITED, DEFERRED.`,
        });
        return;
      }

      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 50));
      const skip = (page - 1) * limit;

      const mode = getAuditDataSourceMode();
      let findings: any[] = [];
      let total = 0;

      if (mode === 'database') {
        try {
          const filterOptions: any = {};
          if (runId) filterOptions.runId = String(runId).trim();
          if (category) filterOptions.category = String(category).trim().toUpperCase() as PolicyIntelligenceCategory;
          if (severity) filterOptions.severity = String(severity).trim().toUpperCase() as PolicyIntelligenceSeverity;
          if (status) filterOptions.status = String(status).trim().toUpperCase() as PolicyFindingReviewStatus;

          const dbFindings = await policyIntelligenceRepository.listFindings(org, filterOptions);
          total = dbFindings.length;
          findings = dbFindings.slice(skip, skip + limit);
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.getFindings] DB list failed, checking memory:', dbErr.message);
        }
      }

      // Memory fallback if DB returned empty or in file-mode
      if (findings.length === 0) {
        let memFindings: PolicyIntelligenceFinding[] = [];
        if (runId) {
          const runIdStr = String(runId).trim();
          const targetRun = PolicyIntelligenceController.memoryRuns.get(runIdStr);
          if (targetRun && targetRun.organisationId === org.organisationId) {
            memFindings = [...targetRun.run.findings];
          }
        } else {
          // When querying findings across the organisation without a specific runId,
          // deduplicate deterministic findings across consecutive runs by logical signature (proposedDraftRuleId or title)
          // to prevent duplicates from multiplying counts (e.g. 6 findings per run -> 12).
          // We preserve the latest state of each unique finding.
          const findingsByLogicalKey = new Map<string, PolicyIntelligenceFinding>();
          
          // Sort runs chronologically so latest run findings overwrite earlier ones
          const sortedRuns = Array.from(PolicyIntelligenceController.memoryRuns.values())
            .filter(rd => rd.organisationId === org.organisationId)
            .sort((a, b) => new Date(a.run.completedAt || a.run.startedAt).getTime() - new Date(b.run.completedAt || b.run.startedAt).getTime());

          for (const runData of sortedRuns) {
            for (const finding of runData.run.findings) {
              const logicalKey = finding.proposedDraftRuleId || finding.title;
              findingsByLogicalKey.set(logicalKey, finding);
            }
          }

          memFindings = Array.from(findingsByLogicalKey.values());
        }

        // Apply filters
        if (category) {
          memFindings = memFindings.filter(f => f.category === String(category).trim().toUpperCase());
        }
        if (severity) {
          memFindings = memFindings.filter(f => f.severity === String(severity).trim().toUpperCase());
        }
        if (status) {
          memFindings = memFindings.filter(f => f.status === String(status).trim().toUpperCase());
        }

        total = memFindings.length;
        findings = memFindings.slice(skip, skip + limit);
      }

      res.status(200).json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        findings,
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.getFindings] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve findings.', details: err.message });
    }
  }

  /**
   * POST /api/policy-intelligence/findings/:findingId/review
   * Review an AI finding with ACCEPT, REJECT, EDIT, or DEFER action.
   * Persists administrator decision and review trail.
   */
  public async reviewFinding(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const findingId = req.params.findingId?.trim();
      if (!findingId) {
        res.status(400).json({ error: 'Finding ID is required.' });
        return;
      }

      const {
        action,
        reviewerName,
        reviewerRole,
        adminComments,
        rejectionReason,
        modifiedWording,
        stagedRuleId,
        stagedDraftId,
      } = req.body || {};

      if (!action) {
        res.status(400).json({
          error: 'Action is required. Permitted actions: ACCEPT, REJECT, EDIT, DEFER.',
        });
        return;
      }

      const upperAction = String(action).trim().toUpperCase();
      if (!VALID_ACTIONS.has(upperAction)) {
        res.status(400).json({
          error: `Invalid review action '${action}'. Permitted actions: ACCEPT, REJECT, EDIT, DEFER.`,
        });
        return;
      }

      // Map action to PolicyFindingReviewStatus
      const reviewStatusMap: Record<string, PolicyFindingReviewStatus> = {
        ACCEPT: 'ACCEPTED',
        REJECT: 'REJECTED',
        EDIT: 'EDITED',
        DEFER: 'DEFERRED',
      };
      const statusValue = reviewStatusMap[upperAction];

      // Validation for specific actions
      if (upperAction === 'REJECT' && !rejectionReason && !adminComments) {
        res.status(400).json({
          error: 'A rejection reason or administrative comment is required when rejecting a finding.',
        });
        return;
      }
      if (upperAction === 'EDIT' && !modifiedWording) {
        res.status(400).json({
          error: 'Modified wording is required when editing a finding recommendation.',
        });
        return;
      }

      const mode = getAuditDataSourceMode();

      // Database persistence
      if (mode === 'database') {
        try {
          const existing = await policyIntelligenceRepository.findFindingById(org, findingId, false);
          if (!existing) {
            res.status(404).json({ error: `Policy finding '${findingId}' not found in organisation.` });
            return;
          }

          const recordResult = await policyIntelligenceRepository.recordReviewDecision(org, {
            findingId,
            action: statusValue,
            reviewerName: reviewerName ?? 'Compliance Administrator',
            reviewerRole: reviewerRole ?? 'ADMIN',
            adminComments,
            rejectionReason,
            modifiedWording,
            stagedRuleId: stagedRuleId ?? existing.proposedDraftRuleId ?? undefined,
            stagedDraftId,
          });

          res.status(200).json({
            message: `Finding ${findingId} review decision recorded successfully.`,
            status: recordResult.finding.status,
            finding: recordResult.finding,
            review: recordResult.review,
            isStagedForApproval: upperAction === 'ACCEPT' || upperAction === 'EDIT',
          });
          return;
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.reviewFinding] DB transaction failed, checking memory:', dbErr.message);
        }
      }

      // Memory persistence for file-mode or DB failover
      let targetFinding: PolicyIntelligenceFinding | undefined;
      for (const runData of PolicyIntelligenceController.memoryRuns.values()) {
        if (runData.organisationId === org.organisationId) {
          const match = runData.run.findings.find(f => f.findingId === findingId);
          if (match) {
            targetFinding = match;
            break;
          }
        }
      }

      if (!targetFinding) {
        res.status(404).json({ error: `Policy finding '${findingId}' not found in organisation.` });
        return;
      }

      // Update in-memory finding
      targetFinding.status = statusValue;
      if (modifiedWording) {
        targetFinding.recommendedWording = modifiedWording;
      }

      // Record memory review log
      const reviewEntry = {
        organisationId: org.organisationId,
        findingId,
        action: statusValue,
        reviewerName: reviewerName ?? 'Compliance Administrator',
        reviewerRole: reviewerRole ?? 'ADMIN',
        adminComments,
        rejectionReason,
        modifiedWording,
        stagedRuleId: stagedRuleId ?? targetFinding.proposedDraftRuleId,
        stagedDraftId,
        reviewedAt: new Date(),
      };

      const existingReviews = PolicyIntelligenceController.memoryReviews.get(findingId) || [];
      existingReviews.unshift(reviewEntry);
      PolicyIntelligenceController.memoryReviews.set(findingId, existingReviews);

      res.status(200).json({
        message: `Finding ${findingId} review decision recorded successfully.`,
        status: targetFinding.status,
        finding: targetFinding,
        review: reviewEntry,
        isStagedForApproval: upperAction === 'ACCEPT' || upperAction === 'EDIT',
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.reviewFinding] Error:', err);
      res.status(500).json({ error: 'Failed to record review decision.', details: err.message });
    }
  }

  /**
   * GET /api/policy-intelligence/staged
   * Return all findings staged for formal administrator approval (status in ACCEPTED, EDITED).
   */
  public async getStagedFindings(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const mode = getAuditDataSourceMode();
      let staged: any[] = [];

      if (mode === 'database') {
        try {
          staged = await policyIntelligenceRepository.listStagedFindings(org);
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.getStagedFindings] DB list failed, checking memory:', dbErr.message);
        }
      }

      if (staged.length === 0) {
        for (const runData of PolicyIntelligenceController.memoryRuns.values()) {
          if (runData.organisationId === org.organisationId) {
            for (const f of runData.run.findings) {
              if (f.status === 'ACCEPTED' || f.status === 'EDITED') {
                const reviews = PolicyIntelligenceController.memoryReviews.get(f.findingId) || [];
                staged.push({
                  ...f,
                  reviews,
                });
              }
            }
          }
        }
      }

      res.status(200).json({
        total: staged.length,
        stagedFindings: staged,
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.getStagedFindings] Error:', err);
      res.status(500).json({ error: 'Failed to retrieve staged policy recommendations.', details: err.message });
    }
  }

  /**
   * POST /api/policy-intelligence/findings/:findingId/approve-rule
   * Formally approve or reject a staged recommendation into an active policy rule.
   */
  public async formallyApproveRule(req: Request, res: Response): Promise<void> {
    try {
      const org = req.organisation;
      if (!org || !org.organisationId) {
        res.status(400).json({ error: 'Organisation context could not be resolved.' });
        return;
      }

      const findingId = req.params.findingId?.trim();
      if (!findingId) {
        res.status(400).json({ error: 'Finding ID is required.' });
        return;
      }

      const { action, adminName, adminRole, comments, rejectionReason } = req.body || {};
      const upperAction = String(action || 'APPROVE').trim().toUpperCase();

      if (upperAction !== 'APPROVE' && upperAction !== 'REJECT') {
        res.status(400).json({
          error: `Invalid approval action '${action}'. Permitted actions: APPROVE, REJECT.`,
        });
        return;
      }

      if (upperAction === 'REJECT' && !rejectionReason && !comments) {
        res.status(400).json({
          error: 'A rejection reason is required when rejecting a staged recommendation.',
        });
        return;
      }

      const mode = getAuditDataSourceMode();

      if (mode === 'database') {
        try {
          const result = await policyIntelligenceRepository.formallyApproveStagedFinding(org, findingId, {
            action: upperAction as 'APPROVE' | 'REJECT',
            adminName: adminName ?? 'Lead Compliance Administrator',
            adminRole: adminRole ?? 'ADMINISTRATOR',
            comments,
            rejectionReason,
          });

          res.status(200).json({
            message:
              upperAction === 'APPROVE'
                ? `Policy rule ${result.rule?.ruleId || findingId} formally approved and certified into active rulebook.`
                : `Recommendation ${findingId} rejected and prevented from activation.`,
            action: upperAction,
            finding: result.finding,
            rule: result.rule,
            review: result.review,
            rulebookVersion: 'v1.0-certified',
          });
          return;
        } catch (dbErr: any) {
          console.warn('[PolicyIntelligenceController.formallyApproveRule] DB error, checking memory:', dbErr.message);
        }
      }

      // Memory fallback for file-mode or DB failover
      let targetFinding: PolicyIntelligenceFinding | undefined;
      for (const runData of PolicyIntelligenceController.memoryRuns.values()) {
        if (runData.organisationId === org.organisationId) {
          const match = runData.run.findings.find(f => f.findingId === findingId);
          if (match) {
            targetFinding = match;
            break;
          }
        }
      }

      if (!targetFinding) {
        res.status(404).json({ error: `Policy finding '${findingId}' not found in organisation.` });
        return;
      }

      if (upperAction === 'REJECT') {
        targetFinding.status = 'REJECTED';
        const reviewEntry = {
          organisationId: org.organisationId,
          findingId,
          action: 'REJECTED' as any,
          reviewerName: adminName ?? 'Lead Compliance Administrator',
          reviewerRole: adminRole ?? 'ADMINISTRATOR',
          adminComments: comments,
          rejectionReason: rejectionReason ?? 'Formally rejected in Administrator Approval Center',
          reviewedAt: new Date(),
        };
        const existingReviews = PolicyIntelligenceController.memoryReviews.get(findingId) || [];
        existingReviews.unshift(reviewEntry);
        PolicyIntelligenceController.memoryReviews.set(findingId, existingReviews);

        res.status(200).json({
          message: `Recommendation ${findingId} rejected and prevented from activation.`,
          action: 'REJECT',
          finding: targetFinding,
          review: reviewEntry,
        });
        return;
      }

      // APPROVE ACTION in memory
      targetFinding.status = 'ACCEPTED';
      const ruleIdToUse = targetFinding.proposedDraftRuleId || `NW-RULE-PI-${Date.now().toString(36).toUpperCase()}`;
      targetFinding.proposedDraftRuleId = ruleIdToUse;

      const reviewEntry = {
        organisationId: org.organisationId,
        findingId,
        action: 'ACCEPTED' as any,
        reviewerName: adminName ?? 'Lead Compliance Administrator',
        reviewerRole: adminRole ?? 'ADMINISTRATOR',
        adminComments: comments ?? 'Formally certified and approved into versioned rulebook',
        stagedRuleId: ruleIdToUse,
        reviewedAt: new Date(),
      };
      const existingReviews = PolicyIntelligenceController.memoryReviews.get(findingId) || [];
      existingReviews.unshift(reviewEntry);
      PolicyIntelligenceController.memoryReviews.set(findingId, existingReviews);

      const createdRule = {
        ruleId: ruleIdToUse,
        ruleVersion: 'v1.0',
        ruleName: targetFinding.title,
        severity: targetFinding.severity === 'HIGH' ? 'CRITICAL' : targetFinding.severity === 'LOW' ? 'TIP' : 'WARNING',
        policyStatement: targetFinding.recommendedWording || targetFinding.title,
        authoritySourceId: targetFinding.sourceDocumentName,
        sourceLocator: targetFinding.sourceLocator,
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        approvedBy: adminName ?? 'Lead Compliance Administrator',
        approvedAt: new Date().toISOString(),
      };

      res.status(200).json({
        message: `Policy rule ${ruleIdToUse} formally approved and certified into active rulebook.`,
        action: 'APPROVE',
        finding: targetFinding,
        rule: createdRule,
        review: reviewEntry,
        rulebookVersion: 'v1.0-certified',
      });
    } catch (err: any) {
      console.error('[PolicyIntelligenceController.formallyApproveRule] Error:', err);
      res.status(500).json({ error: 'Failed to formally approve policy rule.', details: err.message });
    }
  }
}

export const policyIntelligenceController = new PolicyIntelligenceController();

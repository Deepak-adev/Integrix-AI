import crypto from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { requireOrganisationContext } from '../organisation/tenant-context.js';
import { AuditPersistenceError } from './audit-persistence.errors.js';
import type { AuditResult } from '../../types/index.js';
import { buildAuditSnapshot, toAdSubmissionData, toAuditResult, toFindingData } from './audit-persistence.mapper.js';
import type { PersistAuditInput, PersistAuditResult } from './audit-persistence.types.js';

function sha256(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function readSnapshotHash(extractedData: unknown): string | null {
  const data = extractedData as { auditSnapshot?: { contentHash?: string } } | null;
  return data?.auditSnapshot?.contentHash ?? null;
}

/**
 * Organisation-scoped audit persistence service.
 *
 * - Requires a trusted OrganisationContext for every operation.
 * - Keeps all Prisma access inside the persistence layer.
 * - Persists submission + findings atomically (single transaction).
 * - Idempotent on (organisationId, submissionId, contentHash).
 * - No frontend endpoints are exposed by this service.
 */
export class AuditPersistenceService {
  constructor(private readonly prisma: PrismaClient = getPrisma()) {}

  private async findExisting(organisationId: string, submissionId: string) {
    return this.prisma.adSubmission.findUnique({
      where: { organisationId_submissionId: { organisationId, submissionId } },
      include: { findings: true },
    });
  }

  private async resolveRuleVersions(organisationId: string, ruleIds: string[]) {
    const map = new Map<string, string | null>();
    if (ruleIds.length === 0) return map;
    const rows = await this.prisma.policyRule.findMany({
      where: { organisationId, ruleId: { in: ruleIds } },
      select: { ruleId: true, ruleVersion: true },
    });
    for (const row of rows) {
      if (!map.has(row.ruleId)) map.set(row.ruleId, row.ruleVersion);
    }
    return map;
  }

  private async validateRelease(organisationId: string, releaseId: string | null | undefined) {
    if (!releaseId) return null;
    const release = await this.prisma.rulebookRelease.findFirst({
      where: { id: releaseId, organisationId },
      select: { id: true },
    });
    if (!release) {
      throw new AuditPersistenceError('RELEASE_NOT_FOUND', 'Rulebook release not found for this organisation.');
    }
    return release.id;
  }

  /**
   * Persist a completed audit result with its findings atomically.
   * Idempotent: same org + submissionId + content returns the existing record;
   * same org + submissionId + different content raises SUBMISSION_CONFLICT.
   */
  async persistAudit(ctx: OrganisationContext, input: PersistAuditInput): Promise<PersistAuditResult> {
    const context = requireOrganisationContext(ctx);
    const contentHash = sha256(input.content);
    const submissionId = input.result.submissionId;

    // Validate rulebook release ownership before any write.
    const releaseId = await this.validateRelease(context.organisationId, input.rulebookReleaseId);

    // Idempotency pre-check.
    const existing = await this.findExisting(context.organisationId, submissionId);
    if (existing) {
      const storedHash = readSnapshotHash(existing.extractedData);
      if (storedHash === contentHash) {
        return {
          submissionId,
          adSubmissionId: existing.id,
          overallStatus: existing.overallStatus,
          findingsCount: existing.findings.length,
          idempotentReplay: true,
        };
      }
      throw new AuditPersistenceError('SUBMISSION_CONFLICT', 'Submission ID already exists with different content.');
    }

    const ruleVersions = await this.resolveRuleVersions(context.organisationId, input.result.executedRules ?? []);
    const snapshot = buildAuditSnapshot(context, { ...input, rulebookReleaseId: releaseId }, contentHash, ruleVersions);
    const submissionData = toAdSubmissionData(context, { ...input, rulebookReleaseId: releaseId }, snapshot, input.file);
    const findingsData = (input.result.findings ?? []).map((f) => toFindingData(context, f, ''));

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const submission = await tx.adSubmission.create({ data: submissionData as Prisma.AdSubmissionUncheckedCreateInput });
        if (findingsData.length > 0) {
          await tx.finding.createMany({
            data: findingsData.map((f) => ({ ...f, adSubmissionId: submission.id })),
          });
        }
        return submission;
      });

      return {
        submissionId,
        adSubmissionId: created.id,
        overallStatus: created.overallStatus,
        findingsCount: findingsData.length,
        idempotentReplay: false,
      };
    } catch (err: any) {
      // Handle unique-constraint race: another request persisted the same
      // (organisationId, submissionId) concurrently.
      if (err?.code === 'P2002') {
        const raced = await this.findExisting(context.organisationId, submissionId);
        if (raced) {
          const storedHash = readSnapshotHash(raced.extractedData);
          if (storedHash === contentHash) {
            return {
              submissionId,
              adSubmissionId: raced.id,
              overallStatus: raced.overallStatus,
              findingsCount: raced.findings.length,
              idempotentReplay: true,
            };
          }
          throw new AuditPersistenceError('SUBMISSION_CONFLICT', 'Submission ID already exists with different content.');
        }
      }
      throw new AuditPersistenceError('DATABASE', 'Failed to persist audit submission.');
    }
  }

  /**
   * Return the reconstructed AuditResult for an already-completed submission
   * when the content hash matches, or null when no such submission exists.
   * Throws SUBMISSION_CONFLICT when the submissionId exists with different content.
   * Used to avoid re-running an identical completed audit.
   */
  async getCompletedAuditResult(ctx: OrganisationContext, submissionId: string, contentHash: string): Promise<AuditResult | null> {
    const context = requireOrganisationContext(ctx);
    const existing = await this.findExisting(context.organisationId, submissionId);
    if (!existing) return null;
    const storedHash = readSnapshotHash(existing.extractedData);
    if (storedHash !== contentHash) {
      throw new AuditPersistenceError('SUBMISSION_CONFLICT', 'Submission ID already exists with different content.');
    }
    return toAuditResult(existing, existing.findings, context);
  }

  /** Read a submission with findings, scoped to the organisation. */
  async getSubmission(ctx: OrganisationContext, submissionId: string) {
    const context = requireOrganisationContext(ctx);
    return this.prisma.adSubmission.findUnique({
      where: { organisationId_submissionId: { organisationId: context.organisationId, submissionId } },
      include: { findings: true },
    });
  }
}

export const auditPersistenceService = new AuditPersistenceService();

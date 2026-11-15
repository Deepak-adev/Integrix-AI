import type { Prisma } from '@prisma/client';
import type { AuditResult, Finding } from '../../types/index.js';
import type { OrganisationContext } from '../../types/index.js';
import type { AuditFileInfo, AuditSnapshot, PersistAuditInput } from './audit-persistence.types.js';

function parsePublicationDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * Build the immutable audit-time snapshot. No schema change: stored in
 * AdSubmission.extractedData.auditSnapshot (JSON).
 */
export function buildAuditSnapshot(
  ctx: OrganisationContext,
  input: PersistAuditInput,
  contentHash: string,
  ruleVersions: Map<string, string | null>
): AuditSnapshot {
  const executedRules = (input.result.executedRules ?? []).map((ruleId) => ({
    ruleId,
    ruleVersion: ruleVersions.get(ruleId) ?? null,
  }));
  return {
    contentHash,
    dataSourceMode: input.dataSourceMode ?? 'file',
    executedRules,
    policyRulesExecuted: executedRules.length > 0,
    rulebookReleaseId: input.rulebookReleaseId ?? null,
    rulebookVersion: input.rulebookVersion ?? input.result.metadata?.rulebookVersion ?? null,
    policySourceIds: [],
    executionTimestamp: input.result.metadata?.auditTimestamp ?? new Date().toISOString(),
  };
}

/** Map an AuditResult + snapshot into AdSubmission create data (without findings). */
export function toAdSubmissionData(
  ctx: OrganisationContext,
  input: PersistAuditInput,
  snapshot: AuditSnapshot,
  file?: AuditFileInfo
): Prisma.AdSubmissionUncheckedCreateInput {
  const r = input.result;
  const meta = r.metadata ?? {};
  return {
    organisationId: ctx.organisationId,
    submissionId: r.submissionId,
    filename: file?.fileName ?? r.filename ?? null,
    fileType: file?.fileType ?? null,
    fileSize: file?.fileSize ?? null,
    mimeType: file?.mimeType ?? null,
    storagePath: file?.storagePath ?? null,
    publicationChannel: meta.publicationChannel ?? null,
    publicationDate: parsePublicationDate(meta.publicationDate),
    sku: r.extractedContent?.detectedSku ?? meta.sku ?? null,
    advertisedPriceInr: r.extractedContent?.detectedPrice ?? null,
    advertisedComposition: r.extractedContent?.detectedComposition ?? null,
    performanceClaims: r.extractedContent?.performanceClaims ?? [],
    deliveryStatements: r.extractedContent?.deliveryStatements ?? [],
    extractedText: r.extractedContent?.rawText ?? null,
    extractedData: {
      extraction: r.extractedContent ?? null,
      auditSnapshot: snapshot,
    } as unknown as Prisma.InputJsonValue,
    aiAnalysis: (r.aiAnalysis ?? undefined) as unknown as Prisma.InputJsonValue | undefined,
    analysisEngine: r.analysisEngine ?? null,
    discrepancyNote: r.discrepancyNote ?? null,
    rulebookVersion: snapshot.rulebookVersion,
    rulebookReleaseId: snapshot.rulebookReleaseId,
    overallStatus: r.overallStatus,
    totalFindings: r.summary?.total ?? r.findings?.length ?? 0,
    passedCount: r.summary?.pass ?? 0,
    failedCount: r.summary?.fail ?? 0,
    needsVerificationCount: r.summary?.needsVerification ?? 0,
    status: 'COMPLETED',
  };
}

/** Map a domain Finding into Finding create data. Confidence has no column -> metadata JSON. */
export function toFindingData(
  ctx: OrganisationContext,
  finding: Finding,
  adSubmissionId: string
): Prisma.FindingUncheckedCreateInput {
  const isBaseVerification = finding.policyName === 'Product record verification';
  return {
    organisationId: ctx.organisationId,
    adSubmissionId,
    ruleId: finding.ruleId ?? null,
    ruleVersion: null,
    policyName: finding.policyName,
    status: finding.status,
    severity: finding.severity ?? 'WARNING',
    observedValue: finding.observedValue ?? null,
    expectedValue: finding.expectedValue ?? null,
    explanation: finding.explanation ?? null,
    sourceFilename: finding.sourceFilename ?? null,
    sourceLocator: finding.sourceLocator ?? null,
    sourceId: null,
    suggestedCorrection: finding.suggestedCorrection ?? null,
    evidenceExcerpt: finding.evidenceExcerpt ?? null,
    metadata: {
      confidence: finding.confidence ?? null,
      isBaseVerification,
      domainFindingId: finding.id ?? null,
    } as unknown as Prisma.InputJsonValue,
  };
}

/**
 * Reconstruct an AuditResult from a persisted submission + findings.
 * Used for idempotent replay so an identical completed submission can be
 * returned without re-running the audit.
 */
export function toAuditResult(
  submission: any,
  findings: any[],
  ctx: OrganisationContext
): AuditResult {
  const extractedData = (submission.extractedData ?? {}) as {
    extraction?: AuditResult['extractedContent'];
    auditSnapshot?: { executedRules?: { ruleId: string }[]; executionTimestamp?: string };
  };
  const snapshot = extractedData.auditSnapshot ?? {};
  const publicationDate = submission.publicationDate ? new Date(submission.publicationDate).toISOString().slice(0, 10) : undefined;

  return {
    submissionId: submission.submissionId,
    filename: submission.filename ?? '',
    overallStatus: submission.overallStatus,
    summary: {
      total: submission.totalFindings ?? findings.length,
      pass: submission.passedCount ?? 0,
      fail: submission.failedCount ?? 0,
      needsVerification: submission.needsVerificationCount ?? 0,
      notFound: 0,
      conflicting: 0,
      notApplicable: 0,
    },
    extractedContent: extractedData.extraction ?? ({} as AuditResult['extractedContent']),
    findings: findings.map((f) => ({
      id: f.id,
      ruleId: f.ruleId ?? '',
      policyName: f.policyName,
      status: f.status,
      severity: f.severity,
      observedValue: f.observedValue ?? '',
      expectedValue: f.expectedValue ?? '',
      evidenceExcerpt: f.evidenceExcerpt ?? '',
      sourceFilename: f.sourceFilename ?? '',
      sourceLocator: f.sourceLocator ?? '',
      explanation: f.explanation ?? '',
      suggestedCorrection: f.suggestedCorrection ?? '',
      confidence: (f.metadata as any)?.confidence ?? 0,
    })) as Finding[],
    executedRules: (snapshot.executedRules ?? []).map((r) => r.ruleId),
    metadata: {
      organisation: ctx.organisationName,
      publicationChannel: submission.publicationChannel ?? undefined,
      publicationDate,
      sku: submission.sku ?? undefined,
      auditTimestamp: snapshot.executionTimestamp ?? submission.createdAt?.toISOString?.() ?? new Date().toISOString(),
      rulebookVersion: submission.rulebookVersion ?? undefined,
    },
    analysisEngine: submission.analysisEngine ?? '',
    aiAnalysis: (submission.aiAnalysis ?? undefined) as AuditResult['aiAnalysis'],
    discrepancyNote: submission.discrepancyNote ?? undefined,
  } as AuditResult;
}

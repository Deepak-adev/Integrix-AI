import type { AuditResult, AuditSubmissionMetadata } from '../../types/index.js';
import type { OrganisationContext } from '../../types/index.js';
import type { AuditDataSourceMode } from '../audit-engine/audit-data-source.interface.js';

/** File-level metadata supplied alongside the audit result (no binary content). */
export interface AuditFileInfo {
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  mimeType?: string;
  /** Persistent storage reference produced by AuditFileStorage (never a temp path). */
  storagePath?: string;
}

/**
 * Immutable audit-time snapshot preserved for historical reproducibility.
 * Stored inside AdSubmission.extractedData.auditSnapshot (JSON) — no schema change.
 */
export interface AuditSnapshot {
  contentHash: string;
  dataSourceMode: AuditDataSourceMode;
  executedRules: { ruleId: string; ruleVersion: string | null }[];
  policyRulesExecuted: boolean;
  rulebookReleaseId: string | null;
  rulebookVersion: string | null;
  policySourceIds: string[];
  executionTimestamp: string;
}

export interface PersistAuditInput {
  result: AuditResult;
  metadata?: AuditSubmissionMetadata;
  file?: AuditFileInfo;
  /** Original submitted content (file bytes or raw text) used for SHA-256 hashing. */
  content: Buffer | string;
  dataSourceMode?: AuditDataSourceMode;
  /** Optional explicit rulebook release reference; validated against the organisation. */
  rulebookReleaseId?: string | null;
  rulebookVersion?: string | null;
}

export interface PersistAuditResult {
  submissionId: string;
  adSubmissionId: string;
  overallStatus: string;
  findingsCount: number;
  /** True when an existing identical submission was returned (idempotent replay). */
  idempotentReplay: boolean;
}

/**
 * Types and interfaces for storage consistency, orphan recovery, and integrity reporting.
 * Phase 2D-2B3: Storage Recovery, Consistency and Failure Resilience.
 */

export interface StorageIntegrityReport {
  organisationId: string;
  totalStoredFiles: number;
  referencedFiles: number;
  orphanedFiles: number;
  missingReferencedFiles: number;
  hashMismatches: number;
  pendingCleanupFiles: number;
  actionsPerformed: StorageRecoveryAction[];
  details: StorageIntegrityDetail[];
  timestamp: string;
}

export type StorageIssueType =
  | 'MISSING_FILE'
  | 'ORPHAN_FILE'
  | 'HASH_MISMATCH'
  | 'INCOMPLETE_OPERATION';

export interface StorageIntegrityDetail {
  type: StorageIssueType;
  submissionId?: string;
  storageId?: string;
  expectedHash?: string;
  actualHash?: string;
  description: string;
}

export interface StorageRecoveryAction {
  action: 'DELETE' | 'LOG' | 'SKIP_GRACE_PERIOD' | 'DRY_RUN_DELETE';
  storagePath: string;
  reason: string;
  timestamp: string;
}

export interface OrphanRecoveryOptions {
  /**
   * Grace period in milliseconds before an unreferenced file is considered an orphan.
   * Default: 15 minutes (900,000 ms).
   * Prevents deleting files actively being written by in-flight requests.
   */
  gracePeriodMs?: number;
  /**
   * When true, reports what would be removed without actually deleting.
   * Default: false.
   */
  dryRun?: boolean;
}

export interface ConsistencyCheckOptions {
  /**
   * Whether to calculate and verify SHA-256 hashes for referenced files.
   * Default: true.
   */
  verifyHashes?: boolean;
}

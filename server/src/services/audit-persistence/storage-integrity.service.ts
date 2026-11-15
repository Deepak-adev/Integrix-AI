import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type { PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { requireOrganisationContext } from '../organisation/tenant-context.js';
import { AuditPersistenceError } from './audit-persistence.errors.js';
import { AuditFileStorage, auditFileStorage } from './file-storage.js';
import type {
  StorageIntegrityReport,
  StorageIntegrityDetail,
  StorageRecoveryAction,
  OrphanRecoveryOptions,
  ConsistencyCheckOptions,
} from './storage-recovery.types.js';

const DEFAULT_GRACE_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

export class StorageIntegrityService {
  constructor(
    private readonly prisma: PrismaClient = getPrisma(),
    private readonly fileStorage: AuditFileStorage = auditFileStorage
  ) {}

  /**
   * Helper to compute SHA-256 hash of a file at an absolute path.
   */
  private async calculateFileHash(absPath: string): Promise<string> {
    const fileBuffer = await fs.promises.readFile(absPath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Inspect storage consistency and generate an organisation-scoped integrity report.
   *
   * Detects:
   * 1. Database submissions whose referenced file is missing.
   * 2. Stored files without corresponding database submissions (orphans).
   * 3. Files whose SHA-256 differs from the recorded hash.
   * 4. Incomplete or interrupted storage operations (e.g. .tmp, .part files).
   */
  async checkIntegrity(
    ctx: OrganisationContext,
    options: ConsistencyCheckOptions = {}
  ): Promise<StorageIntegrityReport> {
    const context = requireOrganisationContext(ctx);
    const orgId = context.organisationId;
    const verifyHashes = options.verifyHashes ?? true;

    const details: StorageIntegrityDetail[] = [];
    const actionsPerformed: StorageRecoveryAction[] = [];

    // 1. Fetch all submissions for this organisation having a storagePath
    const dbSubmissions = await this.prisma.adSubmission.findMany({
      where: { organisationId: orgId, storagePath: { not: null } },
      select: {
        id: true,
        submissionId: true,
        storagePath: true,
        extractedData: true,
      },
    });

    const dbPathMap = new Map<string, { submissionId: string; expectedHash: string | null }>();
    for (const sub of dbSubmissions) {
      if (sub.storagePath) {
        // Normalise path separators to forward slash
        const normPath = sub.storagePath.split(path.sep).join('/');
        const extracted = sub.extractedData as { auditSnapshot?: { contentHash?: string } } | null;
        const expectedHash = extracted?.auditSnapshot?.contentHash ?? null;
        dbPathMap.set(normPath, { submissionId: sub.submissionId, expectedHash });
      }
    }

    // 2. Fetch all stored files for this organisation
    const storedFiles = await this.fileStorage.listFiles(orgId);
    const storedPathSet = new Set<string>();

    let hashMismatches = 0;
    let pendingCleanupFiles = 0;

    for (const file of storedFiles) {
      const normPath = file.storagePath.split(path.sep).join('/');
      storedPathSet.add(normPath);

      // Check if file is an incomplete or interrupted operation marker
      if (file.isTempMarker) {
        pendingCleanupFiles++;
        details.push({
          type: 'INCOMPLETE_OPERATION',
          storageId: file.fileName,
          description: `Temporary or partial upload file found: ${file.fileName}`,
        });
        continue;
      }

      // Check if file is referenced in DB
      const dbEntry = dbPathMap.get(normPath);
      if (!dbEntry) {
        // Unreferenced file (potential orphan)
        // Note: grace-period check is handled in recoverOrphans or report
      } else if (verifyHashes && dbEntry.expectedHash) {
        // Verify SHA-256 hash matches
        try {
          const absPath = this.fileStorage.resolve(normPath);
          const actualHash = await this.calculateFileHash(absPath);
          if (actualHash !== dbEntry.expectedHash) {
            hashMismatches++;
            details.push({
              type: 'HASH_MISMATCH',
              submissionId: dbEntry.submissionId,
              storageId: file.fileName,
              expectedHash: dbEntry.expectedHash,
              actualHash,
              description: `SHA-256 mismatch for submission ${dbEntry.submissionId}: expected ${dbEntry.expectedHash}, got ${actualHash}`,
            });
          }
        } catch (err: any) {
          // If reading failed, record
          details.push({
            type: 'MISSING_FILE',
            submissionId: dbEntry.submissionId,
            storageId: file.fileName,
            description: `File could not be read for hash verification: ${file.fileName}`,
          });
        }
      }
    }

    // 3. Check for database records whose referenced file is missing
    let missingReferencedFiles = 0;
    for (const [subPath, entry] of dbPathMap.entries()) {
      if (!storedPathSet.has(subPath)) {
        missingReferencedFiles++;
        details.push({
          type: 'MISSING_FILE',
          submissionId: entry.submissionId,
          description: `Referenced storage file is missing: ${path.basename(subPath)} (submission ${entry.submissionId})`,
        });
      }
    }

    // 4. Count unreferenced files as orphans
    let orphanedFiles = 0;
    for (const file of storedFiles) {
      const normPath = file.storagePath.split(path.sep).join('/');
      if (!dbPathMap.has(normPath) && !file.isTempMarker) {
        orphanedFiles++;
        details.push({
          type: 'ORPHAN_FILE',
          storageId: file.fileName,
          description: `File exists without corresponding database submission: ${file.fileName}`,
        });
      }
    }

    return {
      organisationId: orgId,
      totalStoredFiles: storedFiles.length,
      referencedFiles: dbPathMap.size,
      orphanedFiles,
      missingReferencedFiles,
      hashMismatches,
      pendingCleanupFiles,
      actionsPerformed,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Conservative orphan-file recovery.
   *
   * Guarantees:
   * - Only inspects designated audit storage directory for the target organisation.
   * - Never traverses outside configured storage root.
   * - Never deletes files referenced by database records.
   * - Respects configurable grace period (default 15 mins).
   * - Supports dry-run mode.
   * - Logs every recovery action.
   * - Complete organisation isolation.
   */
  async recoverOrphans(
    ctx: OrganisationContext,
    options: OrphanRecoveryOptions = {}
  ): Promise<StorageIntegrityReport> {
    const context = requireOrganisationContext(ctx);
    const orgId = context.organisationId;
    const gracePeriodMs = options.gracePeriodMs ?? DEFAULT_GRACE_PERIOD_MS;
    const dryRun = options.dryRun ?? false;
    const now = Date.now();

    const actionsPerformed: StorageRecoveryAction[] = [];
    const details: StorageIntegrityDetail[] = [];

    // Query all valid referenced storage paths for this org
    const dbSubmissions = await this.prisma.adSubmission.findMany({
      where: { organisationId: orgId, storagePath: { not: null } },
      select: {
        id: true,
        submissionId: true,
        storagePath: true,
      },
    });

    const referencedPaths = new Set<string>();
    for (const sub of dbSubmissions) {
      if (sub.storagePath) {
        referencedPaths.add(sub.storagePath.split(path.sep).join('/'));
      }
    }

    // List all stored files
    const storedFiles = await this.fileStorage.listFiles(orgId);
    let totalStored = storedFiles.length;
    let orphanedCount = 0;
    let pendingCleanup = 0;

    for (const file of storedFiles) {
      const normPath = file.storagePath.split(path.sep).join('/');

      // Check if permanently referenced by DB
      if (referencedPaths.has(normPath)) {
        // Strictly protected: never delete!
        continue;
      }

      // If file is unreferenced or a temp marker
      const fileAgeMs = now - file.mtime.getTime();

      if (file.isTempMarker) {
        pendingCleanup++;
      } else {
        orphanedCount++;
      }

      // Check grace period
      if (fileAgeMs < gracePeriodMs) {
        actionsPerformed.push({
          action: 'SKIP_GRACE_PERIOD',
          storagePath: normPath,
          reason: `File age (${Math.round(fileAgeMs / 1000)}s) within grace period (${Math.round(gracePeriodMs / 1000)}s). Preserving.`,
          timestamp: new Date().toISOString(),
        });
        continue;
      }

      // Beyond grace period: eligible for safe cleanup
      if (dryRun) {
        actionsPerformed.push({
          action: 'DRY_RUN_DELETE',
          storagePath: normPath,
          reason: `[Dry Run] Orphan file eligible for deletion (age: ${Math.round(fileAgeMs / 1000)}s).`,
          timestamp: new Date().toISOString(),
        });
      } else {
        try {
          const deleted = await this.fileStorage.remove(normPath);
          if (deleted) {
            actionsPerformed.push({
              action: 'DELETE',
              storagePath: normPath,
              reason: `Orphan file safely deleted (age: ${Math.round(fileAgeMs / 1000)}s).`,
              timestamp: new Date().toISOString(),
            });
            // Clean up parent directory if empty
            const parentDir = path.dirname(normPath);
            await this.fileStorage.removeEmptyDir(parentDir);
          }
        } catch (err: any) {
          actionsPerformed.push({
            action: 'LOG',
            storagePath: normPath,
            reason: `Failed to remove orphan file: ${err.message}`,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return {
      organisationId: orgId,
      totalStoredFiles: totalStored,
      referencedFiles: referencedPaths.size,
      orphanedFiles: orphanedCount,
      missingReferencedFiles: 0,
      hashMismatches: 0,
      pendingCleanupFiles: pendingCleanup,
      actionsPerformed,
      details,
      timestamp: new Date().toISOString(),
    };
  }
}

export const storageIntegrityService = new StorageIntegrityService();

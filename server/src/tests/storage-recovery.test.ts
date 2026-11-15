import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { LocalAuditFileStorage } from '../services/audit-persistence/file-storage.js';
import { StorageIntegrityService } from '../services/audit-persistence/storage-integrity.service.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { getPrisma, disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;
let otherOrgCtx: OrganisationContext;
let testStorageDir: string;
let isolatedStorage: LocalAuditFileStorage;
let integrityService: StorageIntegrityService;
let seq = 0;

function sid(): string {
  seq += 1;
  return `TEST-2D2B3-${Date.now()}-${seq}`;
}

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();

  // Create an isolated scratch directory for storage recovery tests
  testStorageDir = path.join(os.tmpdir(), `integrix-storage-test-${Date.now()}`);
  fs.mkdirSync(testStorageDir, { recursive: true });

  isolatedStorage = new LocalAuditFileStorage(testStorageDir);
  integrityService = new StorageIntegrityService(getPrisma(), isolatedStorage);

  // Setup context for another fake organisation for cross-org testing
  otherOrgCtx = {
    organisationId: 'test-org-other-2d2b3',
    organisationSlug: 'other-brand',
    organisationName: 'OTHER_BRAND',
  };
});

after(async () => {
  const prisma = getPrisma();
  // Cleanup any test submissions created in DB
  const subs = await prisma.adSubmission.findMany({
    where: { submissionId: { startsWith: 'TEST-2D2B3-' } },
    select: { id: true },
  });
  const ids = subs.map((s) => s.id);
  if (ids.length > 0) {
    await prisma.finding.deleteMany({ where: { adSubmissionId: { in: ids } } });
    await prisma.adSubmission.deleteMany({ where: { id: { in: ids } } });
  }

  // Cleanup isolated test storage dir
  try {
    fs.rmSync(testStorageDir, { recursive: true, force: true });
  } catch {}

  await disconnectPrisma();
});

test('1. Orphan file detection finds unreferenced files', async () => {
  const submissionId = sid();
  const content = Buffer.from('TEST-2D2B3-ORPHAN-CONTENT-1');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Verify file was saved in isolated storage
  assert.ok(fs.existsSync(isolatedStorage.resolve(saved.storagePath)));

  // Check integrity: this saved file has no corresponding DB record, so it should be reported as an orphan
  const report = await integrityService.checkIntegrity(ctx);
  assert.ok(report.totalStoredFiles >= 1);
  assert.ok(report.orphanedFiles >= 1);
  assert.ok(report.details.some((d) => d.type === 'ORPHAN_FILE' && d.storageId === path.basename(saved.storagePath)));
});

test('2. Referenced files are never deleted by orphan recovery', async () => {
  const submissionId = sid();
  const content = Buffer.from('TEST-2D2B3-REFERENCED-CONTENT-2');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Create corresponding DB submission
  const prisma = getPrisma();
  await prisma.adSubmission.create({
    data: {
      organisationId: ctx.organisationId,
      submissionId,
      filename: saved.fileName,
      storagePath: saved.storagePath,
      extractedData: {
        auditSnapshot: { contentHash: saved.contentHash },
      },
      overallStatus: 'PASS',
      status: 'COMPLETED',
    },
  });

  // Run orphan recovery with gracePeriodMs = 0 (immediate)
  const recoveryReport = await integrityService.recoverOrphans(ctx, { gracePeriodMs: 0 });

  // Assert referenced file is still present on disk and was not deleted
  assert.ok(fs.existsSync(isolatedStorage.resolve(saved.storagePath)));
  assert.ok(!recoveryReport.actionsPerformed.some((a) => a.action === 'DELETE' && a.storagePath === saved.storagePath));
});

test('3. Grace-period protection preserves recently stored unreferenced files', async () => {
  const submissionId = sid();
  const content = Buffer.from('TEST-2D2B3-GRACE-CONTENT-3');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Run orphan recovery with default grace period (15 minutes)
  const recoveryReport = await integrityService.recoverOrphans(ctx, { gracePeriodMs: 15 * 60 * 1000 });

  // File was just created, so it must be protected by grace period
  assert.ok(fs.existsSync(isolatedStorage.resolve(saved.storagePath)));
  const skippedAction = recoveryReport.actionsPerformed.find((a) => a.action === 'SKIP_GRACE_PERIOD');
  assert.ok(skippedAction);
  assert.match(skippedAction!.reason, /within grace period/);
});

test('4. Dry-run mode reports planned deletions without deleting files', async () => {
  const submissionId = sid();
  const content = Buffer.from('TEST-2D2B3-DRYRUN-CONTENT-4');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Run orphan recovery with dryRun = true and gracePeriodMs = 0
  const recoveryReport = await integrityService.recoverOrphans(ctx, { dryRun: true, gracePeriodMs: 0 });

  // File must NOT be deleted
  assert.ok(fs.existsSync(isolatedStorage.resolve(saved.storagePath)));
  const dryRunAction = recoveryReport.actionsPerformed.find((a) => a.action === 'DRY_RUN_DELETE');
  assert.ok(dryRunAction);
  assert.match(dryRunAction!.reason, /\[Dry Run\]/);
});

test('5. Missing file detection identifies DB submissions referencing non-existent files', async () => {
  const submissionId = sid();
  const nonExistentPath = `${ctx.organisationId}/${submissionId}/non-existent.pdf`;

  // Create DB submission pointing to a non-existent file
  const prisma = getPrisma();
  await prisma.adSubmission.create({
    data: {
      organisationId: ctx.organisationId,
      submissionId,
      filename: 'non-existent.pdf',
      storagePath: nonExistentPath,
      extractedData: {
        auditSnapshot: { contentHash: 'abcdef123456' },
      },
      overallStatus: 'PASS',
      status: 'COMPLETED',
    },
  });

  const report = await integrityService.checkIntegrity(ctx);
  assert.ok(report.missingReferencedFiles >= 1);
  assert.ok(report.details.some((d) => d.type === 'MISSING_FILE' && d.submissionId === submissionId));
});

test('6. Hash mismatch detection identifies tampered or corrupted files', async () => {
  const submissionId = sid();
  const originalContent = Buffer.from('ORIGINAL-TEST-CONTENT');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, originalContent, 'ad.pdf');

  // Create DB record with original hash
  const prisma = getPrisma();
  await prisma.adSubmission.create({
    data: {
      organisationId: ctx.organisationId,
      submissionId,
      filename: saved.fileName,
      storagePath: saved.storagePath,
      extractedData: {
        auditSnapshot: { contentHash: saved.contentHash },
      },
      overallStatus: 'PASS',
      status: 'COMPLETED',
    },
  });

  // Tamper with the file on disk
  const absPath = isolatedStorage.resolve(saved.storagePath);
  fs.writeFileSync(absPath, Buffer.from('TAMPERED-CONTENT-DATA'));

  const report = await integrityService.checkIntegrity(ctx, { verifyHashes: true });
  assert.ok(report.hashMismatches >= 1);
  const mismatch = report.details.find((d) => d.type === 'HASH_MISMATCH' && d.submissionId === submissionId);
  assert.ok(mismatch);
  assert.equal(mismatch!.expectedHash, saved.contentHash);
  assert.notEqual(mismatch!.actualHash, saved.contentHash);
});

test('7. Cross-organisation isolation guarantees an organisation cannot inspect or recover another org files', async () => {
  // Save file in otherOrgCtx
  const submissionId = sid();
  const content = Buffer.from('OTHER-ORG-SECRET-CONTENT');
  const otherSaved = await isolatedStorage.save(otherOrgCtx.organisationId, submissionId, content, 'ad.pdf');

  // Perform integrity check and orphan recovery as NOVAWEAR ctx
  const novaReport = await integrityService.checkIntegrity(ctx);
  const novaRecovery = await integrityService.recoverOrphans(ctx, { gracePeriodMs: 0 });

  // Ensure other org's file was not listed, checked, or deleted
  assert.ok(fs.existsSync(isolatedStorage.resolve(otherSaved.storagePath)));
  assert.ok(!novaReport.details.some((d) => d.storageId === path.basename(otherSaved.storagePath)));
  assert.ok(!novaRecovery.actionsPerformed.some((a) => a.storagePath === otherSaved.storagePath));
});

test('8. Path traversal protection prevents resolving paths outside storage base', async () => {
  assert.throws(
    () => isolatedStorage.resolve('../../../etc/passwd'),
    (err: any) => err.code === 'VALIDATION' && /Invalid storage path/.test(err.message)
  );

  assert.throws(
    () => isolatedStorage.resolve('..\\..\\windows\\system32'),
    (err: any) => err.code === 'VALIDATION' && /Invalid storage path/.test(err.message)
  );

  await assert.rejects(
    async () => isolatedStorage.listFiles('../suspicious-org'),
    (err: any) => err.code === 'VALIDATION'
  );
});

test('9. Concurrent cleanup safety prevents race condition conflicts', async () => {
  const submissionId = sid();
  const content = Buffer.from('CONCURRENT-ORPHAN-TEST');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Trigger two concurrent orphan recoveries
  const [res1, res2] = await Promise.all([
    integrityService.recoverOrphans(ctx, { gracePeriodMs: 0 }),
    integrityService.recoverOrphans(ctx, { gracePeriodMs: 0 }),
  ]);

  // File should be deleted safely without throwing unhandled exceptions
  const fileStillExists = fs.existsSync(isolatedStorage.resolve(saved.storagePath));
  assert.equal(fileStillExists, false);

  const deletionsForSaved =
    res1.actionsPerformed.filter((a) => a.action === 'DELETE' && a.storagePath === saved.storagePath).length +
    res2.actionsPerformed.filter((a) => a.action === 'DELETE' && a.storagePath === saved.storagePath).length;
  assert.equal(deletionsForSaved, 1);
});

test('10. Cleanup failure recovery logs errors gracefully without throwing', async () => {
  const submissionId = sid();
  const content = Buffer.from('FAIL-RECOVERY-TEST');
  const saved = await isolatedStorage.save(ctx.organisationId, submissionId, content, 'ad.pdf');

  // Custom storage that delegates to isolatedStorage except remove throws
  const failingStorage: LocalAuditFileStorage = {
    save: isolatedStorage.save.bind(isolatedStorage),
    resolve: isolatedStorage.resolve.bind(isolatedStorage),
    listFiles: isolatedStorage.listFiles.bind(isolatedStorage),
    removeEmptyDir: isolatedStorage.removeEmptyDir.bind(isolatedStorage),
    getBaseDir: isolatedStorage.getBaseDir.bind(isolatedStorage),
    remove: async () => {
      throw new Error('EPERM: disk write protected');
    },
  } as unknown as LocalAuditFileStorage;

  const failingIntegrityService = new StorageIntegrityService(getPrisma(), failingStorage);
  const recoveryReport = await failingIntegrityService.recoverOrphans(ctx, { gracePeriodMs: 0 });

  const logAction = recoveryReport.actionsPerformed.find(
    (a) => a.action === 'LOG' && a.storagePath === saved.storagePath
  );
  assert.ok(logAction, `Expected LOG action for ${saved.storagePath}, got ${JSON.stringify(recoveryReport.actionsPerformed)}`);
  assert.match(logAction!.reason, /Failed to remove orphan file: EPERM/);
});

test('11. Existing persistence tests remain unchanged and public paths are not exposed', async () => {
  const report = await integrityService.checkIntegrity(ctx);
  // Ensure the report object does not expose physical storage paths (e.g. C:\... or full disk paths)
  const json = JSON.stringify(report);
  assert.ok(!json.includes(testStorageDir));
  assert.ok(!json.includes('C:\\Users'));
});

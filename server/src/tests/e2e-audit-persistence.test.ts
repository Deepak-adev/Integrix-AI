import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditController } from '../controllers/audit.controller.js';
import { auditPersistenceService } from '../services/audit-persistence/audit-persistence.service.js';
import { auditFileStorage } from '../services/audit-persistence/file-storage.js';
import { storageIntegrityService } from '../services/audit-persistence/storage-integrity.service.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { getPrisma, disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;
let otherOrgCtx: OrganisationContext;
let seq = 0;
const SAMPLE_DIR = path.join(process.cwd(), '..', 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives');

function sid(): string {
  seq += 1;
  return `TEST-2D2B4-${Date.now()}-${seq}`;
}

function mockRes(): any {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (b: any) => { res.body = b; return res; };
  return res;
}

async function withMode<T>(mode: 'file' | 'database', fn: () => Promise<T>): Promise<T> {
  const prev = process.env.AUDIT_DATA_SOURCE_MODE;
  process.env.AUDIT_DATA_SOURCE_MODE = mode;
  try { return await fn(); }
  finally {
    if (prev === undefined) delete process.env.AUDIT_DATA_SOURCE_MODE;
    else process.env.AUDIT_DATA_SOURCE_MODE = prev;
  }
}

function tempCopy(sampleName: string): string {
  const src = path.join(SAMPLE_DIR, sampleName);
  const tmp = path.join(os.tmpdir(), `integrix-e2e-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.copyFileSync(src, tmp);
  return tmp;
}

function safeUnlink(p: string): void {
  try { fs.unlinkSync(p); } catch {}
}

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
  otherOrgCtx = {
    organisationId: 'test-org-foreign-2d2b4',
    organisationSlug: 'foreign-brand',
    organisationName: 'FOREIGN_BRAND',
  };
});

after(async () => {
  const prisma = getPrisma();
  const subs = await prisma.adSubmission.findMany({
    where: { submissionId: { startsWith: 'TEST-2D2B4-' } },
    select: { id: true, storagePath: true },
  });
  const ids = subs.map((s) => s.id);
  for (const s of subs) {
    if (s.storagePath) await auditFileStorage.remove(s.storagePath).catch(() => {});
  }
  if (ids.length > 0) {
    await prisma.finding.deleteMany({ where: { adSubmissionId: { in: ids } } });
    await prisma.adSubmission.deleteMany({ where: { id: { in: ids } } });
  }
  await disconnectPrisma();
});

// ─── STEP 2: COMPLETE TEXT AUDIT END-TO-END VERIFICATION ────────────────────

test('E2E Text Audit: submission -> audit -> persistence -> snapshot -> retry -> 409 conflict', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const textContent = 'Classic Cotton Shirt (NW-CS-001) in 100% cotton at ₹1,299';
    const metadata = {
      submissionId,
      sku: 'NW-CS-001',
      publicationChannel: 'NOVAWEAR website',
      publicationDate: '2026-11-13',
    };

    // 1-7. Execute text audit via controller
    const res1 = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata }, organisation: ctx } as any, res1);

    assert.equal(res1.statusCode, 200);
    assert.equal(res1.body.persisted, true);
    assert.equal(res1.body.idempotentReplay, false);
    assert.equal(res1.body.submissionId, submissionId);
    assert.ok(res1.body.overallStatus);
    assert.ok(Array.isArray(res1.body.findings));
    // DRAFT rules are hidden in DB mode
    assert.deepEqual(res1.body.executedRules, []);

    // 8. Retrieve the completed audit from database
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.ok(sub);
    assert.equal(sub!.status, 'COMPLETED');
    assert.equal(sub!.submissionId, submissionId);
    assert.equal(sub!.organisationId, ctx.organisationId);

    // Verify snapshot
    const snapshot = (sub!.extractedData as any)?.auditSnapshot;
    assert.ok(snapshot);
    const expectedHash = crypto.createHash('sha256').update(textContent.trim()).digest('hex');
    assert.equal(snapshot.contentHash, expectedHash);
    assert.equal(snapshot.dataSourceMode, 'database');
    assert.equal(snapshot.policyRulesExecuted, false);

    // 9-10. Retry using the exact same submission ID and content
    const res2 = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata }, organisation: ctx } as any, res2);

    assert.equal(res2.statusCode, 200);
    assert.equal(res2.body.persisted, true);
    assert.equal(res2.body.idempotentReplay, true);
    assert.equal(res2.body.submissionId, submissionId);

    // Verify no duplicate submission or findings created in DB
    const subAfterRetry = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(subAfterRetry!.findings.length, sub!.findings.length);

    // Verify changed content with the same submission ID returns HTTP 409
    const resConflict = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: 'DIFFERENT CONTENT WITH SAME SUBMISSION ID', metadata }, organisation: ctx } as any,
      resConflict
    );
    assert.equal(resConflict.statusCode, 409);
    assert.match(resConflict.body.error, /conflict/i);
  });
});

// ─── STEP 3: COMPLETE FILE AUDIT END-TO-END VERIFICATION ────────────────────

test('E2E File Audit: upload -> validate -> extract -> audit -> persistent store -> snapshot -> retry -> 409 conflict', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const tmp = tempCopy('AD-NW-001.pdf');
    const originalBytes = fs.readFileSync(tmp);
    const originalHash = crypto.createHash('sha256').update(originalBytes).digest('hex');

    const req1 = {
      file: { path: tmp, mimetype: 'application/pdf', originalname: 'AD-NW-001.pdf', size: originalBytes.length },
      body: { submissionId, sku: 'NW-CS-001', publicationChannel: 'NOVAWEAR website', publicationDate: '2026-11-13' },
      organisation: ctx,
    };

    const res1 = mockRes();
    await auditController.uploadAndAudit(req1 as any, res1);

    assert.equal(res1.statusCode, 200);
    assert.equal(res1.body.persisted, true);
    assert.equal(res1.body.idempotentReplay, false);
    assert.equal(res1.body.submissionId, submissionId);
    assert.ok(res1.body.overallStatus);
    safeUnlink(tmp);

    // Database verification
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.ok(sub);
    assert.equal(sub!.status, 'COMPLETED');
    assert.ok(sub!.storagePath);
    assert.equal(sub!.filename, 'AD-NW-001.pdf');
    assert.equal(sub!.mimeType, 'application/pdf');

    // Verify snapshot
    const snapshot = (sub!.extractedData as any)?.auditSnapshot;
    assert.ok(snapshot);
    assert.equal(snapshot.contentHash, originalHash);
    assert.equal(snapshot.dataSourceMode, 'database');

    // Verify stored file bytes and SHA-256 match exactly
    const absPath = auditFileStorage.resolve(sub!.storagePath!);
    assert.ok(fs.existsSync(absPath));
    const storedBytes = fs.readFileSync(absPath);
    assert.deepEqual(storedBytes, originalBytes);
    const storedHash = crypto.createHash('sha256').update(storedBytes).digest('hex');
    assert.equal(storedHash, originalHash);

    // Retry upload with same submission ID and identical file content
    const tmpRetry = tempCopy('AD-NW-001.pdf');
    const reqRetry = {
      file: { path: tmpRetry, mimetype: 'application/pdf', originalname: 'AD-NW-001.pdf', size: originalBytes.length },
      body: { submissionId, sku: 'NW-CS-001', publicationChannel: 'NOVAWEAR website', publicationDate: '2026-11-13' },
      organisation: ctx,
    };
    const resRetry = mockRes();
    await auditController.uploadAndAudit(reqRetry as any, resRetry);

    assert.equal(resRetry.statusCode, 200);
    assert.equal(resRetry.body.persisted, true);
    assert.equal(resRetry.body.idempotentReplay, true);
    assert.equal(resRetry.body.submissionId, submissionId);
    safeUnlink(tmpRetry);

    // Verify a different file with same submission ID returns HTTP 409
    const tmpDiff = tempCopy('AD-NW-002.pdf');
    const reqDiff = {
      file: { path: tmpDiff, mimetype: 'application/pdf', originalname: 'AD-NW-002.pdf', size: fs.statSync(tmpDiff).size },
      body: { submissionId, sku: 'NW-CS-001' },
      organisation: ctx,
    };
    const resDiff = mockRes();
    await auditController.uploadAndAudit(reqDiff as any, resDiff);
    assert.equal(resDiff.statusCode, 409);
    assert.match(resDiff.body.error, /conflict/i);
    safeUnlink(tmpDiff);
  });
});

// ─── STEP 4: TENANT ISOLATION VERIFICATION ──────────────────────────────────

test('Tenant Isolation: cross-organisation access, spoofing, and storage scoping', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const textContent = 'Confidential Organisation A Advertisement Content';
    const metadata = { submissionId, sku: 'NW-CS-001' };

    // Persist as Org A (ctx)
    const resA = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata }, organisation: ctx } as any, resA);
    assert.equal(resA.statusCode, 200);

    // Org B (otherOrgCtx) attempts to read Org A's submission
    const foreignRead = await auditPersistenceService.getSubmission(otherOrgCtx, submissionId);
    assert.equal(foreignRead, null);

    // Org B attempts idempotent replay lookup on Org A's submission
    const hash = crypto.createHash('sha256').update(textContent.trim()).digest('hex');
    const foreignReplay = await auditPersistenceService.getCompletedAuditResult(otherOrgCtx, submissionId, hash);
    assert.equal(foreignReplay, null);

    // Verify client-supplied organisation ID and mode spoofing are ignored
    const spoofedReq = {
      body: {
        text: 'Spoofed body test',
        organisation: 'ATTACKER_ORG',
        organisationId: 'attacker-id-123',
        sourceMode: 'file', // attempt to bypass DB mode
        metadata: { submissionId: sid(), organisation: 'ATTACKER_ORG' },
      },
      organisation: ctx,
    };
    const resSpoofed = mockRes();
    await auditController.analyzeWithAI(spoofedReq as any, resSpoofed);
    assert.equal(resSpoofed.statusCode, 200);
    // Persisted record belongs strictly to ctx.organisationId, not ATTACKER_ORG
    const subSpoofed = await auditPersistenceService.getSubmission(ctx, spoofedReq.body.metadata.submissionId);
    assert.ok(subSpoofed);
    assert.equal(subSpoofed!.organisationId, ctx.organisationId);

    // Verify storage recovery remains strictly organisation-scoped
    const integrityReport = await storageIntegrityService.checkIntegrity(otherOrgCtx);
    assert.equal(integrityReport.organisationId, otherOrgCtx.organisationId);
    assert.equal(integrityReport.referencedFiles, 0);
  });
});

// ─── STEP 6: AUDIT SNAPSHOT HISTORICAL IMMUTABILITY ─────────────────────────

test('Audit Snapshot Immutability: preserves all required execution context fields', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const textContent = 'Snapshot verification sample content for immutability testing';
    const metadata = {
      submissionId,
      sku: 'NW-CS-001',
      publicationChannel: 'Instagram Shop',
      publicationDate: '2026-11-13',
    };

    const res = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata }, organisation: ctx } as any, res);
    assert.equal(res.statusCode, 200);

    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.ok(sub);

    // All required historical snapshot fields
    assert.equal(sub!.submissionId, submissionId);
    assert.equal(sub!.organisationId, ctx.organisationId);
    assert.ok(sub!.overallStatus);
    assert.ok(sub!.createdAt instanceof Date);

    const snapshot = (sub!.extractedData as any)?.auditSnapshot;
    assert.ok(snapshot);
    assert.ok(snapshot.contentHash);
    assert.ok(snapshot.executionTimestamp);
    assert.equal(snapshot.dataSourceMode, 'database');
    assert.equal(typeof snapshot.policyRulesExecuted, 'boolean');
    assert.ok(Array.isArray(snapshot.executedRules));
    assert.ok(Array.isArray(snapshot.policySourceIds));

    // Findings and evidence preserved
    assert.ok(sub!.findings.length > 0);
    for (const f of sub!.findings) {
      assert.ok(f.policyName);
      assert.ok(f.status);
      assert.ok(f.severity);
      assert.ok(f.adSubmissionId === sub!.id);
      assert.ok(f.organisationId === ctx.organisationId);
    }
  });
});

// ─── STEP 7: API RESPONSE CONTRACT VERIFICATION ─────────────────────────────

test('API Response Contract: preserves fields, flags, and prevents information leakage', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const textContent = 'API Contract verification sample content';
    const metadata = { submissionId, sku: 'NW-CS-001' };

    const res = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata }, organisation: ctx } as any, res);

    assert.equal(res.statusCode, 200);
    const body = res.body;

    // Preserves existing standard fields
    assert.ok('submissionId' in body);
    assert.ok('overallStatus' in body);
    assert.ok('findings' in body);
    assert.ok('summary' in body);
    assert.ok('persisted' in body);
    assert.ok('idempotentReplay' in body);

    // Flags are strictly typed boolean
    assert.equal(typeof body.persisted, 'boolean');
    assert.equal(typeof body.idempotentReplay, 'boolean');

    // Never leaks internal filesystem paths or DB connection details
    const serialized = JSON.stringify(body);
    assert.ok(!serialized.includes(process.cwd()));
    assert.ok(!serialized.includes('postgresql://'));
    assert.ok(!serialized.includes('DATABASE_URL'));
    assert.ok(!serialized.includes('storage/audits'));
  });
});

// ─── STEP 7B: FILE MODE COMPATIBILITY VERIFICATION ──────────────────────────

test('File Mode Compatibility: preserves standard execution without persistence side-effects', async () => {
  await withMode('file', async () => {
    const submissionId = sid();
    const textContent = 'File mode compatibility test content';
    const metadata = { submissionId, sku: 'NW-CS-001' };

    const res = mockRes();
    await auditController.analyzeWithAI({ body: { text: textContent, metadata } } as any, res);

    assert.equal(res.statusCode, 200);
    // In file mode, persisted is undefined or false (no DB write)
    assert.ok(!res.body.persisted);

    // Verify nothing was written to PostgreSQL
    const prisma = getPrisma();
    const count = await prisma.adSubmission.count({
      where: { submissionId },
    });
    assert.equal(count, 0);
  });
});

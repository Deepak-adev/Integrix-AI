import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditController } from '../controllers/audit.controller.js';
import { auditPersistenceService } from '../services/audit-persistence/audit-persistence.service.js';
import { auditFileStorage } from '../services/audit-persistence/file-storage.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { getPrisma, disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;
let seq = 0;
const SAMPLE_DIR = path.join(process.cwd(), '..', 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives');

function sid(): string {
  seq += 1;
  return `TEST-2D2B2-${Date.now()}-${seq}`;
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

function safeUnlink(p: string): void {
  try { fs.unlinkSync(p); } catch { /* already cleaned up */ }
}

function tempCopy(sampleName: string): string {
  const src = path.join(SAMPLE_DIR, sampleName);
  const tmp = path.join(os.tmpdir(), `integrix-up-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`);
  fs.copyFileSync(src, tmp);
  return tmp;
}

function reqFor(tmp: string, submissionId: string, extra: any = {}): any {
  return {
    file: { path: tmp, mimetype: 'application/pdf', originalname: 'AD-NW-001.pdf', size: fs.statSync(tmp).size },
    body: { submissionId, sku: 'NW-CS-001', publicationChannel: 'NOVAWEAR website', publicationDate: '2026-11-13', ...extra },
    organisation: ctx,
  };
}

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
});

after(async () => {
  const prisma = getPrisma();
  const subs = await prisma.adSubmission.findMany({
    where: { submissionId: { startsWith: 'TEST-2D2B2-' } },
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

test('database-mode upload persists creative, findings and snapshot', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const tmp = tempCopy('AD-NW-001.pdf');
    const original = fs.readFileSync(tmp);
    const res = mockRes();
    await auditController.uploadAndAudit(reqFor(tmp, submissionId), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, true);
    assert.equal(res.body.idempotentReplay, false);
    assert.equal(res.body.submissionId, submissionId);

    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.ok(sub);
    assert.equal(sub!.status, 'COMPLETED');
    assert.ok(sub!.storagePath);
    assert.equal(sub!.filename, 'AD-NW-001.pdf');
    assert.equal(sub!.mimeType, 'application/pdf');
    assert.equal(sub!.findings.length, 1);
    const snapshot = (sub!.extractedData as any).auditSnapshot;
    assert.equal(snapshot.contentHash, crypto.createHash('sha256').update(original).digest('hex'));
    assert.equal(snapshot.policyRulesExecuted, false);
    assert.deepEqual(snapshot.executedRules, []);

    // Original bytes preserved exactly in persistent storage.
    const abs = auditFileStorage.resolve(sub!.storagePath!);
    assert.ok(abs.startsWith(path.resolve(path.join(process.cwd(), 'storage', 'audits'))));
    assert.deepEqual(fs.readFileSync(abs), original);
    safeUnlink(tmp);
  });
});

test('same-ID same-file retry replays without overwriting creative', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const tmp = tempCopy('AD-NW-001.pdf');
    const r1 = mockRes();
    await auditController.uploadAndAudit(reqFor(tmp, submissionId), r1);
    assert.equal(r1.body.idempotentReplay, false);
    const firstPath = (await auditPersistenceService.getSubmission(ctx, submissionId))!.storagePath;
    safeUnlink(tmp);

    // Retry with a fresh temp copy (the controller cleans up each upload's temp file).
    const tmp2 = tempCopy('AD-NW-001.pdf');
    const r2 = mockRes();
    await auditController.uploadAndAudit(reqFor(tmp2, submissionId), r2);
    assert.equal(r2.statusCode, 200);
    assert.equal(r2.body.persisted, true);
    assert.equal(r2.body.idempotentReplay, true);
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.storagePath, firstPath);
    assert.equal(sub!.findings.length, 1);
    safeUnlink(tmp2);
  });
});

test('same-ID different-file upload returns 409', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const t1 = tempCopy('AD-NW-001.pdf');
    const r1 = mockRes();
    await auditController.uploadAndAudit(reqFor(t1, submissionId), r1);
    assert.equal(r1.statusCode, 200);
    safeUnlink(t1);

    const t2 = tempCopy('AD-NW-002.pdf');
    const r2 = mockRes();
    await auditController.uploadAndAudit(reqFor(t2, submissionId), r2);
    assert.equal(r2.statusCode, 409);
    safeUnlink(t2);
  });
});

test('concurrent identical uploads do not duplicate submissions or findings', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    // Each concurrent upload has its own temp file (as in real multer uploads).
    const tmpA = tempCopy('AD-NW-001.pdf');
    const tmpB = tempCopy('AD-NW-001.pdf');
    const [r1, r2] = await Promise.all([
      (async () => { const res = mockRes(); await auditController.uploadAndAudit(reqFor(tmpA, submissionId), res); return res; })(),
      (async () => { const res = mockRes(); await auditController.uploadAndAudit(reqFor(tmpB, submissionId), res); return res; })(),
    ]);
    assert.equal(r1.statusCode, 200);
    assert.equal(r2.statusCode, 200);
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.findings.length, 1);
    safeUnlink(tmpA);
    safeUnlink(tmpB);
  });
});

test('storage failure returns 500 and creates no submission', async () => {
  await withMode('database', async () => {
    const original = auditFileStorage.save;
    (auditFileStorage as any).save = async () => { throw new Error('disk full'); };
    try {
      const submissionId = sid();
      const tmp = tempCopy('AD-NW-001.pdf');
      const res = mockRes();
      await auditController.uploadAndAudit(reqFor(tmp, submissionId), res);
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.persisted, undefined);
      assert.equal(await auditPersistenceService.getSubmission(ctx, submissionId), null);
      safeUnlink(tmp);
    } finally {
      (auditFileStorage as any).save = original;
    }
  });
});

test('database failure after storage removes the unreferenced creative', async () => {
  await withMode('database', async () => {
    const original = auditPersistenceService.persistAudit;
    (auditPersistenceService as any).persistAudit = async () => { throw new Error('db down'); };
    try {
      const submissionId = sid();
      const tmp = tempCopy('AD-NW-001.pdf');
      const res = mockRes();
      await auditController.uploadAndAudit(reqFor(tmp, submissionId), res);
      assert.equal(res.statusCode, 500);
      assert.equal(await auditPersistenceService.getSubmission(ctx, submissionId), null);
      // The stored creative directory for this submission must be empty/removed.
      const dir = path.join(process.cwd(), 'storage', 'audits', ctx.organisationId, submissionId);
      const exists = fs.existsSync(dir) ? fs.readdirSync(dir).length : 0;
      assert.equal(exists, 0, 'unreferenced creative should be removed');
      safeUnlink(tmp);
    } finally {
      (auditPersistenceService as any).persistAudit = original;
    }
  });
});

test('audit execution failure returns 500 and cleans temp file', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const tmp = tempCopy('AD-NW-001.pdf');
    const res = mockRes();
    const req = reqFor(tmp, submissionId);
    req.file.path = path.join(os.tmpdir(), 'does-not-exist.pdf'); // force extraction failure
    await auditController.uploadAndAudit(req, res);
    assert.equal(res.statusCode, 500);
    assert.equal(await auditPersistenceService.getSubmission(ctx, submissionId), null);
    safeUnlink(tmp);
  });
});

test('frontend organisation and source-mode spoofing is ignored', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const tmp = tempCopy('AD-NW-001.pdf');
    const res = mockRes();
    const req = reqFor(tmp, submissionId, { organisation: 'SPOOFED-ORG', dataSourceMode: 'file', mode: 'file' });
    await auditController.uploadAndAudit(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, true);
    assert.equal(res.body.metadata.organisation, ctx.organisationName);
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.organisationId, ctx.organisationId);
    safeUnlink(tmp);
  });
});

test('file-mode upload remains unchanged (no persistence)', async () => {
  await withMode('file', async () => {
    const tmp = tempCopy('AD-NW-001.pdf');
    const res = mockRes();
    await auditController.uploadAndAudit(reqFor(tmp, sid()), res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, undefined);
    safeUnlink(tmp);
  });
});

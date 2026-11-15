import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { auditController } from '../controllers/audit.controller.js';
import { auditPersistenceService } from '../services/audit-persistence/audit-persistence.service.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { getPrisma, disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;
let seq = 0;

const TEXT = 'NOVAWEAR\nTHE CLASSIC COTTON SHIRT\nAn easy everyday layer in 100% cotton. Regular fit.\n₹1,299\nNOVAWEAR | NW-CS-001';

function sid(): string {
  seq += 1;
  return `TEST-2D2B1-${Date.now()}-${seq}`;
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

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
});

after(async () => {
  const prisma = getPrisma();
  const subs = await prisma.adSubmission.findMany({ where: { submissionId: { startsWith: 'TEST-2D2B1-' } }, select: { id: true } });
  const ids = subs.map((s) => s.id);
  if (ids.length > 0) {
    await prisma.finding.deleteMany({ where: { adSubmissionId: { in: ids } } });
    await prisma.adSubmission.deleteMany({ where: { id: { in: ids } } });
  }
  await disconnectPrisma();
});

test('database-mode text audit is persisted with snapshot', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const res = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: TEXT, metadata: { submissionId, sku: 'NW-CS-001' } }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, true);
    assert.equal(res.body.idempotentReplay, false);
    assert.equal(res.body.submissionId, submissionId);
    assert.equal(res.body.providerStatus.mode, 'deterministic_only');
    assert.deepEqual(res.body.executedRules, []);

    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.ok(sub);
    assert.equal(sub!.status, 'COMPLETED');
    assert.equal(sub!.findings.length, 1);
    const snapshot = (sub!.extractedData as any).auditSnapshot;
    assert.equal(snapshot.contentHash, crypto.createHash('sha256').update(TEXT.trim()).digest('hex'));
    assert.equal(snapshot.policyRulesExecuted, false);
    assert.equal(snapshot.dataSourceMode, 'database');
  });
});

test('identical retry returns existing audit without duplicate findings', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const req = () => ({ body: { text: TEXT, metadata: { submissionId, sku: 'NW-CS-001' } }, organisation: ctx } as any);
    const r1 = mockRes();
    await auditController.analyzeWithAI(req(), r1);
    assert.equal(r1.body.idempotentReplay, false);

    const r2 = mockRes();
    await auditController.analyzeWithAI(req(), r2);
    assert.equal(r2.statusCode, 200);
    assert.equal(r2.body.persisted, true);
    assert.equal(r2.body.idempotentReplay, true);
    assert.equal(r2.body.findings.length, 1);

    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.findings.length, 1);
  });
});

test('same submission ID with different content returns 409', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const r1 = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: TEXT, metadata: { submissionId } }, organisation: ctx } as any,
      r1
    );
    assert.equal(r1.statusCode, 200);

    const r2 = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: TEXT + '\nDifferent content', metadata: { submissionId } }, organisation: ctx } as any,
      r2
    );
    assert.equal(r2.statusCode, 409);
  });
});

test('concurrent identical requests do not duplicate submissions', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const req = () => ({ body: { text: TEXT, metadata: { submissionId, sku: 'NW-CS-001' } }, organisation: ctx } as any);
    const [r1, r2] = await Promise.all([
      (async () => { const res = mockRes(); await auditController.analyzeWithAI(req(), res); return res; })(),
      (async () => { const res = mockRes(); await auditController.analyzeWithAI(req(), res); return res; })(),
    ]);
    assert.equal(r1.statusCode, 200);
    assert.equal(r2.statusCode, 200);
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.findings.length, 1);
  });
});

test('persistence failure returns 500 without misleading success', async () => {
  await withMode('database', async () => {
    const original = auditPersistenceService.persistAudit;
    (auditPersistenceService as any).persistAudit = async () => { throw new Error('db down'); };
    try {
      const res = mockRes();
      await auditController.analyzeWithAI(
        { body: { text: TEXT, metadata: { submissionId: sid() } }, organisation: ctx } as any,
        res
      );
      assert.equal(res.statusCode, 500);
      assert.equal(res.body.persisted, undefined);
    } finally {
      (auditPersistenceService as any).persistAudit = original;
    }
  });
});

test('frontend organisation and source-mode spoofing is ignored', async () => {
  await withMode('database', async () => {
    const submissionId = sid();
    const res = mockRes();
    await auditController.analyzeWithAI(
      {
        body: {
          text: TEXT,
          metadata: { submissionId, sku: 'NW-CS-001' },
          organisation: 'SPOOFED-ORG',
          dataSourceMode: 'file',
          mode: 'file',
        },
        organisation: ctx,
      } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, true);
    assert.equal(res.body.metadata.organisation, ctx.organisationName);
    const sub = await auditPersistenceService.getSubmission(ctx, submissionId);
    assert.equal(sub!.organisationId, ctx.organisationId);
  });
});

test('file-mode analyze remains unchanged (no persistence)', async () => {
  await withMode('file', async () => {
    const res = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: TEXT, metadata: { sku: 'NW-CS-001' } }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.persisted, undefined);
    assert.equal(res.body.providerStatus.mode, 'deterministic_only');
    assert.equal(res.body.executedRules.length, 4);
  });
});

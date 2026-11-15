import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AuditPersistenceService } from '../services/audit-persistence/audit-persistence.service.js';
import { LocalAuditFileStorage } from '../services/audit-persistence/file-storage.js';
import { AuditPersistenceError } from '../services/audit-persistence/audit-persistence.errors.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { getPrisma, disconnectPrisma } from '../lib/prisma.js';
import type { AuditResult, Finding, OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;
const service = new AuditPersistenceService();
let seq = 0;
const createdSubmissionIds: string[] = [];

function sid(): string {
  seq += 1;
  const id = `TEST-2D2A-${Date.now()}-${seq}`;
  createdSubmissionIds.push(id);
  return id;
}

function finding(overrides: Partial<Finding> = {}): Finding {
  return {
    id: `F-${Math.random().toString(36).slice(2)}`,
    ruleId: 'NW-RULE-002', policyName: 'Campaign price validity', status: 'FAIL', severity: 'RED',
    observedValue: '₹1,399', expectedValue: 'Approved', evidenceExcerpt: 'excerpt',
    sourceFilename: 'catalogue.xlsx', sourceLocator: 'row 1', explanation: 'why', suggestedCorrection: 'fix', confidence: 0.9,
    ...overrides,
  } as Finding;
}

function auditResult(submissionId: string, overrides: Partial<AuditResult> = {}): AuditResult {
  return {
    submissionId, filename: 'ad.pdf', overallStatus: 'FAIL',
    summary: { total: 2, pass: 0, fail: 2, needsVerification: 0, notFound: 0, conflicting: 0, notApplicable: 0 },
    extractedContent: {
      detectedProducts: [], detectedSku: 'NW-CS-001', detectedPrice: 1299, advertisedPriceFormatted: '₹1,299',
      detectedComposition: '100% cotton', detectedFit: 'Regular fit', performanceClaims: [], deliveryStatements: [],
      campaignReferences: [], brandTerms: [], confidence: 0.95, rawText: 'ad text', extractionMethod: 'PDF_TEXT',
    } as any,
    findings: [finding(), finding({ id: 'F-2', policyName: 'Product record verification', ruleId: 'NW-RULE-001', status: 'PASS', severity: 'GREEN' })],
    executedRules: [],
    metadata: { organisation: 'NOVAWEAR', publicationChannel: 'website', publicationDate: '2026-11-13', sku: 'NW-CS-001', auditTimestamp: new Date().toISOString(), rulebookVersion: '0.1' },
    analysisEngine: 'Integrix AI Deterministic Policy Engine',
    ...overrides,
  } as AuditResult;
}

function inputFor(result: AuditResult, content: string | Buffer = 'original-content') {
  return { result, content, dataSourceMode: 'database' as const };
}

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
});

after(async () => {
  const prisma = getPrisma();
  const subs = await prisma.adSubmission.findMany({ where: { submissionId: { startsWith: 'TEST-2D2A-' } }, select: { id: true } });
  const ids = subs.map((s) => s.id);
  if (ids.length > 0) {
    await prisma.finding.deleteMany({ where: { adSubmissionId: { in: ids } } });
    await prisma.adSubmission.deleteMany({ where: { id: { in: ids } } });
  }
  await disconnectPrisma();
});

test('successful audit submission persistence', async () => {
  const id = sid();
  const res = await service.persistAudit(ctx, inputFor(auditResult(id)));
  assert.equal(res.submissionId, id);
  assert.ok(res.adSubmissionId);
  assert.equal(res.overallStatus, 'FAIL');
  assert.equal(res.findingsCount, 2);
  assert.equal(res.idempotentReplay, false);
});

test('multiple findings persisted with fields preserved', async () => {
  const id = sid();
  await service.persistAudit(ctx, inputFor(auditResult(id)));
  const sub = await service.getSubmission(ctx, id);
  assert.ok(sub);
  assert.equal(sub!.findings.length, 2);
  const f = sub!.findings.find((x) => x.policyName === 'Campaign price validity')!;
  assert.equal(f.status, 'FAIL');
  assert.equal(f.severity, 'RED');
  assert.equal(f.observedValue, '₹1,399');
  assert.equal(f.evidenceExcerpt, 'excerpt');
  assert.equal((f.metadata as any).confidence, 0.9);
});

test('base-verification-only audit preserves zero-executed-rules fact', async () => {
  const id = sid();
  const result = auditResult(id, { findings: [finding({ policyName: 'Product record verification', ruleId: 'NW-RULE-001', status: 'PASS' })], summary: { total: 1, pass: 1, fail: 0, needsVerification: 0, notFound: 0, conflicting: 0, notApplicable: 0 } });
  await service.persistAudit(ctx, inputFor(result));
  const sub = await service.getSubmission(ctx, id);
  const snapshot = (sub!.extractedData as any).auditSnapshot;
  assert.equal(snapshot.policyRulesExecuted, false);
  assert.deepEqual(snapshot.executedRules, []);
  assert.equal(sub!.findings[0].metadata && (sub!.findings[0].metadata as any).isBaseVerification, true);
});

test('executed-rule snapshot preserves rule IDs', async () => {
  const id = sid();
  const result = auditResult(id, { executedRules: ['NW-RULE-001', 'NW-RULE-002'] });
  await service.persistAudit(ctx, inputFor(result));
  const sub = await service.getSubmission(ctx, id);
  const snapshot = (sub!.extractedData as any).auditSnapshot;
  assert.equal(snapshot.policyRulesExecuted, true);
  assert.deepEqual(snapshot.executedRules.map((r: any) => r.ruleId), ['NW-RULE-001', 'NW-RULE-002']);
});

test('rulebook version is preserved; release reference validated', async () => {
  const id = sid();
  await service.persistAudit(ctx, inputFor(auditResult(id)));
  const sub = await service.getSubmission(ctx, id);
  assert.equal(sub!.rulebookVersion, '0.1');
  assert.equal(sub!.rulebookReleaseId, null);
  await assert.rejects(
    () => service.persistAudit(ctx, { ...inputFor(auditResult(sid())), rulebookReleaseId: 'nonexistent-release-id' }),
    (err) => err instanceof AuditPersistenceError && err.code === 'RELEASE_NOT_FOUND'
  );
});

test('content SHA-256 hash is stored in the audit snapshot', async () => {
  const id = sid();
  const content = 'unique-content-for-hash';
  await service.persistAudit(ctx, inputFor(auditResult(id), content));
  const sub = await service.getSubmission(ctx, id);
  const expected = crypto.createHash('sha256').update(content).digest('hex');
  assert.equal((sub!.extractedData as any).auditSnapshot.contentHash, expected);
});

test('idempotent duplicate submission returns existing record', async () => {
  const id = sid();
  const input = inputFor(auditResult(id));
  const first = await service.persistAudit(ctx, input);
  const second = await service.persistAudit(ctx, input);
  assert.equal(second.idempotentReplay, true);
  assert.equal(second.adSubmissionId, first.adSubmissionId);
  const sub = await service.getSubmission(ctx, id);
  assert.equal(sub!.findings.length, 2);
});

test('same submission ID with different content conflicts', async () => {
  const id = sid();
  await service.persistAudit(ctx, inputFor(auditResult(id), 'content-A'));
  await assert.rejects(
    () => service.persistAudit(ctx, inputFor(auditResult(id), 'content-B')),
    (err) => err instanceof AuditPersistenceError && err.code === 'SUBMISSION_CONFLICT'
  );
});

test('concurrent duplicate submissions do not duplicate findings', async () => {
  const id = sid();
  const input = inputFor(auditResult(id));
  const results = await Promise.allSettled([service.persistAudit(ctx, input), service.persistAudit(ctx, input)]);
  assert.ok(results.every((r) => r.status === 'fulfilled'));
  const sub = await service.getSubmission(ctx, id);
  assert.equal(sub!.findings.length, 2);
  const fulfilled = results.filter((r) => r.status === 'fulfilled').map((r: any) => r.value);
  assert.ok(fulfilled.some((r) => r.idempotentReplay === true) || fulfilled.length === 2);
});

test('missing organisation context is rejected', async () => {
  await assert.rejects(() => service.persistAudit(null as any, inputFor(auditResult(sid()))));
});

test('cross-organisation reads are isolated', async () => {
  const id = sid();
  await service.persistAudit(ctx, inputFor(auditResult(id)));
  const forged: OrganisationContext = { organisationId: 'other-org-id', organisationSlug: 'other', organisationName: 'Other' };
  const sub = await service.getSubmission(forged, id);
  assert.equal(sub, null);
});

test('transaction rollback: no COMPLETED submission when a finding is invalid', async () => {
  const id = sid();
  const badFinding = { ...finding(), policyName: undefined } as any;
  const result = auditResult(id, { findings: [badFinding] });
  await assert.rejects(() => service.persistAudit(ctx, inputFor(result)));
  const sub = await service.getSubmission(ctx, id);
  assert.equal(sub, null);
});

test('persistent file storage is path-safe and hash-consistent', async () => {
  const baseDir = path.join(os.tmpdir(), `integrix-storage-${Date.now()}`);
  const storage = new LocalAuditFileStorage(baseDir);
  const content = Buffer.from('pdf-bytes');
  const stored = await storage.save(ctx.organisationId, 'SUB-1', content, 'ad.pdf');
  assert.ok(stored.storagePath.includes(ctx.organisationId));
  assert.equal(stored.contentHash, crypto.createHash('sha256').update(content).digest('hex'));
  const abs = storage.resolve(stored.storagePath);
  assert.ok(abs.startsWith(path.resolve(baseDir)));
  assert.deepEqual(fs.readFileSync(abs), content);
  assert.throws(() => storage.resolve('../escape.txt'));
  await assert.rejects(() => storage.save(ctx.organisationId, 'SUB-2', content, 'evil.exe'));
  fs.rmSync(baseDir, { recursive: true, force: true });
});

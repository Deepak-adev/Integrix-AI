import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { auditController } from '../controllers/audit.controller.js';
import { createAuditEngine } from '../services/audit-engine/audit-engine-factory.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
});

after(async () => {
  await disconnectPrisma();
});

function mockRes(): any {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (b: any) => { res.body = b; return res; };
  return res;
}

async function withMode<T>(mode: 'file' | 'database', fn: () => Promise<T>): Promise<T> {
  const prev = process.env.AUDIT_DATA_SOURCE_MODE;
  process.env.AUDIT_DATA_SOURCE_MODE = mode;
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.AUDIT_DATA_SOURCE_MODE;
    else process.env.AUDIT_DATA_SOURCE_MODE = prev;
  }
}

const COMPLIANT_TEXT =
  'NOVAWEAR\nTHE CLASSIC COTTON SHIRT\nAn easy everyday layer in 100% cotton. Regular fit. Made for repeat wear.\n₹1,299\nNOVAWEAR | NW-CS-001 | Regular fit';

const PENDING_CAMPAIGN_TEXT =
  'NOVAWEAR\nTHE EVERYDAY CHINO\nPremium cotton chino for work and weekends.\n₹1,399\nCMP-26-021\nNOVAWEAR | NW-TR-005';

test('database-mode text audit uses DB data and does not execute DRAFT rules', async () => {
  await withMode('database', async () => {
    const res = mockRes();
    await auditController.auditRawText(
      { body: { text: COMPLIANT_TEXT, metadata: { sku: 'NW-CS-001' } }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    const result = res.body;
    // No rule-evaluator findings: NOVAWEAR rules are DRAFT (zero executable rules).
    const ruleFindingNames = ['SKU fabric composition match', 'Campaign price validity', 'Unsupported performance claim', 'Delivery estimate not stated as guarantee'];
    for (const f of result.findings) {
      assert.ok(!ruleFindingNames.includes(f.policyName), `unexpected rule finding in DB mode: ${f.policyName}`);
    }
    // Only the base product-record verification finding is produced.
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].policyName, 'Product record verification');
    assert.equal(result.findings[0].status, 'PASS');
    // Transparent: zero executable rules ran.
    assert.deepEqual(result.executedRules, []);
  });
});

test('frontend organisation and source-mode spoofing is ignored in database mode', async () => {
  await withMode('database', async () => {
    const res = mockRes();
    await auditController.auditRawText(
      {
        body: {
          text: COMPLIANT_TEXT,
          metadata: { sku: 'NW-CS-001' },
          organisation: 'SPOOFED-ORG',
          dataSourceMode: 'file',
          mode: 'file',
          source: 'file',
        },
        organisation: ctx,
      } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    const result = res.body;
    // Still database mode: no rule findings, and organisation label comes from trusted context.
    assert.equal(result.findings.length, 1);
    assert.equal(result.findings[0].policyName, 'Product record verification');
    assert.equal(result.metadata.organisation, ctx.organisationName);
    assert.notEqual(result.metadata.organisation, 'SPOOFED-ORG');
    assert.deepEqual(result.executedRules, []);
  });
});

test('file-mode text audit remains backward compatible', async () => {
  await withMode('file', async () => {
    const res = mockRes();
    await auditController.auditRawText(
      { body: { text: PENDING_CAMPAIGN_TEXT, metadata: {} }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    const result = res.body;
    const rule002 = result.findings.find((f: any) => f.ruleId === 'NW-RULE-002');
    assert.ok(rule002, 'expected NW-RULE-002 finding in file mode');
    assert.equal(rule002.status, 'FAIL');
    assert.ok(result.executedRules.includes('NW-RULE-002'));
  });
});

test('database mode fails closed when organisation context is missing', async () => {
  await withMode('database', async () => {
    const res = mockRes();
    await auditController.auditRawText(
      { body: { text: COMPLIANT_TEXT, metadata: {} } } as any, // no req.organisation
      res
    );
    assert.equal(res.statusCode, 500);
    assert.ok(res.body.error);
  });
});

test('concurrent database-mode requests get isolated engines', async () => {
  await withMode('database', async () => {
    const [e1, e2] = await Promise.all([
      createAuditEngine({ mode: 'database', context: ctx }),
      createAuditEngine({ mode: 'database', context: ctx }),
    ]);
    assert.notEqual(e1.dataSource, e2.dataSource);
    assert.equal(e1.dataSource.getAllProducts().length, 8);
    assert.equal(e2.dataSource.getAllProducts().length, 8);
    assert.equal(e1.dataSource.getAllRules().length, 0);
    assert.equal(e2.dataSource.getAllRules().length, 0);
  });
});

test('temporary upload file is cleaned up after file-mode audit', async () => {
  await withMode('file', async () => {
    const tmp = path.join(os.tmpdir(), `integrix-test-${Date.now()}.txt`);
    fs.writeFileSync(tmp, COMPLIANT_TEXT);
    const res = mockRes();
    const req: any = {
      file: { path: tmp, mimetype: 'text/plain', originalname: 'ad.txt', size: fs.statSync(tmp).size },
      body: { sku: 'NW-CS-001' },
      organisation: ctx,
    };
    await auditController.uploadAndAudit(req, res);
    assert.equal(res.statusCode, 200);
    // cleanupTempFile is async; give it a moment.
    await new Promise((r) => setTimeout(r, 100));
    assert.equal(fs.existsSync(tmp), false, 'temporary upload should be deleted');
  });
});

test('AI provider disabled returns deterministic-only status', async () => {
  await withMode('file', async () => {
    const res = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: COMPLIANT_TEXT, metadata: { sku: 'NW-CS-001' } }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.providerStatus.auditAvailable, false);
    assert.equal(res.body.providerStatus.mode, 'deterministic_only');
    assert.equal(res.body.executedRules.length, 4);
  });
});

test('file-only endpoints are isolated in database mode', async () => {
  await withMode('database', async () => {
    const statsRes = mockRes();
    await auditController.getRepositoryStats({ organisation: ctx } as any, statsRes);
    assert.equal(statsRes.statusCode, 501);

    const scenarioRes = mockRes();
    await auditController.runScenario({ params: { id: 'SCENARIO-1' }, organisation: ctx } as any, scenarioRes);
    assert.equal(scenarioRes.statusCode, 501);

    const allRes = mockRes();
    await auditController.runAllScenarios({ organisation: ctx } as any, allRes);
    assert.equal(allRes.statusCode, 501);
  });
});

// ─── Phase 2C-3D end-to-end verification ─────────────────────────────────────

test('Test A: database-mode analyze identifies deterministic-only operation', async () => {
  await withMode('database', async () => {
    const res = mockRes();
    await auditController.analyzeWithAI(
      { body: { text: COMPLIANT_TEXT, metadata: { sku: 'NW-CS-001' } }, organisation: ctx } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.providerStatus.auditAvailable, false);
    assert.equal(res.body.providerStatus.mode, 'deterministic_only');
    assert.deepEqual(res.body.executedRules, []);
    assert.equal(res.body.findings.length, 1);
    assert.equal(res.body.findings[0].policyName, 'Product record verification');
    assert.equal(res.body.metadata.organisation, ctx.organisationName);
  });
});

test('Test B: database-mode file upload audit uses DB source and cleans up', async () => {
  await withMode('database', async () => {
    const sample = path.join(process.cwd(), '..', 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives', 'AD-NW-001.pdf');
    assert.ok(fs.existsSync(sample), 'sample creative must exist');
    const tmp = path.join(os.tmpdir(), `integrix-e2e-${Date.now()}.pdf`);
    fs.copyFileSync(sample, tmp);

    const res = mockRes();
    const req: any = {
      file: { path: tmp, mimetype: 'application/pdf', originalname: 'AD-NW-001.pdf', size: fs.statSync(tmp).size },
      body: { sku: 'NW-CS-001', publicationChannel: 'NOVAWEAR website', publicationDate: '2026-11-13' },
      organisation: ctx,
    };
    await auditController.uploadAndAudit(req, res);
    assert.equal(res.statusCode, 200);
    const result = res.body;
    // DB-backed extraction identified the SKU; zero executable rules ran.
    assert.equal(result.extractedContent.detectedSku, 'NW-CS-001');
    assert.deepEqual(result.executedRules, []);
    assert.ok(result.findings.every((f: any) => f.policyName === 'Product record verification'));
    assert.equal(result.metadata.organisation, ctx.organisationName);

    await new Promise((r) => setTimeout(r, 100));
    assert.equal(fs.existsSync(tmp), false, 'temporary upload should be deleted');
  });
});

test('Test C: product mismatch is not silently substituted (DB mode limitation documented)', async () => {
  await withMode('database', async () => {
    // NW-CS-001 is 100% cotton in the DB; the ad claims polyester.
    // Because NW-RULE-001 is DRAFT, no composition evaluator runs in DB mode.
    // The base verification must still reference the correct DB product.
    const res = mockRes();
    await auditController.auditRawText(
      {
        body: {
          text: 'NOVAWEAR\nTHE CLASSIC COTTON SHIRT\n100% polyester fabric. ₹1,299\nNOVAWEAR | NW-CS-001',
          metadata: { sku: 'NW-CS-001' },
        },
        organisation: ctx,
      } as any,
      res
    );
    assert.equal(res.statusCode, 200);
    const result = res.body;
    assert.deepEqual(result.executedRules, []);
    assert.equal(result.findings.length, 1);
    assert.ok(result.findings[0].expectedValue.includes('Classic Cotton Shirt'));
    assert.ok(!result.findings[0].expectedValue.includes('polyester'));
  });
});

test('Test D: database campaign facts preserve approval status and dates', async () => {
  await withMode('database', async () => {
    const engine = await createAuditEngine({ mode: 'database', context: ctx });
    const pending = engine.dataSource.getCampaignById('CMP-26-021');
    assert.ok(pending);
    assert.equal(pending.approvalStatus, 'Pending');
    const approved = engine.dataSource.getCampaignById('CMP-26-018');
    assert.ok(approved);
    assert.equal(approved.approvalStatus, 'Approved');
    // CMP-26-014 ended 2026-10-31 (before reference date) but approval is preserved;
    // expiry is determined by dates downstream, not by overwriting approval status.
    const expired = engine.dataSource.getCampaignById('CMP-26-014');
    assert.ok(expired);
    assert.equal(expired.endDate, '2026-10-31');
    assert.equal(expired.approvalStatus, 'Approved');
  });
});

test('Test G: concurrent database-mode controller requests are isolated', async () => {
  await withMode('database', async () => {
    const makeReq = () => ({ body: { text: COMPLIANT_TEXT, metadata: { sku: 'NW-CS-001' } }, organisation: ctx } as any);
    const [r1, r2] = await Promise.all([
      (async () => { const res = mockRes(); await auditController.auditRawText(makeReq(), res); return res; })(),
      (async () => { const res = mockRes(); await auditController.auditRawText(makeReq(), res); return res; })(),
    ]);
    assert.equal(r1.statusCode, 200);
    assert.equal(r2.statusCode, 200);
    assert.deepEqual(r1.body.executedRules, []);
    assert.deepEqual(r2.body.executedRules, []);
    assert.equal(r1.body.findings.length, 1);
    assert.equal(r2.body.findings.length, 1);
    // Isolation is about organisation context and data source, not submissionId
    // uniqueness (same-millisecond IDs are a pre-existing, unrelated behaviour).
    assert.equal(r1.body.metadata.organisation, ctx.organisationName);
    assert.equal(r2.body.metadata.organisation, ctx.organisationName);
  });
});

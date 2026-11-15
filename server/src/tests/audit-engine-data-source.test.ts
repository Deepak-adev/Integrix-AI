import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AuditEngine } from '../services/audit-engine/audit-engine.js';
import { auditEngine } from '../services/audit-engine/audit-engine.js';
import { createAuditEngine } from '../services/audit-engine/audit-engine-factory.js';
import { DatabaseAuditDataSource } from '../services/audit-engine/audit-data-source.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';
import type { OrganisationDataProvider } from '../services/repositories/organisation-data.provider.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { disconnectPrisma } from '../lib/prisma.js';
import type { ExtractedAdContent, OrganisationContext, ProductFact } from '../types/index.js';

let ctx: OrganisationContext;

before(async () => {
  const resolver = new OrganisationResolver({ store: new PrismaOrganisationStore(), configuredSlug: 'novawear', cacheTtlMs: 0 });
  ctx = await resolver.resolve();
});

after(async () => {
  await disconnectPrisma();
});

function baseExtracted(sku: string): ExtractedAdContent {
  return {
    detectedSku: sku,
    detectedProducts: [],
    detectedComposition: undefined,
    detectedPrice: undefined,
    performanceClaims: [],
    deliveryStatements: [],
    campaignReferences: [],
    brandTerms: [],
    confidence: 0.9,
    rawText: '',
    extractionMethod: 'PDF_TEXT',
  } as ExtractedAdContent;
}

test('engine defaults to file mode and matches baseline deterministic result', async () => {
  const engine = new AuditEngine(); // default FileAuditDataSource
  await engine.dataSource.initialize();

  const extracted = baseExtracted('NW-CS-001');
  const viaInjected = engine.evaluateExtractedContent(extracted, 'test.pdf', { sku: 'NW-CS-001' });
  const viaSingleton = auditEngine.evaluateExtractedContent(extracted, 'test.pdf', { sku: 'NW-CS-001' });

  assert.equal(viaInjected.overallStatus, viaSingleton.overallStatus);
  assert.equal(viaInjected.findings.length, viaSingleton.findings.length);
  assert.equal(viaInjected.overallStatus, 'PASS');
});

test('engine accepts an injected data source for product lookup', async () => {
  const mockProduct: ProductFact = {
    sku: 'SKU-X', productName: 'Mock Product', category: '', colour: '', composition: 'cotton',
    fit: '', sizeRange: '', mrpInr: 100, sellingPriceInr: 90, approvedDescription: '',
    approvedClaims: [], claimsNotApproved: [], careInstructions: '', status: 'ACTIVE', lastUpdated: '',
  };
  let productLookupCalled = false;

  const mockSource: AuditDataSource = {
    initialize: async () => {},
    getProductBySku: (sku: string) => { productLookupCalled = true; return sku === 'SKU-X' ? mockProduct : undefined; },
    getAllProducts: () => [mockProduct],
    getCampaignById: () => undefined,
    getCampaignsForSku: () => [],
    getAllCampaigns: () => [],
    getRule: () => undefined,
    getAllRules: () => [],
    getPolicyDocument: () => undefined,
    searchPolicyText: () => null,
  };

  const engine = new AuditEngine(mockSource);
  await engine.dataSource.initialize();
  const result = engine.evaluateExtractedContent(baseExtracted('SKU-X'), 'test.pdf', { sku: 'SKU-X' });

  assert.equal(productLookupCalled, true);
  assert.equal(result.findings.length, 1);
  assert.ok(result.findings[0].expectedValue.includes('Mock Product'));
});

test('database mode requires a trusted organisation context', async () => {
  await assert.rejects(() => createAuditEngine({ mode: 'database' }), /OrganisationContext is required/);
  await assert.rejects(() => createAuditEngine({ mode: 'database', context: null }), /OrganisationContext is required/);
});

test('database retrieval failure is propagated safely (fail closed)', async () => {
  const failingProvider = {
    getBundle: async () => { throw new Error('provider unavailable'); },
  } as unknown as OrganisationDataProvider;

  await assert.rejects(
    () => createAuditEngine({ mode: 'database', context: ctx, provider: failingProvider }),
    /provider unavailable/
  );
});

test('database mode exposes empty executable rules and does not fall back to file rules', async () => {
  const engine = await createAuditEngine({ mode: 'database', context: ctx });

  assert.ok(engine.dataSource instanceof DatabaseAuditDataSource);
  // NOVAWEAR rules are DRAFT -> executable rule collection is empty.
  assert.equal(engine.dataSource.getAllRules().length, 0);
  assert.equal(engine.dataSource.getRule('NW-RULE-001'), undefined);
  // Products still come from the database (8), not the file loader fallback.
  assert.equal(engine.dataSource.getAllProducts().length, 8);
});

test('audit-engine.ts has no Prisma or Express dependency', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const enginePath = path.join(here, '../services/audit-engine/audit-engine.ts');
  const interfacePath = path.join(here, '../services/audit-engine/audit-data-source.interface.ts');
  const forbidden = /@prisma|prisma\/|from ['"]express['"]|require\(['"]express['"]\)/i;

  for (const file of [enginePath, interfacePath]) {
    const src = fs.readFileSync(file, 'utf8');
    assert.ok(!forbidden.test(src), `${path.basename(file)} must not depend on Prisma or Express`);
  }
});

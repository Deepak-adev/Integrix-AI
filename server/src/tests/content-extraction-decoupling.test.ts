import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { contentExtractor } from '../services/extraction/content-extractor.js';
import { FileAuditDataSource } from '../services/audit-engine/file-audit-data-source.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';
import type { CampaignFact, PolicyRuleDefinition, ProductFact } from '../types/index.js';

function product(overrides: Partial<ProductFact> = {}): ProductFact {
  return {
    sku: 'ACME-001', productName: 'Acme Shirt', category: '', colour: '', composition: 'cotton',
    fit: '', sizeRange: '', mrpInr: 100, sellingPriceInr: 90, approvedDescription: '',
    approvedClaims: [], claimsNotApproved: [], careInstructions: '', status: 'ACTIVE', lastUpdated: '',
    ...overrides,
  };
}

function sourceWith(products: ProductFact[]): AuditDataSource {
  return {
    initialize: async () => {},
    getProductBySku: (sku: string) => products.find(p => p.sku === sku),
    getAllProducts: () => products,
    getCampaignById: () => undefined,
    getCampaignsForSku: () => [],
    getAllCampaigns: () => [],
    getRule: () => undefined,
    getAllRules: () => [],
    getPolicyDocument: () => undefined,
    searchPolicyText: () => null,
  };
}

before(async () => {
  // Ensure the file-based loader is initialized for the file-mode regression test.
  const fileSource = new FileAuditDataSource();
  await fileSource.initialize();
});

test('content extraction uses injected organisation-specific products', async () => {
  const src = sourceWith([product()]);
  const out = await contentExtractor.parseContent('Acme Shirt ₹999', undefined, 'PDF_TEXT', src);
  assert.deepEqual(out.detectedProducts, ['Acme Shirt']);
  assert.equal(out.detectedSku, 'ACME-001');
});

test('SKU regex extraction is preserved regardless of product source', async () => {
  const src = sourceWith([]);
  const out = await contentExtractor.parseContent('Code NW-CS-001 price ₹1,299', undefined, 'PDF_TEXT', src);
  assert.equal(out.detectedSku, 'NW-CS-001');
});

test('Was/Now price extraction picks the selling price', async () => {
  const src = sourceWith([]);
  const out = await contentExtractor.parseContent('Was ₹1,499 Now ₹999', undefined, 'PDF_TEXT', src);
  assert.equal(out.detectedPrice, 999);
});

test('multiple prices without Was/Now resolve to the lower selling price', async () => {
  const src = sourceWith([]);
  const out = await contentExtractor.parseContent('₹1,499 ₹999', undefined, 'PDF_TEXT', src);
  assert.equal(out.detectedPrice, 999);
});

test('synonym fallback never selects a product absent from the source', async () => {
  const src = sourceWith([]); // no NOVAWEAR products in this source
  const out = await contentExtractor.parseContent('Our cotton shirt is here', undefined, 'PDF_TEXT', src);
  assert.notEqual(out.detectedSku, 'NW-CS-001');
  assert.ok(!out.detectedProducts.includes('Classic Cotton Shirt'));
});

test('file-mode extraction remains backward compatible', async () => {
  const fileSource = new FileAuditDataSource();
  await fileSource.initialize();
  const out = await contentExtractor.parseContent(
    'NOVAWEAR\nTHE CLASSIC COTTON SHIRT\nAn easy everyday layer in 100% cotton. Regular fit. Made for repeat wear.\n₹1,299\nNOVAWEAR | NW-CS-001 | Regular fit',
    { sku: 'NW-CS-001' },
    'PDF_TEXT',
    fileSource
  );
  assert.equal(out.detectedSku, 'NW-CS-001');
  assert.equal(out.detectedPrice, 1299);
});

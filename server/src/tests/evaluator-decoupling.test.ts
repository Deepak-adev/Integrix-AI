import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateRule001 } from '../rules/rule-001.js';
import { evaluateRule002 } from '../rules/rule-002.js';
import { evaluateRule003 } from '../rules/rule-003.js';
import { evaluateRule004 } from '../rules/rule-004.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';
import type { CampaignFact, ExtractedAdContent, PolicyRuleDefinition, ProductFact } from '../types/index.js';

function baseExtracted(overrides: Partial<ExtractedAdContent> = {}): ExtractedAdContent {
  return {
    detectedProducts: [], detectedSku: undefined, detectedPrice: undefined,
    advertisedPriceFormatted: undefined, detectedComposition: undefined, detectedFit: undefined,
    performanceClaims: [], deliveryStatements: [], campaignReferences: [], conditionsText: undefined,
    brandTerms: [], confidence: 0.9, rawText: '', extractionMethod: 'PDF_TEXT',
    ...overrides,
  } as ExtractedAdContent;
}

function product(overrides: Partial<ProductFact> = {}): ProductFact {
  return {
    sku: 'NW-CS-001', productName: 'Classic Cotton Shirt', category: '', colour: '',
    composition: '100% cotton', fit: 'Regular fit', sizeRange: '', mrpInr: 1499,
    sellingPriceInr: 1299, approvedDescription: '', approvedClaims: ['breathable'],
    claimsNotApproved: ['wrinkle-proof'], careInstructions: '', status: 'ACTIVE', lastUpdated: '',
    ...overrides,
  };
}

function campaign(overrides: Partial<CampaignFact> = {}): CampaignFact {
  return {
    campaignId: 'CMP-26-021', sku: 'NW-CS-001', campaignName: '', campaignPriceInr: 999,
    startDate: '2026-11-01', endDate: '2026-11-30', eligibleChannels: ['website'],
    conditions: '', approvalStatus: 'Approved', approver: 'Merchandising Lead',
    ...overrides,
  };
}

function ruleDef(ruleId: string): PolicyRuleDefinition {
  return { ruleId, organisationId: 'org', ruleVersion: '0.1', ruleName: `${ruleId} name`, ruleFamily: '', category: '', inputComponentId: '', inputComponentName: '', referenceComponentIds: '', policyStatement: '', validationLogic: '', errorMessage: '', correctionMessage: '', authoritySourceId: '', sourceLocator: '', severity: 'AMBER', engine: '', executionMode: '', requiredInputs: '', passCriteria: '', failCriteria: '', reviewRequired: false, ruleStatus: 'ACTIVE', confidenceThreshold: undefined } as PolicyRuleDefinition;
}

function mockSource(opts: {
  products?: ProductFact[]; campaigns?: CampaignFact[]; rules?: string[];
} = {}): AuditDataSource & { calls: string[] } {
  const calls: string[] = [];
  const products = opts.products ?? [];
  const campaigns = opts.campaigns ?? [];
  const rules = new Set(opts.rules ?? []);
  return {
    calls,
    initialize: async () => {},
    getProductBySku: (sku: string) => { calls.push(`getProductBySku:${sku}`); return products.find(p => p.sku === sku); },
    getAllProducts: () => products,
    getCampaignById: (id: string) => { calls.push(`getCampaignById:${id}`); return campaigns.find(c => c.campaignId === id); },
    getCampaignsForSku: (sku: string) => campaigns.filter(c => c.sku === sku),
    getAllCampaigns: () => campaigns,
    getRule: (id: string) => { calls.push(`getRule:${id}`); return rules.has(id) ? ruleDef(id) : undefined; },
    getAllRules: () => [...rules].map(ruleDef),
    getPolicyDocument: () => undefined,
    searchPolicyText: () => null,
  } as AuditDataSource & { calls: string[] };
}

test('rule-001 uses injected product data', () => {
  const src = mockSource({ products: [product()], rules: ['NW-RULE-001'] });
  const f = evaluateRule001(baseExtracted({ detectedSku: 'NW-CS-001', detectedComposition: '100% cotton' }), undefined, src);
  assert.ok(f);
  assert.equal(f.status, 'PASS');
  assert.ok(src.calls.includes('getProductBySku:NW-CS-001'));
});

test('rule-001 flags a composition mismatch against injected product data', () => {
  const src = mockSource({ products: [product()], rules: ['NW-RULE-001'] });
  const f = evaluateRule001(baseExtracted({ detectedSku: 'NW-CS-001', detectedComposition: '100% polyester' }), undefined, src);
  assert.ok(f);
  assert.equal(f.status, 'FAIL');
  assert.ok(f.explanation.includes('100% cotton'));
});

test('rule-002 treats PENDING campaign as not approved', () => {
  const src = mockSource({
    products: [product()],
    campaigns: [campaign({ approvalStatus: 'Pending', campaignPriceInr: 999 })],
    rules: ['NW-RULE-002'],
  });
  const f = evaluateRule002(
    baseExtracted({ detectedSku: 'NW-CS-001', detectedPrice: 999, campaignReferences: ['CMP-26-021'] }),
    { publicationDate: '2026-11-13', publicationChannel: 'website' },
    src
  );
  assert.ok(f);
  assert.equal(f.status, 'FAIL');
  assert.ok(f.explanation.includes('Pending'));
});

test('rule-002 treats expired campaign as invalid', () => {
  const src = mockSource({
    products: [product()],
    campaigns: [campaign({ approvalStatus: 'Approved', startDate: '2026-01-01', endDate: '2026-01-31', campaignPriceInr: 999 })],
    rules: ['NW-RULE-002'],
  });
  const f = evaluateRule002(
    baseExtracted({ detectedSku: 'NW-CS-001', detectedPrice: 999, campaignReferences: ['CMP-26-021'] }),
    { publicationDate: '2026-11-13', publicationChannel: 'website' },
    src
  );
  assert.ok(f);
  assert.equal(f.status, 'FAIL');
  assert.ok(f.explanation.toLowerCase().includes('expired'));
});

test('rule-003 uses injected product claims', () => {
  const src = mockSource({ products: [product()], rules: ['NW-RULE-003'] });
  const f = evaluateRule003(baseExtracted({ detectedSku: 'NW-CS-001', performanceClaims: ['wrinkle-proof'] }), undefined, src);
  assert.ok(f);
  assert.equal(f.status, 'NEEDS_VERIFICATION');
});

test('rule-004 uses injected rule definition only', () => {
  const src = mockSource({ rules: ['NW-RULE-004'] });
  const f = evaluateRule004(baseExtracted({ deliveryStatements: ['Guaranteed next-day delivery'] }), undefined, src);
  assert.ok(f);
  assert.equal(f.status, 'FAIL');
});

test('evaluator files have no direct repositoryLoader dependency', () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const files = ['rule-001.ts', 'rule-002.ts', 'rule-003.ts', 'rule-004.ts', 'brand-rules.ts'];
  for (const f of files) {
    const src = fs.readFileSync(path.join(here, `../rules/${f}`), 'utf8');
    assert.ok(!src.includes('repositoryLoader'), `${f} must not reference repositoryLoader`);
    assert.ok(!/from ['"]@prisma|from ['"]express['"]/.test(src), `${f} must not import Prisma/Express`);
  }
});

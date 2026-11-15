import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Campaign, PolicyRule, PolicySource, Product } from '@prisma/client';
import { toProductFact } from '../services/repositories/mappers/product.mapper.js';
import { normalizeCampaignApprovalStatus, toCampaignFact } from '../services/repositories/mappers/campaign.mapper.js';
import { toPolicySourceRecord } from '../services/repositories/mappers/policy-source.mapper.js';
import { mapSeverity, toPolicyRuleDefinition, toRuleLifecycle } from '../services/repositories/mappers/policy-rule.mapper.js';

function fakeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1', organisationId: 'org-1', sku: 'NW-CS-001', productName: 'Classic Cotton Shirt',
    composition: '100% cotton', fit: 'Regular fit', sizes: ['S', 'M', 'L'],
    sellingPriceInr: 1299 as any, mrpInr: 1499 as any,
    approvedClaims: ['breathable'], claimsNotApproved: ['wrinkle-proof'],
    careInstructions: 'Machine wash cold', status: 'ACTIVE',
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Product;
}

function fakeCampaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1', organisationId: 'org-1', campaignId: 'CMP-26-014', sku: 'NW-CS-001',
    campaignPriceInr: 999 as any, startDate: new Date('2026-10-01T00:00:00Z'), endDate: new Date('2026-10-31T00:00:00Z'),
    eligibleChannels: ['website', 'instagram'], conditionsText: 'Selected sizes only',
    approvalStatus: 'APPROVED', approvedBy: 'Merchandising Lead', approvedAt: null,
    status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as Campaign;
}

function fakeSource(overrides: Partial<PolicySource> = {}): PolicySource {
  return {
    id: 's1', organisationId: 'org-1', sourceId: 'SRC-NW-001', title: 'Brand Guidelines',
    filename: '01_Brand_Guidelines.pdf', sourceType: 'PDF', storagePath: 'docs/x.pdf',
    mimeType: 'application/pdf', extractedText: 'brand text', pages: [{ pageNum: 1, text: 'brand text' }],
    metadata: { k: 'v' }, status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as PolicySource;
}

function fakeRule(overrides: Partial<PolicyRule> = {}): PolicyRule {
  return {
    id: 'r1', organisationId: 'org-1', ruleId: 'NW-RULE-001', ruleVersion: '0.1',
    ruleFamily: 'Product', ruleCategory: 'Composition', componentId: 'CMP-1',
    policyComponentId: null, validationComponentId: null, exceptionComponentId: null,
    errorComponentId: null, correctionComponentId: null,
    policyText: 'policy', validationLogic: 'logic', exceptionText: 'exc',
    errorMessage: 'err', correctionGuidance: 'fix',
    sourceIds: ['SRC-NW-005'], referenceComponentIds: ['A', 'B'],
    severity: 'RED', engine: 'DETERMINISTIC', executionMode: 'Pre-publication',
    requiredInputs: ['sku'], passCriteria: 'pass', failCriteria: 'fail',
    reviewRequired: true, status: 'DRAFT', approvalStatus: 'DRAFT',
    approvedBy: null, approvedAt: null, activatedBy: null, activatedAt: null,
    effectiveFrom: null, effectiveTo: null, confidenceThreshold: 0.9,
    evaluatorKey: null, owner: 'Owner', testCaseId: 'TC-1', reasoning: 'why',
    badExample: 'bad', goodExample: 'good', metadata: { ruleName: 'SKU fabric composition match', inputComponentName: 'Fabric composition claim', sourceLocator: 'Product Catalogue' },
    createdAt: new Date(), updatedAt: new Date(),
    ...overrides,
  } as PolicyRule;
}

test('product mapping preserves facts and marks schema-missing fields empty', () => {
  const f = toProductFact(fakeProduct());
  assert.equal(f.sku, 'NW-CS-001');
  assert.equal(f.productName, 'Classic Cotton Shirt');
  assert.equal(f.composition, '100% cotton');
  assert.equal(f.sellingPriceInr, 1299);
  assert.equal(f.mrpInr, 1499);
  assert.deepEqual(f.approvedClaims, ['breathable']);
  assert.deepEqual(f.claimsNotApproved, ['wrinkle-proof']);
  assert.equal(f.sizeRange, 'S, M, L');
  // Schema-missing fields are explicitly empty, not fabricated.
  assert.equal(f.category, '');
  assert.equal(f.colour, '');
  assert.equal(f.approvedDescription, '');
  assert.equal(f.lastUpdated, '');
});

test('campaign mapping normalizes approval status and preserves dates/price', () => {
  const approved = toCampaignFact(fakeCampaign({ approvalStatus: 'APPROVED' }));
  assert.equal(approved.approvalStatus, 'Approved');
  assert.equal(approved.campaignPriceInr, 999);
  assert.equal(approved.startDate, '2026-10-01');
  assert.equal(approved.endDate, '2026-10-31');
  assert.deepEqual(approved.eligibleChannels, ['website', 'instagram']);
  assert.equal(approved.conditions, 'Selected sizes only');
  assert.equal(approved.campaignName, '');

  const pending = toCampaignFact(fakeCampaign({ approvalStatus: 'PENDING' }));
  assert.equal(pending.approvalStatus, 'Pending');
  assert.notEqual(pending.approvalStatus.toLowerCase(), 'approved');
});

test('normalizeCampaignApprovalStatus keeps pending pending and preserves unknown', () => {
  assert.equal(normalizeCampaignApprovalStatus('PENDING'), 'Pending');
  assert.equal(normalizeCampaignApprovalStatus('APPROVED'), 'Approved');
  assert.equal(normalizeCampaignApprovalStatus('CUSTOM'), 'CUSTOM');
});

test('expired campaign keeps approval status and preserved end date', () => {
  const c = toCampaignFact(fakeCampaign({ approvalStatus: 'APPROVED', endDate: new Date('2026-10-31T00:00:00Z') }));
  // Approval state is preserved; expiry is determined by dates downstream.
  assert.equal(c.approvalStatus, 'Approved');
  assert.equal(c.endDate, '2026-10-31');
});

test('policy source mapping preserves content without inventing', () => {
  const rec = toPolicySourceRecord(fakeSource({ extractedText: null, pages: null }));
  assert.equal(rec.sourceId, 'SRC-NW-001');
  assert.equal(rec.extractedText, null);
  assert.equal(rec.pages, null);
  assert.equal(rec.status, 'ACTIVE');
});

test('policy rule mapping preserves fields and metadata-derived names', () => {
  const def = toPolicyRuleDefinition(fakeRule(), 'org-1');
  assert.equal(def.ruleId, 'NW-RULE-001');
  assert.equal(def.ruleVersion, '0.1');
  assert.equal(def.ruleName, 'SKU fabric composition match');
  assert.equal(def.inputComponentName, 'Fabric composition claim');
  assert.equal(def.sourceLocator, 'Product Catalogue');
  assert.equal(def.severity, 'RED');
  assert.equal(def.ruleStatus, 'DRAFT');
  assert.equal(def.reviewRequired, true);
  assert.equal(def.confidenceThreshold, 0.9);
});

test('severity mapping is conservative', () => {
  assert.equal(mapSeverity('RED'), 'RED');
  assert.equal(mapSeverity('GREEN'), 'GREEN');
  assert.equal(mapSeverity('WARNING'), 'AMBER');
  assert.equal(mapSeverity('AMBER'), 'AMBER');
});

test('rule lifecycle: only ACTIVE is executable', () => {
  assert.equal(toRuleLifecycle(fakeRule({ approvalStatus: 'DRAFT' })).executable, false);
  assert.equal(toRuleLifecycle(fakeRule({ approvalStatus: 'APPROVED' })).executable, false);
  assert.equal(toRuleLifecycle(fakeRule({ approvalStatus: 'PENDING_REVIEW' })).executable, false);
  assert.equal(toRuleLifecycle(fakeRule({ approvalStatus: 'REJECTED' })).executable, false);
  assert.equal(toRuleLifecycle(fakeRule({ approvalStatus: 'ACTIVE' })).executable, true);
});

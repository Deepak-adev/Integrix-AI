import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { PolicyRule } from '@prisma/client';
import { OrganisationDataProvider, type OrganisationDataRepositories } from '../services/repositories/organisation-data.provider.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { MissingOrganisationContextError } from '../services/organisation/tenant-context.js';
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

function emptyRepos(overrides: Partial<OrganisationDataRepositories> = {}): OrganisationDataRepositories {
  const empty = async () => [] as any[];
  return {
    product: { findAll: empty },
    campaign: { findAll: empty },
    policySource: { findAll: empty },
    policyRule: { findAll: empty },
    ruleParameter: { findAll: empty },
    ruleException: { findAll: empty },
    rulebookRelease: { listWithAssociations: empty },
    ...overrides,
  } as OrganisationDataRepositories;
}

test('provider assembles NOVAWEAR bundle from database repositories', async () => {
  const provider = new OrganisationDataProvider();
  const bundle = await provider.getBundle(ctx);

  assert.equal(bundle.context.organisationId, ctx.organisationId);
  assert.equal(bundle.products.length, 8);
  assert.equal(bundle.campaigns.length, 3);
  assert.equal(bundle.policySources.length, 6);
  assert.equal(bundle.policyRules.length, 5);
  assert.equal(bundle.ruleParameters.length, 4);
  assert.equal(bundle.ruleExceptions.length, 3);
  assert.equal(bundle.rulebookReleases.length, 1);

  // All NOVAWEAR rules are DRAFT -> no executable rules.
  assert.equal(bundle.executableRules.length, 0);
  assert.equal(bundle.ruleLifecycles.length, 5);
  for (const l of bundle.ruleLifecycles) {
    assert.equal(l.approvalStatus, 'DRAFT');
    assert.equal(l.executable, false);
  }
  for (const r of bundle.policyRules) assert.equal(r.ruleStatus, 'DRAFT');

  // Campaign approval preserved: CMP-26-021 is Pending.
  const pending = bundle.campaigns.find((c) => c.campaignId === 'CMP-26-021');
  assert.ok(pending);
  assert.equal(pending.approvalStatus, 'Pending');
});

test('provider rejects missing organisation context', async () => {
  const provider = new OrganisationDataProvider();
  await assert.rejects(() => provider.getBundle(undefined), MissingOrganisationContextError);
  await assert.rejects(() => provider.getBundle(null), MissingOrganisationContextError);
});

test('provider fails closed on database retrieval errors (no fallback)', async () => {
  const repos = emptyRepos({
    product: { findAll: async () => { throw new Error('db unavailable'); } },
  });
  const provider = new OrganisationDataProvider(repos);
  await assert.rejects(() => provider.getBundle(ctx), /db unavailable/);
});

test('provider does not fall back to global NOVAWEAR data when DB is empty', async () => {
  const provider = new OrganisationDataProvider(emptyRepos());
  const bundle = await provider.getBundle(ctx);
  assert.equal(bundle.products.length, 0);
  assert.equal(bundle.campaigns.length, 0);
  assert.equal(bundle.policyRules.length, 0);
  assert.equal(bundle.executableRules.length, 0);
});

test('only ACTIVE rules are executable; APPROVED is not sufficient', async () => {
  const fakeRule = (ruleId: string, approvalStatus: string): PolicyRule => ({
    id: ruleId, organisationId: ctx.organisationId, ruleId, ruleVersion: '0.1',
    ruleFamily: null, ruleCategory: null, componentId: null, policyComponentId: null,
    validationComponentId: null, exceptionComponentId: null, errorComponentId: null,
    correctionComponentId: null, policyText: null, validationLogic: null, exceptionText: null,
    errorMessage: null, correctionGuidance: null, sourceIds: [], referenceComponentIds: [],
    severity: 'AMBER', engine: 'DETERMINISTIC', executionMode: 'Pre-publication',
    requiredInputs: [], passCriteria: null, failCriteria: null, reviewRequired: false,
    status: 'DRAFT', approvalStatus: approvalStatus as any,
    approvedBy: null, approvedAt: null, activatedBy: null, activatedAt: null,
    effectiveFrom: null, effectiveTo: null, confidenceThreshold: null, evaluatorKey: null,
    owner: null, testCaseId: null, reasoning: null, badExample: null, goodExample: null,
    metadata: null, createdAt: new Date(), updatedAt: new Date(),
  } as PolicyRule);

  const repos = emptyRepos({
    policyRule: { findAll: async () => [fakeRule('R-DRAFT', 'DRAFT'), fakeRule('R-APPROVED', 'APPROVED'), fakeRule('R-ACTIVE', 'ACTIVE')] },
  });
  const provider = new OrganisationDataProvider(repos);
  const bundle = await provider.getBundle(ctx);

  assert.equal(bundle.policyRules.length, 3);
  assert.equal(bundle.executableRules.length, 1);
  assert.equal(bundle.executableRules[0].ruleId, 'R-ACTIVE');
  const byId = new Map(bundle.ruleLifecycles.map((l) => [l.ruleId, l.executable]));
  assert.equal(byId.get('R-DRAFT'), false);
  assert.equal(byId.get('R-APPROVED'), false);
  assert.equal(byId.get('R-ACTIVE'), true);
});

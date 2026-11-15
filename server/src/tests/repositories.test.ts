import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  productRepository,
  campaignRepository,
  policySourceRepository,
  policyRuleRepository,
  ruleParameterRepository,
  ruleExceptionRepository,
  rulebookReleaseRepository,
} from '../services/repositories/index.js';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import { MissingOrganisationContextError } from '../services/organisation/tenant-context.js';
import { disconnectPrisma } from '../lib/prisma.js';
import type { OrganisationContext } from '../types/index.js';

let ctx: OrganisationContext;

async function resolveNovawear(): Promise<OrganisationContext> {
  const resolver = new OrganisationResolver({
    store: new PrismaOrganisationStore(),
    configuredSlug: 'novawear',
    cacheTtlMs: 0,
  });
  return resolver.resolve();
}

before(async () => {
  ctx = await resolveNovawear();
});

after(async () => {
  await disconnectPrisma();
});

function assertScoped(rows: { organisationId: string }[], label: string): void {
  assert.ok(rows.length > 0, `${label}: expected at least one row`);
  for (const row of rows) {
    assert.equal(row.organisationId, ctx.organisationId, `${label}: row not scoped to resolved org`);
  }
}

// ─── Products ────────────────────────────────────────────────────────────────
test('retrieves NOVAWEAR products with Decimal prices preserved', async () => {
  const products = await productRepository.findAll(ctx);
  assert.equal(products.length, 8);
  assertScoped(products, 'products');

  const shirt = await productRepository.findBySku(ctx, 'NW-CS-001');
  assert.ok(shirt);
  assert.equal(shirt.sku, 'NW-CS-001');
  assert.equal(shirt.organisationId, ctx.organisationId);
  // Decimal precision preserved (object with numeric conversion), not fabricated.
  assert.equal(typeof shirt.sellingPriceInr, 'object');
  assert.equal(Number(shirt.sellingPriceInr), 1299);
});

// ─── Campaigns ───────────────────────────────────────────────────────────────
test('retrieves NOVAWEAR campaigns preserving approval statuses', async () => {
  const campaigns = await campaignRepository.findAll(ctx);
  assert.equal(campaigns.length, 3);
  assertScoped(campaigns, 'campaigns');

  const statuses = new Set(campaigns.map((c) => c.approvalStatus));
  assert.ok(statuses.has('APPROVED'));
  assert.ok(statuses.has('PENDING'));

  const pending = await campaignRepository.findByCampaignId(ctx, 'CMP-26-021');
  assert.ok(pending);
  assert.equal(pending.approvalStatus, 'PENDING');
  assert.ok(pending.startDate instanceof Date);
  assert.ok(pending.endDate instanceof Date);

  const bySku = await campaignRepository.findBySku(ctx, 'NW-TS-003');
  assert.equal(bySku.length, 1);
  assert.equal(bySku[0].campaignId, 'CMP-26-018');
});

// ─── Policy sources ──────────────────────────────────────────────────────────
test('retrieves NOVAWEAR policy sources without inventing content', async () => {
  const sources = await policySourceRepository.findAll(ctx);
  assert.equal(sources.length, 6);
  assertScoped(sources, 'policySources');

  const ids = sources.map((s) => s.sourceId).sort();
  assert.deepEqual(ids, ['SRC-NW-001', 'SRC-NW-002', 'SRC-NW-003', 'SRC-NW-004', 'SRC-NW-005', 'SRC-NW-006']);

  const pdf = await policySourceRepository.findBySourceId(ctx, 'SRC-NW-001');
  assert.ok(pdf);
  assert.equal(typeof pdf.extractedText, 'string');
  assert.ok((pdf.extractedText ?? '').length > 0);
});

// ─── Policy rules ────────────────────────────────────────────────────────────
test('retrieves NOVAWEAR policy rules without activating drafts', async () => {
  const rules = await policyRuleRepository.findAll(ctx);
  assert.equal(rules.length, 5);
  assertScoped(rules, 'policyRules');

  for (const rule of rules) {
    assert.equal(rule.status, 'DRAFT');
    assert.equal(rule.approvalStatus, 'DRAFT');
    assert.equal(rule.ruleVersion, '0.1');
  }

  const rule001 = await policyRuleRepository.findByRuleId(ctx, 'NW-RULE-001');
  assert.equal(rule001.length, 1);
  assert.equal(rule001[0].approvalStatus, 'DRAFT');
  assert.ok(rule001[0].sourceIds.includes('SRC-NW-005'));
});

// ─── Rule parameters & exceptions ────────────────────────────────────────────
test('retrieves NOVAWEAR rule parameters and exceptions preserving draft status', async () => {
  const params = await ruleParameterRepository.findAll(ctx);
  assert.equal(params.length, 4);
  assertScoped(params, 'ruleParameters');
  for (const p of params) assert.equal(p.status, 'DRAFT');

  const param = await ruleParameterRepository.findByParameterId(ctx, 'NW-PAR-001');
  assert.ok(param);
  assert.equal(param.parameterId, 'NW-PAR-001');

  const exceptions = await ruleExceptionRepository.findAll(ctx);
  assert.equal(exceptions.length, 3);
  assertScoped(exceptions, 'ruleExceptions');
  for (const e of exceptions) assert.equal(e.status, 'DRAFT');

  const ruleExceptions = await ruleExceptionRepository.findByRule(ctx, 'NW-RULE-002');
  assert.ok(ruleExceptions.length >= 1);
  for (const e of ruleExceptions) {
    assert.equal(e.ruleId, 'NW-RULE-002');
    assert.equal(e.organisationId, ctx.organisationId);
  }
  // NW-RULE-001 has no exceptions in the seeded rulebook.
  const noneForRule001 = await ruleExceptionRepository.findByRule(ctx, 'NW-RULE-001');
  assert.equal(noneForRule001.length, 0);
});

// ─── Rulebook releases ───────────────────────────────────────────────────────
test('retrieves NOVAWEAR draft rulebook releases with associations', async () => {
  const releases = await rulebookReleaseRepository.findAll(ctx);
  assert.equal(releases.length, 1);
  assertScoped(releases, 'rulebookReleases');
  assert.equal(releases[0].releaseId, 'NW-RB-0.1');
  assert.equal(releases[0].status, 'DRAFT');

  const release = await rulebookReleaseRepository.findByReleaseId(ctx, 'NW-RB-0.1');
  assert.ok(release);
  assert.equal(release.status, 'DRAFT');
  assert.equal(release.rules.length, 5);
  assert.equal(release.sources.length, 6);
  for (const r of release.rules) assert.equal(r.organisationId, ctx.organisationId);
  for (const s of release.sources) assert.equal(s.organisationId, ctx.organisationId);
});

// ─── Missing organisation context ────────────────────────────────────────────
test('every repository rejects a missing organisation context', async () => {
  const repos = [
    productRepository,
    campaignRepository,
    policySourceRepository,
    policyRuleRepository,
    ruleParameterRepository,
    ruleExceptionRepository,
    rulebookReleaseRepository,
  ];
  for (const repo of repos) {
    await assert.rejects(() => repo.findAll(undefined), MissingOrganisationContextError);
    await assert.rejects(() => repo.findAll(null), MissingOrganisationContextError);
  }
});

// ─── No write operations exposed ─────────────────────────────────────────────
test('repositories expose no write operations', () => {
  const repos = [
    productRepository,
    campaignRepository,
    policySourceRepository,
    policyRuleRepository,
    ruleParameterRepository,
    ruleExceptionRepository,
    rulebookReleaseRepository,
  ];
  const writePattern = /(create|update|delete|upsert|remove)/i;
  for (const repo of repos) {
    for (const name of Object.getOwnPropertyNames(repo)) {
      assert.ok(!writePattern.test(name), `repository exposes write-like method: ${name}`);
    }
  }
});

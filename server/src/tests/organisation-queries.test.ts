import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { OrganisationResolver } from '../services/organisation/organisation-resolver.js';
import { PrismaOrganisationStore } from '../services/organisation/organisation-store.js';
import {
  getOrganisationOverview,
  getOrganisationProducts,
} from '../services/organisation/organisation-queries.js';
import { disconnectPrisma } from '../lib/prisma.js';

after(async () => {
  await disconnectPrisma();
});

test('resolves the seeded NOVAWEAR organisation from the database', async () => {
  const resolver = new OrganisationResolver({
    store: new PrismaOrganisationStore(),
    configuredSlug: 'novawear',
    cacheTtlMs: 0,
  });

  const ctx = await resolver.resolve();

  assert.equal(ctx.organisationSlug, 'novawear');
  assert.equal(ctx.organisationName, 'NOVAWEAR');
  assert.ok(ctx.organisationId.length > 0);
});

test('organisation-scoped queries return only the resolved organisation data', async () => {
  const resolver = new OrganisationResolver({
    store: new PrismaOrganisationStore(),
    configuredSlug: 'novawear',
    cacheTtlMs: 0,
  });
  const ctx = await resolver.resolve();

  const overview = await getOrganisationOverview(ctx);

  assert.equal(overview.organisationId, ctx.organisationId);
  assert.equal(overview.counts.products, 8);
  assert.equal(overview.counts.campaigns, 3);
  assert.equal(overview.counts.policyRules, 5);
  assert.equal(overview.counts.policySources, 6);
  assert.equal(overview.counts.acceptanceScenarios, 7);
  assert.equal(overview.counts.rulebookReleases, 1);

  const products = await getOrganisationProducts(ctx);
  assert.equal(products.length, 8);
  for (const p of products) {
    assert.equal(p.organisationId, ctx.organisationId);
  }
});

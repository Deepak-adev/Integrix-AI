import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAuditDataSource,
  DatabaseAuditDataSource,
  FileAuditDataSource,
} from '../services/audit-engine/audit-data-source.js';
import type { OrganisationDataProvider } from '../services/repositories/organisation-data.provider.js';
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

test('file mode preserves existing repository-loader compatibility', async () => {
  const source = await createAuditDataSource({ mode: 'file' });
  assert.ok(source instanceof FileAuditDataSource);
  assert.equal(source.getAllProducts().length, 8);
  assert.equal(source.getAllCampaigns().length, 3);
  assert.equal(source.getAllRules().length, 5);
});

test('database mode requires an organisation context', async () => {
  await assert.rejects(() => createAuditDataSource({ mode: 'database' }), /OrganisationContext is required/);
  await assert.rejects(() => createAuditDataSource({ mode: 'database', context: null }), /OrganisationContext is required/);
});

test('database mode serves organisation data and hides draft rules', async () => {
  const source = await createAuditDataSource({ mode: 'database', context: ctx });
  assert.ok(source instanceof DatabaseAuditDataSource);

  assert.equal(source.getAllProducts().length, 8);
  assert.equal(source.getAllCampaigns().length, 3);
  assert.equal(source.getAllProducts()[0].sku, 'NW-CS-001');

  const pending = source.getCampaignById('CMP-26-021');
  assert.ok(pending);
  assert.equal(pending.approvalStatus, 'Pending');

  // NOVAWEAR rules are DRAFT -> no executable rules exposed to the pipeline.
  assert.equal(source.getAllRules().length, 0);
  assert.equal(source.getRule('NW-RULE-001'), undefined);

  const doc = source.getPolicyDocument('SRC-NW-001');
  assert.ok(doc);
  assert.equal(doc.filename, '01_Brand_Guidelines.pdf');
  assert.ok(doc.fullText.length > 0);
});

test('database mode fails closed when the provider fails', async () => {
  const failingProvider = {
    getBundle: async () => { throw new Error('provider unavailable'); },
  } as unknown as OrganisationDataProvider;

  const source = new DatabaseAuditDataSource(ctx, failingProvider);
  await assert.rejects(() => source.initialize(), /provider unavailable/);
});

test('unknown mode is rejected', async () => {
  await assert.rejects(
    () => createAuditDataSource({ mode: 'bogus' as any }),
    /Unknown audit data source mode/
  );
});

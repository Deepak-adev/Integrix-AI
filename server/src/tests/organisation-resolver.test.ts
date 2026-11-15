import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  OrganisationResolver,
  OrganisationResolutionError,
} from '../services/organisation/organisation-resolver.js';
import type {
  OrganisationRecord,
  OrganisationStore,
} from '../services/organisation/organisation-store.js';

class FakeOrganisationStore implements OrganisationStore {
  public calls = 0;
  constructor(private readonly records: OrganisationRecord[]) {}
  async findBySlug(slug: string): Promise<OrganisationRecord | null> {
    this.calls += 1;
    return this.records.find((r) => r.slug === slug) ?? null;
  }
}

const NOVAWEAR: OrganisationRecord = {
  id: 'org-novawear-id',
  slug: 'novawear',
  name: 'NOVAWEAR',
  status: 'ACTIVE',
};

test('resolves the configured NOVAWEAR organisation to a trusted context', async () => {
  const store = new FakeOrganisationStore([NOVAWEAR]);
  const resolver = new OrganisationResolver({ store, configuredSlug: 'novawear' });

  const ctx = await resolver.resolve();

  assert.equal(ctx.organisationId, 'org-novawear-id');
  assert.equal(ctx.organisationSlug, 'novawear');
  assert.equal(ctx.organisationName, 'NOVAWEAR');
});

test('caches the resolved context to avoid repeated database queries', async () => {
  const store = new FakeOrganisationStore([NOVAWEAR]);
  const resolver = new OrganisationResolver({ store, configuredSlug: 'novawear', cacheTtlMs: 60_000 });

  await resolver.resolve();
  await resolver.resolve();
  await resolver.resolve();

  assert.equal(store.calls, 1);
});

test('rejects an unknown organisation without leaking details', async () => {
  const store = new FakeOrganisationStore([]);
  const resolver = new OrganisationResolver({ store, configuredSlug: 'does-not-exist' });

  await assert.rejects(
    () => resolver.resolve(),
    (err: unknown) => {
      assert.ok(err instanceof OrganisationResolutionError);
      assert.equal(err.code, 'ORG_NOT_FOUND');
      assert.equal(err.message, 'Organisation could not be resolved.');
      return true;
    }
  );
});

test('rejects an inactive organisation', async () => {
  const store = new FakeOrganisationStore([{ ...NOVAWEAR, status: 'SUSPENDED' }]);
  const resolver = new OrganisationResolver({ store, configuredSlug: 'novawear' });

  await assert.rejects(
    () => resolver.resolve(),
    (err: unknown) => {
      assert.ok(err instanceof OrganisationResolutionError);
      assert.equal(err.code, 'ORG_INACTIVE');
      return true;
    }
  );
});

test('rejects when no organisation is configured', async () => {
  const store = new FakeOrganisationStore([NOVAWEAR]);
  const resolver = new OrganisationResolver({ store, configuredSlug: '   ' });

  await assert.rejects(
    () => resolver.resolve(),
    (err: unknown) => {
      assert.ok(err instanceof OrganisationResolutionError);
      assert.equal(err.code, 'ORG_NOT_CONFIGURED');
      return true;
    }
  );
});

test('wraps store failures without exposing internals', async () => {
  const failingStore: OrganisationStore = {
    findBySlug: async () => {
      throw new Error('connection string postgresql://user:secret@host/db');
    },
  };
  const resolver = new OrganisationResolver({ store: failingStore, configuredSlug: 'novawear' });

  await assert.rejects(
    () => resolver.resolve(),
    (err: unknown) => {
      assert.ok(err instanceof OrganisationResolutionError);
      assert.equal(err.code, 'ORG_STORE_ERROR');
      assert.ok(!err.message.includes('secret'));
      return true;
    }
  );
});

test('re-queries after the cache TTL expires', async () => {
  let now = 1_000;
  const store = new FakeOrganisationStore([NOVAWEAR]);
  const resolver = new OrganisationResolver({
    store,
    configuredSlug: 'novawear',
    cacheTtlMs: 100,
    now: () => now,
  });

  await resolver.resolve();
  now += 50;
  await resolver.resolve();
  assert.equal(store.calls, 1);

  now += 100;
  await resolver.resolve();
  assert.equal(store.calls, 2);
});

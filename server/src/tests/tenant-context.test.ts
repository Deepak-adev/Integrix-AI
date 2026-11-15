import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MissingOrganisationContextError,
  organisationWhere,
  requireOrganisationContext,
} from '../services/organisation/tenant-context.js';
import { getOrganisationProducts } from '../services/organisation/organisation-queries.js';
import type { OrganisationContext } from '../types/index.js';

const VALID: OrganisationContext = {
  organisationId: 'org-123',
  organisationSlug: 'novawear',
  organisationName: 'NOVAWEAR',
};

test('requireOrganisationContext returns a complete trusted context', () => {
  assert.equal(requireOrganisationContext(VALID), VALID);
});

test('requireOrganisationContext rejects a missing context', () => {
  assert.throws(() => requireOrganisationContext(undefined), MissingOrganisationContextError);
  assert.throws(() => requireOrganisationContext(null), MissingOrganisationContextError);
});

test('requireOrganisationContext rejects an incomplete context', () => {
  assert.throws(
    () => requireOrganisationContext({ organisationId: 'org-123' } as OrganisationContext),
    MissingOrganisationContextError
  );
  assert.throws(
    () =>
      requireOrganisationContext({
        organisationId: '',
        organisationSlug: 'novawear',
        organisationName: 'NOVAWEAR',
      }),
    MissingOrganisationContextError
  );
});

test('organisationWhere scopes queries to the resolved organisationId', () => {
  assert.deepEqual(organisationWhere(VALID), { organisationId: 'org-123' });
});

test('organisationWhere rejects a missing context', () => {
  assert.throws(() => organisationWhere(undefined), MissingOrganisationContextError);
});

test('organisation-scoped service functions require a trusted context', async () => {
  await assert.rejects(
    () => getOrganisationProducts(undefined),
    MissingOrganisationContextError
  );
  await assert.rejects(
    () => getOrganisationProducts(null),
    MissingOrganisationContextError
  );
});

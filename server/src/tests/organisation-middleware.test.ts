import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import { createOrganisationMiddleware } from '../middleware/organisation.middleware.js';
import { OrganisationResolutionError } from '../services/organisation/organisation-resolver.js';
import type { OrganisationContext } from '../types/index.js';

const TRUSTED: OrganisationContext = {
  organisationId: 'org-trusted-id',
  organisationSlug: 'novawear',
  organisationName: 'NOVAWEAR',
};

function makeReqRes(body: Record<string, unknown> = {}) {
  const req = { body, query: {}, params: {}, headers: {} } as unknown as Request;
  const res: any = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return { req, res: res as Response };
}

test('attaches the trusted organisation context and ignores client-supplied organisation fields', async () => {
  const middleware = createOrganisationMiddleware({ resolve: async () => TRUSTED });
  const { req, res } = makeReqRes({
    organisation: 'EVIL-ORG',
    organisationId: 'org-attacker-id',
    orgId: 'org-attacker-id',
    slug: 'attacker',
  });
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };

  await middleware(req, res, next);

  assert.equal(nextCalled, true);
  assert.deepEqual(req.organisation, TRUSTED);
  // Client input remains untouched but is never used as the trusted context.
  assert.equal((req.body as Record<string, unknown>).organisationId, 'org-attacker-id');
});

test('returns 404 for an unknown organisation', async () => {
  const middleware = createOrganisationMiddleware({
    resolve: async () => {
      throw new OrganisationResolutionError('ORG_NOT_FOUND', 'Organisation could not be resolved.');
    },
  });
  const { req, res } = makeReqRes();
  let nextCalled = false;

  await middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal((res as any).statusCode, 404);
  assert.deepEqual((res as any).body, { error: 'Organisation context could not be resolved.' });
});

test('returns 403 for an inactive organisation', async () => {
  const middleware = createOrganisationMiddleware({
    resolve: async () => {
      throw new OrganisationResolutionError('ORG_INACTIVE', 'Organisation is not active.');
    },
  });
  const { req, res } = makeReqRes();

  await middleware(req, res, () => {});

  assert.equal((res as any).statusCode, 403);
});

test('returns 503 when the organisation store is unavailable', async () => {
  const middleware = createOrganisationMiddleware({
    resolve: async () => {
      throw new OrganisationResolutionError('ORG_STORE_ERROR', 'Organisation could not be resolved.');
    },
  });
  const { req, res } = makeReqRes();

  await middleware(req, res, () => {});

  assert.equal((res as any).statusCode, 503);
});

test('forwards unexpected errors to the error handler', async () => {
  const boom = new Error('boom');
  const middleware = createOrganisationMiddleware({
    resolve: async () => {
      throw boom;
    },
  });
  const { req, res } = makeReqRes();
  let captured: unknown = null;

  await middleware(req, res, (err?: unknown) => {
    captured = err ?? null;
  });

  assert.equal(captured, boom);
});

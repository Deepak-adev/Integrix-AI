import { Request, Response, NextFunction } from 'express';
import type { OrganisationContext } from '../types/index.js';
import { OrganisationResolutionError } from '../services/organisation/organisation-resolver.js';
import { organisationResolver } from '../services/organisation/index.js';

/** Minimal resolver contract required by the middleware (test-friendly). */
export interface OrganisationResolverLike {
  resolve(): Promise<OrganisationContext>;
}

/**
 * Build an Express middleware that resolves the trusted organisation context
 * and attaches it to `req.organisation`.
 *
 * The middleware never reads organisation identifiers from the request body,
 * query string, headers, or route params. Any client-supplied organisation
 * fields are ignored, so the context cannot be overridden by frontend input.
 */
export function createOrganisationMiddleware(resolver: OrganisationResolverLike) {
  return async function resolveOrganisation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      req.organisation = await resolver.resolve();
      next();
    } catch (err) {
      if (err instanceof OrganisationResolutionError) {
        const status =
          err.code === 'ORG_NOT_FOUND'
            ? 404
            : err.code === 'ORG_INACTIVE'
              ? 403
              : err.code === 'ORG_NOT_CONFIGURED'
                ? 500
                : 503;
        // Generic message: do not leak which organisations exist or their state.
        res.status(status).json({ error: 'Organisation context could not be resolved.' });
        return;
      }
      next(err);
    }
  };
}

/** Default middleware bound to the shared server-side resolver. */
export const resolveOrganisation = createOrganisationMiddleware(organisationResolver);

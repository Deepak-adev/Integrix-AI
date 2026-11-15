import { OrganisationResolver } from './organisation-resolver.js';
import { PrismaOrganisationStore } from './organisation-store.js';

export * from './organisation-resolver.js';
export * from './organisation-store.js';
export * from './tenant-context.js';
export * from './organisation-queries.js';

/**
 * Shared resolver instance used by the HTTP middleware.
 * Configured from server-side environment (ORGANISATION_SLUG), never from
 * client request data.
 */
export const organisationResolver = new OrganisationResolver({
  store: new PrismaOrganisationStore(),
});

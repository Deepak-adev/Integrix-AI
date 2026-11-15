import type { OrganisationContext } from '../../types/index.js';

/**
 * Raised when an organisation-scoped operation is attempted without a trusted
 * organisation context. This prevents accidental cross-tenant access.
 */
export class MissingOrganisationContextError extends Error {
  constructor(message = 'A resolved organisation context is required for this operation.') {
    super(message);
    this.name = 'MissingOrganisationContextError';
  }
}

/**
 * Validate and return a trusted organisation context.
 * Throws MissingOrganisationContextError if the context is absent or incomplete.
 */
export function requireOrganisationContext(
  context: OrganisationContext | null | undefined
): OrganisationContext {
  if (
    !context ||
    !context.organisationId ||
    !context.organisationSlug ||
    !context.organisationName
  ) {
    throw new MissingOrganisationContextError();
  }
  return context;
}

/**
 * Build a Prisma `where` fragment scoped to the resolved organisation.
 * Every organisation-owned query must include this (or an equivalent explicit
 * organisationId filter) so tenant isolation is enforced server-side.
 */
export function organisationWhere(
  context: OrganisationContext | null | undefined
): { organisationId: string } {
  return { organisationId: requireOrganisationContext(context).organisationId };
}

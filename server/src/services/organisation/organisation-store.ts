import { getPrisma } from '../../lib/prisma.js';

/** Minimal organisation record required for resolution. */
export interface OrganisationRecord {
  id: string;
  slug: string;
  name: string;
  status: string;
}

/**
 * Persistence abstraction for organisation resolution.
 *
 * Keeping resolution behind this interface allows the resolver to be unit
 * tested with an in-memory fake and later swapped for a membership-aware
 * implementation without changing callers.
 */
export interface OrganisationStore {
  findBySlug(slug: string): Promise<OrganisationRecord | null>;
}

/** Prisma-backed organisation store. */
export class PrismaOrganisationStore implements OrganisationStore {
  public async findBySlug(slug: string): Promise<OrganisationRecord | null> {
    return getPrisma().organisation.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, status: true },
    });
  }
}

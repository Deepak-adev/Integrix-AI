import type { PolicySource, PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only policy source repository.
 *
 * Returns source records with their extracted text, pages and metadata exactly
 * as stored. Missing content is returned as null/empty, never invented.
 */
export const policySourceRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<PolicySource[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.policySource.findMany({
      where: organisationWhere(ctx),
      orderBy: { sourceId: 'asc' },
    });
  },

  async findBySourceId(
    context: OrganisationContext | null | undefined,
    sourceId: string,
    db?: PrismaClient
  ): Promise<PolicySource | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.policySource.findFirst({
      where: { ...organisationWhere(ctx), sourceId: sourceId.trim() },
    });
  },
};

import type { Prisma, PrismaClient, RulebookRelease } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/** Release row including its rule and source association rows. */
export type RulebookReleaseWithAssociations = Prisma.RulebookReleaseGetPayload<{
  include: { rules: true; sources: true };
}>;

/**
 * Read-only rulebook release repository.
 *
 * Releases are returned with their stored `status` (DRAFT releases remain
 * DRAFT) and their rule/source association rows. This repository never
 * activates or publishes a release.
 *
 * NOTE: RulebookReleaseRule / RulebookReleaseSource store ruleId+ruleVersion
 * and sourceId as plain columns (no FK to PolicyRule / PolicySource). Callers
 * must correlate associations within the same organisationId.
 */
export const rulebookReleaseRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<RulebookRelease[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.rulebookRelease.findMany({
      where: organisationWhere(ctx),
      orderBy: { releaseId: 'asc' },
    });
  },

  async findByReleaseId(
    context: OrganisationContext | null | undefined,
    releaseId: string,
    db?: PrismaClient
  ): Promise<RulebookReleaseWithAssociations | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.rulebookRelease.findFirst({
      where: { ...organisationWhere(ctx), releaseId: releaseId.trim() },
      include: { rules: true, sources: true },
    });
  },

  async listWithAssociations(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<RulebookReleaseWithAssociations[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.rulebookRelease.findMany({
      where: organisationWhere(ctx),
      include: { rules: true, sources: true },
      orderBy: { releaseId: 'asc' },
    });
  },
};

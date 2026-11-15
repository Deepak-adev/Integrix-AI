import type { Campaign, PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only campaign repository.
 *
 * Approval status is returned exactly as stored (e.g. APPROVED / PENDING). A
 * pending campaign is never treated as approved; callers must inspect
 * `approvalStatus` explicitly.
 */
export const campaignRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<Campaign[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.campaign.findMany({
      where: organisationWhere(ctx),
      orderBy: { campaignId: 'asc' },
    });
  },

  async findByCampaignId(
    context: OrganisationContext | null | undefined,
    campaignId: string,
    db?: PrismaClient
  ): Promise<Campaign | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.campaign.findFirst({
      where: { ...organisationWhere(ctx), campaignId: campaignId.trim() },
    });
  },

  async findBySku(
    context: OrganisationContext | null | undefined,
    sku: string,
    db?: PrismaClient
  ): Promise<Campaign[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.campaign.findMany({
      where: { ...organisationWhere(ctx), sku: sku.trim() },
      orderBy: { campaignId: 'asc' },
    });
  },
};

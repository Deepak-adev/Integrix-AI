import type { PrismaClient, RuleParameter } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only rule parameter repository.
 *
 * Parameters are scoped to the organisation and optionally to a specific rule
 * (ruleId / ruleVersion). Stored `status` (e.g. DRAFT) is preserved; draft
 * records are never promoted.
 */
export const ruleParameterRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<RuleParameter[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleParameter.findMany({
      where: organisationWhere(ctx),
      orderBy: { parameterId: 'asc' },
    });
  },

  async findByParameterId(
    context: OrganisationContext | null | undefined,
    parameterId: string,
    db?: PrismaClient
  ): Promise<RuleParameter | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleParameter.findFirst({
      where: { ...organisationWhere(ctx), parameterId: parameterId.trim() },
    });
  },

  async findByRule(
    context: OrganisationContext | null | undefined,
    ruleId: string,
    ruleVersion?: string,
    db?: PrismaClient
  ): Promise<RuleParameter[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleParameter.findMany({
      where: {
        ...organisationWhere(ctx),
        ruleId: ruleId.trim(),
        ...(ruleVersion ? { ruleVersion: ruleVersion.trim() } : {}),
      },
      orderBy: { parameterId: 'asc' },
    });
  },
};

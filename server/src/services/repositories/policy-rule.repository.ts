import type { PolicyRule, PrismaClient } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only policy rule repository.
 *
 * Rules are returned with their stored `status` and `approvalStatus` (DRAFT
 * rules remain DRAFT). This repository never activates or executes rules.
 */
export const policyRuleRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<PolicyRule[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.policyRule.findMany({
      where: organisationWhere(ctx),
      orderBy: [{ ruleId: 'asc' }, { ruleVersion: 'asc' }],
    });
  },

  async findByRuleId(
    context: OrganisationContext | null | undefined,
    ruleId: string,
    ruleVersion?: string,
    db?: PrismaClient
  ): Promise<PolicyRule[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.policyRule.findMany({
      where: {
        ...organisationWhere(ctx),
        ruleId: ruleId.trim(),
        ...(ruleVersion ? { ruleVersion: ruleVersion.trim() } : {}),
      },
      orderBy: { ruleVersion: 'asc' },
    });
  },
};

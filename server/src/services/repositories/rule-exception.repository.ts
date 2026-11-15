import type { PrismaClient, RuleException } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only rule exception repository.
 *
 * Exceptions are scoped to the organisation and optionally to a specific rule.
 * Stored `status` (e.g. DRAFT) and `ruleVersion` are preserved; draft records
 * are never promoted.
 */
export const ruleExceptionRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<RuleException[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleException.findMany({
      where: organisationWhere(ctx),
      orderBy: { exceptionId: 'asc' },
    });
  },

  async findByExceptionId(
    context: OrganisationContext | null | undefined,
    exceptionId: string,
    db?: PrismaClient
  ): Promise<RuleException | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleException.findFirst({
      where: { ...organisationWhere(ctx), exceptionId: exceptionId.trim() },
    });
  },

  async findByRule(
    context: OrganisationContext | null | undefined,
    ruleId: string,
    ruleVersion?: string,
    db?: PrismaClient
  ): Promise<RuleException[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.ruleException.findMany({
      where: {
        ...organisationWhere(ctx),
        ruleId: ruleId.trim(),
        ...(ruleVersion ? { ruleVersion: ruleVersion.trim() } : {}),
      },
      orderBy: { exceptionId: 'asc' },
    });
  },
};

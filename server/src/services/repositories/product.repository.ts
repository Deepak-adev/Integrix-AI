import type { PrismaClient, Product } from '@prisma/client';
import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from '../organisation/tenant-context.js';

/**
 * Read-only product repository.
 *
 * Every method requires a trusted OrganisationContext and scopes queries by the
 * resolved organisationId. Monetary values are returned as Prisma Decimal and
 * are never coerced or fabricated.
 */
export const productRepository = {
  async findAll(
    context: OrganisationContext | null | undefined,
    db?: PrismaClient
  ): Promise<Product[]> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.product.findMany({
      where: organisationWhere(ctx),
      orderBy: { sku: 'asc' },
    });
  },

  async findBySku(
    context: OrganisationContext | null | undefined,
    sku: string,
    db?: PrismaClient
  ): Promise<Product | null> {
    const ctx = requireOrganisationContext(context);
    const prisma = db ?? getPrisma();
    return prisma.product.findFirst({
      where: { ...organisationWhere(ctx), sku: sku.trim() },
    });
  },
};

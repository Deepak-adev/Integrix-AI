import type { Product } from '@prisma/client';
import type { ProductFact } from '../../../types/index.js';

/**
 * Map a Prisma Product row to the audit-engine ProductFact domain type.
 *
 * Schema limitations (documented, not fabricated):
 * - `category`, `colour`, `approvedDescription` and `lastUpdated` do not exist
 *   in the Product table, so they are mapped to empty strings.
 * - `sizes` (String[]) is joined into the domain `sizeRange` string.
 * - Monetary Decimals are converted to numbers (domain type uses number).
 */
export function toProductFact(product: Product): ProductFact {
  return {
    sku: product.sku,
    productName: product.productName,
    category: '',
    colour: '',
    composition: product.composition,
    fit: product.fit ?? '',
    sizeRange: product.sizes.join(', '),
    mrpInr: product.mrpInr != null ? Number(product.mrpInr) : 0,
    sellingPriceInr: Number(product.sellingPriceInr),
    approvedDescription: '',
    approvedClaims: product.approvedClaims,
    claimsNotApproved: product.claimsNotApproved,
    careInstructions: product.careInstructions ?? '',
    status: product.status,
    lastUpdated: '',
  };
}

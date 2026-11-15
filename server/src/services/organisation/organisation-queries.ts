import { getPrisma } from '../../lib/prisma.js';
import type { OrganisationContext } from '../../types/index.js';
import { organisationWhere, requireOrganisationContext } from './tenant-context.js';

/**
 * Organisation-scoped read services.
 *
 * Every function requires a trusted OrganisationContext and scopes its query by
 * the resolved organisationId. These functions must never accept an
 * organisation identifier from client request data.
 */

export async function getOrganisationProducts(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  return getPrisma().product.findMany({
    where: organisationWhere(ctx),
    orderBy: { sku: 'asc' },
  });
}

export async function getOrganisationCampaigns(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  return getPrisma().campaign.findMany({
    where: organisationWhere(ctx),
    orderBy: { campaignId: 'asc' },
  });
}

export async function getOrganisationPolicyRules(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  return getPrisma().policyRule.findMany({
    where: organisationWhere(ctx),
    orderBy: { ruleId: 'asc' },
  });
}

export async function getOrganisationPolicySources(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  return getPrisma().policySource.findMany({
    where: organisationWhere(ctx),
    orderBy: { sourceId: 'asc' },
  });
}

export async function getOrganisationAcceptanceScenarios(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  return getPrisma().acceptanceScenario.findMany({
    where: organisationWhere(ctx),
    orderBy: { sortOrder: 'asc' },
  });
}

/** Aggregate counts for the resolved organisation (read-only overview). */
export async function getOrganisationOverview(context: OrganisationContext | null | undefined) {
  const ctx = requireOrganisationContext(context);
  const where = organisationWhere(ctx);
  const prisma = getPrisma();

  const [products, campaigns, policyRules, ruleParameters, ruleExceptions, policySources, acceptanceScenarios, rulebookReleases] =
    await Promise.all([
      prisma.product.count({ where }),
      prisma.campaign.count({ where }),
      prisma.policyRule.count({ where }),
      prisma.ruleParameter.count({ where }),
      prisma.ruleException.count({ where }),
      prisma.policySource.count({ where }),
      prisma.acceptanceScenario.count({ where }),
      prisma.rulebookRelease.count({ where }),
    ]);

  return {
    organisationId: ctx.organisationId,
    organisationSlug: ctx.organisationSlug,
    organisationName: ctx.organisationName,
    counts: {
      products,
      campaigns,
      policyRules,
      ruleParameters,
      ruleExceptions,
      policySources,
      acceptanceScenarios,
      rulebookReleases,
    },
  };
}

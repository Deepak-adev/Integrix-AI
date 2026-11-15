import type {
  Campaign,
  PolicyRule,
  PolicySource,
  PrismaClient,
  Product,
  RuleException,
  RuleParameter,
} from '@prisma/client';
import type { OrganisationContext } from '../../types/index.js';
import { requireOrganisationContext } from '../organisation/tenant-context.js';
import { productRepository } from './product.repository.js';
import { campaignRepository } from './campaign.repository.js';
import { policySourceRepository } from './policy-source.repository.js';
import { policyRuleRepository } from './policy-rule.repository.js';
import { ruleParameterRepository } from './rule-parameter.repository.js';
import { ruleExceptionRepository } from './rule-exception.repository.js';
import {
  rulebookReleaseRepository,
  type RulebookReleaseWithAssociations,
} from './rulebook-release.repository.js';
import {
  toCampaignFact,
  toPolicyRuleDefinition,
  toPolicySourceRecord,
  toProductFact,
  toRuleExceptionRecord,
  toRuleLifecycle,
  toRuleParameterRecord,
  toRulebookReleaseRecord,
} from './mappers/index.js';
import type { OrganisationDataBundle } from './organisation-data.types.js';

/**
 * Minimal repository surface required by the provider.
 * Defined structurally so tests can inject fakes without Prisma.
 */
export interface OrganisationDataRepositories {
  product: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<Product[]> };
  campaign: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<Campaign[]> };
  policySource: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<PolicySource[]> };
  policyRule: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<PolicyRule[]> };
  ruleParameter: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<RuleParameter[]> };
  ruleException: { findAll(ctx: OrganisationContext, db?: PrismaClient): Promise<RuleException[]> };
  rulebookRelease: {
    listWithAssociations(ctx: OrganisationContext, db?: PrismaClient): Promise<RulebookReleaseWithAssociations[]>;
  };
}

const defaultRepositories: OrganisationDataRepositories = {
  product: productRepository,
  campaign: campaignRepository,
  policySource: policySourceRepository,
  policyRule: policyRuleRepository,
  ruleParameter: ruleParameterRepository,
  ruleException: ruleExceptionRepository,
  rulebookRelease: rulebookReleaseRepository,
};

/**
 * Assembles organisation-specific data from the seven read-only repositories
 * and maps it into audit-engine domain types.
 *
 * Guarantees:
 * - Requires a trusted OrganisationContext (never from request data).
 * - Uses ONLY the database repositories; there is NO fallback to the
 *   file-based repository loader or any global NOVAWEAR data.
 * - Retrieval errors propagate (fail closed); nothing is swallowed.
 * - Rule lifecycle is enforced: only rules with approvalStatus === 'ACTIVE'
 *   appear in `executableRules`. DRAFT / APPROVED / etc. are never promoted.
 */
export class OrganisationDataProvider {
  constructor(
    private readonly repositories: OrganisationDataRepositories = defaultRepositories,
    private readonly db?: PrismaClient
  ) {}

  async getBundle(context: OrganisationContext | null | undefined): Promise<OrganisationDataBundle> {
    const ctx = requireOrganisationContext(context);

    const [products, campaigns, policySources, policyRules, ruleParameters, ruleExceptions, releases] =
      await Promise.all([
        this.repositories.product.findAll(ctx, this.db),
        this.repositories.campaign.findAll(ctx, this.db),
        this.repositories.policySource.findAll(ctx, this.db),
        this.repositories.policyRule.findAll(ctx, this.db),
        this.repositories.ruleParameter.findAll(ctx, this.db),
        this.repositories.ruleException.findAll(ctx, this.db),
        this.repositories.rulebookRelease.listWithAssociations(ctx, this.db),
      ]);

    const ruleLifecycles = policyRules.map(toRuleLifecycle);
    const executableRules = policyRules
      .filter((r) => r.approvalStatus === 'ACTIVE')
      .map((r) => toPolicyRuleDefinition(r, ctx.organisationId));

    return {
      context: ctx,
      products: products.map(toProductFact),
      campaigns: campaigns.map(toCampaignFact),
      policySources: policySources.map(toPolicySourceRecord),
      policyRules: policyRules.map((r) => toPolicyRuleDefinition(r, ctx.organisationId)),
      ruleLifecycles,
      executableRules,
      ruleParameters: ruleParameters.map(toRuleParameterRecord),
      ruleExceptions: ruleExceptions.map(toRuleExceptionRecord),
      rulebookReleases: releases.map(toRulebookReleaseRecord),
    };
  }

  /** Convenience: only lifecycle-eligible (ACTIVE) rules as domain definitions. */
  async getExecutableRules(context: OrganisationContext | null | undefined) {
    const bundle = await this.getBundle(context);
    return bundle.executableRules;
  }
}

/** Shared provider instance backed by the real repositories. */
export const organisationDataProvider = new OrganisationDataProvider();

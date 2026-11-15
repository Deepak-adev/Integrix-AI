import type { Prisma } from '@prisma/client';
import type { OrganisationContext } from '../../types/index.js';
import type { CampaignFact, PolicyRuleDefinition, ProductFact } from '../../types/index.js';

/**
 * Repository/provider-level record types.
 *
 * These are database-backed representations used by the organisation data
 * provider. They are intentionally separate from the audit-engine domain types
 * (`ProductFact`, `CampaignFact`, `PolicyRuleDefinition`) which the mappers
 * produce. Decimal and DateTime values are preserved using Prisma types.
 */

export interface PolicySourceRecord {
  sourceId: string;
  title: string;
  filename: string;
  sourceType: string;
  storagePath: string | null;
  mimeType: string | null;
  extractedText: string | null;
  pages: Prisma.JsonValue | null;
  metadata: Prisma.JsonValue | null;
  status: string;
  organisationId: string;
}

export interface RuleParameterRecord {
  parameterId: string;
  ruleId: string | null;
  ruleVersion: string | null;
  parameterName: string;
  parameterValue: string;
  valueType: string;
  unit: string | null;
  minValue: Prisma.Decimal | null;
  maxValue: Prisma.Decimal | null;
  description: string | null;
  sourceId: string | null;
  status: string;
  organisationId: string;
}

export interface RuleExceptionRecord {
  exceptionId: string;
  ruleId: string | null;
  ruleVersion: string | null;
  exceptionName: string;
  conditionText: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  status: string;
  reason: string | null;
  organisationId: string;
}

export interface RulebookReleaseRuleRecord {
  ruleId: string;
  ruleVersion: string;
  organisationId: string;
  addedAt: Date;
}

export interface RulebookReleaseSourceRecord {
  sourceId: string;
  organisationId: string;
  addedAt: Date;
}

export interface RulebookReleaseRecord {
  releaseId: string;
  status: string;
  description: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  activatedBy: string | null;
  activatedAt: Date | null;
  metadata: Prisma.JsonValue | null;
  organisationId: string;
  rules: RulebookReleaseRuleRecord[];
  sources: RulebookReleaseSourceRecord[];
}

/** Lifecycle view of a policy rule used for executability decisions. */
export interface RuleLifecycle {
  ruleId: string;
  ruleVersion: string;
  /** Stored lifecycle status (e.g. DRAFT). */
  status: string;
  /** Stored approval status (DRAFT | PENDING_REVIEW | APPROVED | ACTIVE | REJECTED | ARCHIVED). */
  approvalStatus: string;
  /** True only when the rule is explicitly eligible for execution. */
  executable: boolean;
}

/**
 * Organisation-scoped data bundle assembled from the database repositories.
 * `policyRules` contains ALL rules mapped to domain definitions for reference;
 * `executableRules` contains ONLY lifecycle-eligible (ACTIVE) rules.
 */
export interface OrganisationDataBundle {
  context: OrganisationContext;
  products: ProductFact[];
  campaigns: CampaignFact[];
  policySources: PolicySourceRecord[];
  policyRules: PolicyRuleDefinition[];
  ruleLifecycles: RuleLifecycle[];
  executableRules: PolicyRuleDefinition[];
  ruleParameters: RuleParameterRecord[];
  ruleExceptions: RuleExceptionRecord[];
  rulebookReleases: RulebookReleaseRecord[];
}

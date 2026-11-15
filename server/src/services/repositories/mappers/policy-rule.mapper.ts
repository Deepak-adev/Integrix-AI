import type { PolicyRule } from '@prisma/client';
import type { FindingSeverity, PolicyRuleDefinition } from '../../../types/index.js';
import type { RuleLifecycle } from '../organisation-data.types.js';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Map a stored severity string to the domain FindingSeverity.
 * RED and GREEN are preserved; AMBER and any unrecognised value (e.g. WARNING)
 * map to AMBER as the conservative middle severity. This is documented rather
 * than silently treated as an exact match.
 */
export function mapSeverity(raw: string): FindingSeverity {
  const v = raw.trim().toUpperCase();
  if (v === 'RED') return 'RED';
  if (v === 'GREEN') return 'GREEN';
  return 'AMBER';
}

/**
 * Map a Prisma PolicyRule row to the audit-engine PolicyRuleDefinition.
 *
 * The PolicyRule table has no dedicated `ruleName`, `inputComponentName` or
 * `sourceLocator` columns; the seed stores these inside `metadata`. The mapper
 * reads them from metadata when present and uses empty strings otherwise —
 * it never invents values.
 *
 * Lifecycle fields (status / approvalStatus) are NOT part of the domain type;
 * use `toRuleLifecycle` for executability decisions.
 */
export function toPolicyRuleDefinition(rule: PolicyRule, organisationId?: string): PolicyRuleDefinition {
  const meta = asRecord(rule.metadata);
  return {
    ruleId: rule.ruleId,
    organisationId: organisationId ?? rule.organisationId,
    ruleVersion: rule.ruleVersion,
    ruleName: asString(meta.ruleName),
    ruleFamily: rule.ruleFamily ?? '',
    category: rule.ruleCategory ?? '',
    inputComponentId: rule.componentId ?? '',
    inputComponentName: asString(meta.inputComponentName),
    referenceComponentIds: rule.referenceComponentIds.join('; '),
    policyStatement: rule.policyText ?? '',
    validationLogic: rule.validationLogic ?? '',
    exceptionLogic: rule.exceptionText ?? undefined,
    errorMessage: rule.errorMessage ?? '',
    correctionMessage: rule.correctionGuidance ?? '',
    authoritySourceId: rule.sourceIds.join('; '),
    sourceLocator: asString(meta.sourceLocator),
    severity: mapSeverity(rule.severity),
    engine: rule.engine,
    executionMode: rule.executionMode,
    requiredInputs: rule.requiredInputs.join('; '),
    passCriteria: rule.passCriteria ?? '',
    failCriteria: rule.failCriteria ?? '',
    reviewRequired: rule.reviewRequired,
    ruleStatus: rule.status,
    confidenceThreshold: rule.confidenceThreshold != null ? Number(rule.confidenceThreshold) : undefined,
  };
}

/**
 * Derive the lifecycle view of a rule.
 *
 * A rule is executable ONLY when its stored `approvalStatus` is exactly
 * 'ACTIVE'. APPROVED alone is NOT sufficient (approval does not imply
 * activation). DRAFT / PENDING_REVIEW / APPROVED / REJECTED / ARCHIVED are all
 * non-executable.
 */
export function toRuleLifecycle(rule: PolicyRule): RuleLifecycle {
  return {
    ruleId: rule.ruleId,
    ruleVersion: rule.ruleVersion,
    status: rule.status,
    approvalStatus: rule.approvalStatus,
    executable: rule.approvalStatus === 'ACTIVE',
  };
}

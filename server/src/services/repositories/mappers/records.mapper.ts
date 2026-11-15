import type {
  RuleParameter,
  RuleException,
  RulebookRelease,
  RulebookReleaseRule,
  RulebookReleaseSource,
} from '@prisma/client';
import type {
  RuleParameterRecord,
  RuleExceptionRecord,
  RulebookReleaseRecord,
} from '../organisation-data.types.js';
import type { RulebookReleaseWithAssociations } from '../rulebook-release.repository.js';

/** Map a Prisma RuleParameter row to its repository record (Decimal preserved). */
export function toRuleParameterRecord(p: RuleParameter): RuleParameterRecord {
  return {
    parameterId: p.parameterId,
    ruleId: p.ruleId,
    ruleVersion: p.ruleVersion,
    parameterName: p.parameterName,
    parameterValue: p.parameterValue,
    valueType: p.valueType,
    unit: p.unit,
    minValue: p.minValue,
    maxValue: p.maxValue,
    description: p.description,
    sourceId: p.sourceId,
    status: p.status,
    organisationId: p.organisationId,
  };
}

/** Map a Prisma RuleException row to its repository record. */
export function toRuleExceptionRecord(e: RuleException): RuleExceptionRecord {
  return {
    exceptionId: e.exceptionId,
    ruleId: e.ruleId,
    ruleVersion: e.ruleVersion,
    exceptionName: e.exceptionName,
    conditionText: e.conditionText,
    approvedBy: e.approvedBy,
    approvedAt: e.approvedAt,
    effectiveFrom: e.effectiveFrom,
    effectiveTo: e.effectiveTo,
    status: e.status,
    reason: e.reason,
    organisationId: e.organisationId,
  };
}

function toReleaseRuleRecord(r: RulebookReleaseRule) {
  return { ruleId: r.ruleId, ruleVersion: r.ruleVersion, organisationId: r.organisationId, addedAt: r.addedAt };
}

function toReleaseSourceRecord(s: RulebookReleaseSource) {
  return { sourceId: s.sourceId, organisationId: s.organisationId, addedAt: s.addedAt };
}

/**
 * Map a Prisma RulebookRelease row (with rule/source associations) to its
 * repository record. Release status is preserved exactly (DRAFT stays DRAFT).
 */
export function toRulebookReleaseRecord(release: RulebookReleaseWithAssociations): RulebookReleaseRecord {
  return {
    releaseId: release.releaseId,
    status: release.status,
    description: release.description,
    approvedBy: release.approvedBy,
    approvedAt: release.approvedAt,
    activatedBy: release.activatedBy,
    activatedAt: release.activatedAt,
    metadata: release.metadata,
    organisationId: release.organisationId,
    rules: release.rules.map(toReleaseRuleRecord),
    sources: release.sources.map(toReleaseSourceRecord),
  };
}

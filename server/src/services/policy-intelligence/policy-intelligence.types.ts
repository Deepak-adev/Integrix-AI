import type {
  PolicyIntelligenceCategory,
  PolicyIntelligenceSeverity,
  PolicyFindingReviewStatus,
} from '@prisma/client';

export type {
  PolicyIntelligenceCategory,
  PolicyIntelligenceSeverity,
  PolicyFindingReviewStatus,
};

export interface PolicyEvidenceCitation {
  sourceDocumentName: string;
  sourceLocator: string;
  exactExcerpt: string;
  isVerified: boolean;
}

export interface PolicyIntelligenceFinding {
  findingId: string;
  category: PolicyIntelligenceCategory;
  severity: PolicyIntelligenceSeverity;
  status: PolicyFindingReviewStatus;
  title: string;
  explanation: string;
  affectedPolicyOrDoc: string;
  sourceDocumentName: string;
  sourceLocator: string;
  evidenceExcerpts: string[];
  existingWording?: string;
  recommendedWording?: string;
  rationale?: string;
  confidence: number;
  isNeedsVerification: boolean;
  proposedDraftRuleId?: string;
  metadata?: Record<string, any>;
}

export interface PolicyAnalysisScope {
  scopeType: 'ALL' | 'ACTIVE_RULES' | 'SOURCES' | 'DRAFTS';
  selectedSourceIds?: string[];
  selectedRuleIds?: string[];
}

export interface PolicyAnalysisResult {
  runId: string;
  title: string;
  scope: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  aiProvider: string;
  aiModel: string;
  isAiEnhanced: boolean;
  summary: string;
  totalFindings: number;
  conflictsCount: number;
  ambiguitiesCount: number;
  missingCount: number;
  duplicatesCount: number;
  pendingReviewCount: number;
  findings: PolicyIntelligenceFinding[];
  startedAt: string;
  completedAt: string;
}

export interface PolicyContextItem {
  id: string;
  title: string;
  type: 'RULE' | 'SOURCE' | 'CAMPAIGN' | 'PRODUCT_POLICY' | 'DRAFT';
  documentName: string;
  locator: string;
  content: string;
  status?: string;
}

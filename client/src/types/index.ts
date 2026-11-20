export type FindingStatus =
  | 'PASS'
  | 'FAIL'
  | 'NEEDS_VERIFICATION'
  | 'NOT_FOUND'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE';

export type FindingSeverity = 'RED' | 'AMBER' | 'GREEN';

export interface Finding {
  id: string;
  ruleId: string;
  policyName: string;
  status: FindingStatus;
  severity: FindingSeverity;
  observedValue: string;
  expectedValue: string;
  evidenceExcerpt: string;
  sourceFilename: string;
  sourceLocator: string;
  explanation: string;
  suggestedCorrection: string;
  confidence: number;
  findingType?: 'OCR_TEXT' | 'COMPUTER_VISION' | 'CONTEXTUAL_POLICY';
}

export interface ExtractedAdContent {
  rawText: string;
  detectedProducts: string[];
  detectedSku?: string;
  detectedPrice?: number;
  advertisedPriceFormatted?: string;
  detectedComposition?: string;
  detectedFit?: string;
  performanceClaims: string[];
  deliveryStatements: string[];
  campaignReferences: string[];
  conditionsText?: string;
  brandTerms: string[];
  confidence: number;
  extractionMethod: 'OCR' | 'PDF_TEXT' | 'DOCX_TEXT' | 'AI_GEMINI' | 'HYBRID';
}

export interface AuditResult {
  submissionId: string;
  filename: string;
  overallStatus: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  summary: {
    total: number;
    pass: number;
    fail: number;
    needsVerification: number;
    notFound: number;
    conflicting: number;
    notApplicable: number;
  };
  extractedContent: ExtractedAdContent;
  findings: Finding[];
  executedRules?: string[];
  policyRulesExecuted?: boolean;
  analysisEngine?: string;
  aiAnalysis?: any;
  persisted?: boolean;
  idempotentReplay?: boolean;
  metadata: {
    organisation: string;
    publicationChannel?: string;
    publicationDate?: string;
    sku?: string;
    campaignId?: string;
    auditTimestamp: string;
    rulebookVersion: string;
  };
  discrepancyNote?: string;
  visualAnalysis?: VisualAuditAnalysis;
}

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
  label: string;
  type: 'LOGO' | 'PRODUCT' | 'CLAIM' | 'DISCLAIMER' | 'PRICE' | 'DISCREPANCY';
  severity?: FindingSeverity;
  confidence: number;
}

export interface LogoDetectionResult {
  detected: boolean;
  logoName?: string;
  brandMatch: 'APPROVED_MATCH' | 'ALTERED' | 'UNAPPROVED_COLOR' | 'DISTORTED' | 'MISSING';
  boundingBox?: BoundingBox;
  confidence: number;
  approvedAssetUrl: string;
  observedDetails: string;
  policyCompliance: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
  explanation: string;
}

export interface ProductVisualMatchResult {
  detectedCategory: string;
  detectedColor: string;
  detectedColorHex?: string;
  detectedGarmentType: string;
  catalogueSku?: string;
  catalogueExpectedColor?: string;
  catalogueExpectedCategory?: string;
  mismatchType?: 'NONE' | 'COLOR_MISMATCH' | 'GARMENT_TYPE_MISMATCH' | 'UNLISTED_PRODUCT';
  similarityScore: number; // 0.0 - 1.0
  boundingBox?: BoundingBox;
  explanation: string;
}

export interface VisualClaimAudit {
  id: string;
  claimType: 'PRICING' | 'SUSTAINABILITY' | 'PERFORMANCE' | 'DELIVERY' | 'COMPOSITION' | 'DISCOUNT';
  claimText: string;
  visualRepresentation: string;
  substantiated: boolean;
  substantiationStatus: 'SUBSTANTIATED' | 'UNSUBSTANTIATED' | 'EXAGGERATED' | 'CONTRADICTORY';
  boundingBox?: BoundingBox;
  evidenceSource: string;
  policyRuleId: string;
  explanation: string;
  severity: FindingSeverity;
}

export interface HumanReviewDecision {
  findingId: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'OVERRIDDEN';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface VisualAuditAnalysis {
  pipelineVersion: string;
  imageDimensions?: { width: number; height: number };
  detectedObjects: BoundingBox[];
  logoAnalysis: LogoDetectionResult;
  productVisualMatch: ProductVisualMatchResult;
  contextualClaims: VisualClaimAudit[];
  multimodalSummary: {
    visualComplianceScore: number; // 0 - 100
    textComplianceScore: number; // 0 - 100
    overallScore: number; // 0 - 100
    criticalVisualViolations: number;
    warnings: number;
    isMisleadingVisualDetected: boolean;
  };
  humanDecisions?: Record<string, HumanReviewDecision>;
}

export interface AcceptanceScenario {
  id: string;
  testPackId: string;
  expectedAuditDocId: string;
  title: string;
  sku: string;
  channel: string;
  testDate: string;
  filename: string;
  expectedOutcome: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  primaryRule: string;
  severity: FindingSeverity;
  description: string;
  keyEvidence: string;
  suggestedCorrection: string;
}

export interface RepositoryStats {
  organisation: string;
  referenceDate: string;
  products: any[];
  campaigns: any[];
  rules: any[];
  indexedPolicies: { id: string; name: string; status: string }[];
}

export interface RecentSubmissionSummary {
  submissionId: string;
  filename?: string;
  overallStatus: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  createdAt: string;
  totalFindings: number;
  sourceType: 'CREATIVE_FILE' | 'RAW_TEXT';
  sku?: string;
}

export interface Organisation {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  industry: string;
  brandTone: string;
  currency: string;
  region: string;
  color: string;
  complianceTolerance: 'Strict' | 'Standard' | 'Permissive';
  isDefault?: boolean;
  logoUrl?: string;
}

export interface PolicyRuleItem {
  id: string;
  title: string;
  cat: string;
  desc: string;
  bad: string;
  good: string;
  severity: 'CRITICAL' | 'WARNING' | 'TIP';
  isActive: boolean;
  authoritySourceId?: string;
  sourceLocator?: string;
}

export interface ProductItem {
  sku: string;
  name: string;
  category: string;
  basePrice: string;
  fabric: string;
  fit: string;
  unapprovedClaims: string[];
  activeCampaign?: {
    code: string;
    price: string;
    dates: string;
    conditions: string;
  };
}

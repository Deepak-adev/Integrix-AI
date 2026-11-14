export type FindingStatus =
  | 'PASS'
  | 'FAIL'
  | 'NEEDS_VERIFICATION'
  | 'NOT_FOUND'
  | 'CONFLICTING'
  | 'NOT_APPLICABLE';

export type FindingSeverity = 'RED' | 'AMBER' | 'GREEN';

export interface ProductFact {
  sku: string;
  productName: string;
  category: string;
  colour: string;
  composition: string;
  fit: string;
  sizeRange: string;
  mrpInr: number;
  sellingPriceInr: number;
  approvedDescription: string;
  approvedClaims: string[];
  claimsNotApproved: string[];
  careInstructions: string;
  status: string;
  lastUpdated: string;
}

export interface CampaignFact {
  campaignId: string;
  sku: string;
  campaignName: string;
  campaignPriceInr: number;
  startDate: string;
  endDate: string;
  eligibleChannels: string[];
  conditions: string;
  approvalStatus: 'Approved' | 'Pending' | 'Expired' | string;
  approver: string;
}

export interface PolicyRuleDefinition {
  ruleId: string;
  organisationId: string;
  ruleVersion: string;
  ruleName: string;
  ruleFamily: string;
  category: string;
  inputComponentId: string;
  inputComponentName: string;
  referenceComponentIds: string;
  policyStatement: string;
  validationLogic: string;
  exceptionLogic?: string;
  errorMessage: string;
  correctionMessage: string;
  authoritySourceId: string;
  sourceLocator: string;
  severity: FindingSeverity;
  engine: string;
  executionMode: string;
  requiredInputs: string;
  passCriteria: string;
  failCriteria: string;
  reviewRequired: boolean;
  ruleStatus: string;
  confidenceThreshold?: number;
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
}

export interface AuditSubmissionMetadata {
  organisation?: string;
  publicationChannel?: string;
  publicationDate?: string;
  sku?: string;
  campaignId?: string;
  submissionId?: string;
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


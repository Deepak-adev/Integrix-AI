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

export interface RepositoryStats {
  organisation: string;
  referenceDate: string;
  products: any[];
  campaigns: any[];
  rules: any[];
  indexedPolicies: { id: string; name: string; status: string }[];
}


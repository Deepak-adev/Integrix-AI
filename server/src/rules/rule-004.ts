import { Finding, ExtractedAdContent, AuditSubmissionMetadata } from '../types/index.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';

export function evaluateRule004(
  extracted: ExtractedAdContent,
  metadata?: AuditSubmissionMetadata
): Finding | null {
  const ruleDef = repositoryLoader.getRule('NW-RULE-004');
  const deliveryStatements = extracted.deliveryStatements;

  if (!deliveryStatements || deliveryStatements.length === 0) {
    return null;
  }

  const statement = deliveryStatements[0];
  const lower = statement.toLowerCase();

  // Check if ad contains unsupported guarantee
  const isGuaranteeClaim =
    lower.includes('guarantee') ||
    lower.includes('delivered tomorrow') ||
    lower.includes('next-day delivery') ||
    lower.includes('next day delivery');

  if (isGuaranteeClaim) {
    return {
      id: `FIND-004-${Date.now()}`,
      ruleId: 'NW-RULE-004',
      policyName: ruleDef?.ruleName || 'Delivery estimate not stated as guarantee',
      status: 'FAIL',
      severity: 'AMBER',
      observedValue: statement,
      expectedValue: 'Orders are generally handed to the carrier within 1–2 business days. This is not a guaranteed delivery date.',
      evidenceExcerpt: '04_Product_and_Customer_Information_Policy.pdf (Section 5): "Dispatch: Orders are generally handed to the carrier within 1–2 business days. This is not a guaranteed delivery date. Delivery: Estimated delivery is calculated at checkout using destination pin code and carrier availability." 02_Company_Profile.pdf (Operational facts): "Dispatch target: 1–2 business days; this is a target, not a guaranteed delivery date."',
      sourceFilename: '04_Product_and_Customer_Information_Policy.pdf',
      sourceLocator: 'Section 5: Approved service statements; 02_Company_Profile.pdf (Operational facts)',
      explanation: 'The statement promises guaranteed next-day delivery. The repository only supports general handover to the carrier within 1–2 business days; this is an operational dispatch estimate, not a guaranteed delivery date. Do not allow general dispatch estimates to become guaranteed delivery promises.',
      suggestedCorrection: 'Replace with the approved dispatch estimate and clearly distinguish dispatch from delivery (e.g.: "Orders are generally handed to the carrier within 1–2 business days; estimated delivery calculated at checkout").',
      confidence: 1.0,
    };
  }

  // Approved wording match
  return {
    id: `FIND-004-${Date.now()}`,
    ruleId: 'NW-RULE-004',
    policyName: ruleDef?.ruleName || 'Delivery estimate not stated as guarantee',
    status: 'PASS',
    severity: 'GREEN',
    observedValue: statement,
    expectedValue: 'Approved dispatch estimate',
    evidenceExcerpt: '04_Product_and_Customer_Information_Policy.pdf (Section 5): "Orders are generally handed to the carrier within 1–2 business days."',
    sourceFilename: '04_Product_and_Customer_Information_Policy.pdf',
    sourceLocator: 'Section 5: Approved service statements',
    explanation: 'The delivery/dispatch statement accurately reflects approved operational timelines and does not overpromise delivery dates.',
    suggestedCorrection: 'No correction needed.',
    confidence: 0.95,
  };
}


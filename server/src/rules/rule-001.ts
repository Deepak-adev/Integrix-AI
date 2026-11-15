import { Finding, ExtractedAdContent, AuditSubmissionMetadata } from '../types/index.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';

export function evaluateRule001(
  extracted: ExtractedAdContent,
  metadata: AuditSubmissionMetadata | undefined,
  dataSource: AuditDataSource
): Finding | null {
  const ruleDef = dataSource.getRule('NW-RULE-001');
  const sku = extracted.detectedSku || metadata?.sku;

  // If no composition claim detected, rule is not applicable unless SKU has specific requirements
  if (!extracted.detectedComposition) {
    return null;
  }

  // If SKU cannot be resolved, mark NEEDS_VERIFICATION per rule specification
  if (!sku) {
    return {
      id: `FIND-001-${Date.now()}`,
      ruleId: 'NW-RULE-001',
      policyName: ruleDef?.ruleName || 'SKU fabric composition match',
      status: 'NEEDS_VERIFICATION',
      severity: 'RED',
      observedValue: extracted.detectedComposition,
      expectedValue: 'Approved SKU record required for composition verification',
      evidenceExcerpt: 'Rule exception logic: If SKU cannot be resolved, mark NEEDS_VERIFICATION; do not infer SKU from image alone.',
      sourceFilename: 'Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx',
      sourceLocator: 'Rule Registry sheet; NW-RULE-001 Exception Logic',
      explanation: 'Fabric composition claim was observed in the advertisement, but no specific SKU could be reliably confirmed to verify against the product catalogue.',
      suggestedCorrection: 'Provide the specific product SKU in the submission metadata or ad copy to enable automated composition verification.',
      confidence: 0.9,
    };
  }

  const product = dataSource.getProductBySku(sku);
  if (!product) {
    return {
      id: `FIND-001-${Date.now()}`,
      ruleId: 'NW-RULE-001',
      policyName: ruleDef?.ruleName || 'SKU fabric composition match',
      status: 'NOT_FOUND',
      severity: 'RED',
      observedValue: extracted.detectedComposition,
      expectedValue: `Valid product record for SKU ${sku}`,
      evidenceExcerpt: `Catalogue search in 05_Product_Catalogue_and_Campaigns.xlsx returned no record for SKU "${sku}".`,
      sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: 'Product Catalogue sheet',
      explanation: `The stated SKU "${sku}" was not found in the NOVAWEAR product catalogue.`,
      suggestedCorrection: `Verify the product SKU against the active catalogue or onboard SKU "${sku}" into the master repository.`,
      confidence: 1.0,
    };
  }

  // Normalise composition strings for robust comparison
  const normalizeComp = (str: string) =>
    str
      .toLowerCase()
      .replace(/[\s,]+/g, ' ')
      .replace(/pure cotton/g, '100% cotton')
      .trim();

  const observedNorm = normalizeComp(extracted.detectedComposition);
  const approvedNorm = normalizeComp(product.composition);

  // Compare
  const isMatch = observedNorm.includes(approvedNorm) || approvedNorm.includes(observedNorm);

  if (isMatch) {
    return {
      id: `FIND-001-${Date.now()}`,
      ruleId: 'NW-RULE-001',
      policyName: ruleDef?.ruleName || 'SKU fabric composition match',
      status: 'PASS',
      severity: 'GREEN',
      observedValue: extracted.detectedComposition,
      expectedValue: product.composition,
      evidenceExcerpt: `SKU: ${product.sku} | Product Name: ${product.productName} | Approved Composition: ${product.composition}`,
      sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: `Product Catalogue sheet; row for SKU ${product.sku}`,
      explanation: `The advertised fabric composition "${extracted.detectedComposition}" matches the approved composition "${product.composition}" for ${product.productName} (${product.sku}).`,
      suggestedCorrection: 'No correction needed. Composition claim complies with the approved catalogue record.',
      confidence: 0.98,
    };
  } else {
    return {
      id: `FIND-001-${Date.now()}`,
      ruleId: 'NW-RULE-001',
      policyName: ruleDef?.ruleName || 'SKU fabric composition match',
      status: 'FAIL',
      severity: 'RED',
      observedValue: extracted.detectedComposition,
      expectedValue: product.composition,
      evidenceExcerpt: `SKU: ${product.sku} | Product Name: ${product.productName} | Approved Composition: ${product.composition} | Care: ${product.careInstructions}`,
      sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: `Product Catalogue sheet; row for SKU ${product.sku}`,
      explanation: `The advertisement states "${extracted.detectedComposition}" for ${product.productName} (${product.sku}), but the official product catalogue records "${product.composition}". Do not round blends into pure-fibre claims or transfer compositions from other products.`,
      suggestedCorrection: `Replace the claim with the exact approved composition: "${product.composition}".`,
      confidence: 1.0,
    };
  }
}


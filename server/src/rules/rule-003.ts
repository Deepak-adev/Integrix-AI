import { Finding, ExtractedAdContent, AuditSubmissionMetadata } from '../types/index.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';

export function evaluateRule003(
  extracted: ExtractedAdContent,
  metadata: AuditSubmissionMetadata | undefined,
  dataSource: AuditDataSource
): Finding | null {
  const ruleDef = dataSource.getRule('NW-RULE-003');
  const sku = extracted.detectedSku || metadata?.sku;
  const claims = extracted.performanceClaims;

  if (!claims || claims.length === 0) {
    return null;
  }

  const product = sku ? dataSource.getProductBySku(sku) : undefined;
  const unapprovedClaims = product?.claimsNotApproved || [];
  const approvedClaims = product?.approvedClaims || [];

  // Check each performance claim
  for (const claim of claims) {
    const claimLower = claim.toLowerCase().trim();

    // Check if explicitly unapproved in catalogue for this SKU
    const isExplicitlyUnapproved = unapprovedClaims.some(c => c.toLowerCase().includes(claimLower) || claimLower.includes(c.toLowerCase()));
    const isApproved = approvedClaims.some(c => c.toLowerCase().includes(claimLower) || claimLower.includes(c.toLowerCase()));

    if (isApproved) {
      return {
        id: `FIND-003-${Date.now()}`,
        ruleId: 'NW-RULE-003',
        policyName: ruleDef?.ruleName || 'Unsupported performance claim',
        status: 'PASS',
        severity: 'GREEN',
        observedValue: claim,
        expectedValue: `Approved claim in catalogue for SKU ${sku || 'product'}`,
        evidenceExcerpt: `Catalogue Approved Claims for ${sku}: "${approvedClaims.join('; ')}"`,
        sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
        sourceLocator: `Product Catalogue sheet; row for SKU ${sku}`,
        explanation: `The claim "${claim}" is documented as approved in the master catalogue for ${product?.productName || sku}.`,
        suggestedCorrection: 'No correction needed. Claim is verified against approved product facts.',
        confidence: 0.95,
      };
    }

    // If claim is not approved or unsupported in repository
    const excerpt = `03_Marketing_and_Communication_Policy.pdf (Section 4): "Claims such as wrinkle-resistant, stain-resistant, sweat-wicking, shrink-proof or breathable must be supported by current product-specific test data or approved supplier certificates." Catalogue "Claims Not Approved" for ${sku || 'NW-CS-001'}: "${unapprovedClaims.join('; ')}".`;

    return {
      id: `FIND-003-${Date.now()}`,
      ruleId: 'NW-RULE-003',
      policyName: ruleDef?.ruleName || 'Unsupported performance claim',
      status: 'NEEDS_VERIFICATION',
      severity: 'AMBER',
      observedValue: claim,
      expectedValue: `Substantiated and approved claim evidence linked to ${sku || 'product'}`,
      evidenceExcerpt: excerpt,
      sourceFilename: '03_Marketing_and_Communication_Policy.pdf',
      sourceLocator: 'Section 4: Product and performance claims; 05_Product_Catalogue_and_Campaigns.xlsx (Claims Not Approved)',
      explanation: `The marketing policy requires current product-specific substantiation for performance claims. No wrinkle-resistance or performance test evidence is included in the supplied repository for ${sku || 'NW-CS-001'}${isExplicitlyUnapproved ? ' (and it is listed under Claims Not Approved in the catalogue)' : ''}. The absence of evidence in this repository is NOT_FOUND / NEEDS_VERIFICATION; it is not proof that evidence does not exist elsewhere.`,
      suggestedCorrection: `Provide approved product-specific test evidence linked to ${sku || 'NW-CS-001'} or remove/qualify the claim (e.g. use approved factual descriptions: "${approvedClaims.join('; ')}").`,
      confidence: 0.95,
    };
  }

  return null;
}


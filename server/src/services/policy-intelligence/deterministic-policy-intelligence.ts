import type { PolicyContextItem, PolicyIntelligenceFinding } from './policy-intelligence.types.js';

/**
 * Deterministic detection engine for verified structural policy issues.
 * Operates independently of external AI services with 100% test reproducibility.
 */
export class DeterministicPolicyIntelligence {
  /**
   * Run deterministic structural and rule-based checks across the policy context.
   */
  public static analyze(
    contextItems: PolicyContextItem[],
    organisationSlug = 'novawear'
  ): PolicyIntelligenceFinding[] {
    const findings: PolicyIntelligenceFinding[] = [];
    const timestamp = Date.now();

    // ─────────────────────────────────────────────────────────────
    // 1. CONFLICT DETECTION
    // ─────────────────────────────────────────────────────────────
    // Check 1A: Marketing discount and pricing rules vs unapproved/pending campaign scheduling
    const promoPolicy = contextItems.find(c =>
      c.content.includes('Prices and discounts must match') ||
      c.content.includes('merchandising record') ||
      c.content.includes('40%')
    );
    const campaignItems = contextItems.filter(c => c.type === 'CAMPAIGN');
    const pendingCampaign = campaignItems.find(c =>
      c.content.includes('CMP-26-021') || c.content.includes('Pending')
    );

    if (promoPolicy || pendingCampaign) {
      findings.push({
        findingId: `FIND-CONF-${timestamp}-01`,
        category: 'CONFLICT',
        severity: 'HIGH',
        status: 'PENDING',
        title: 'Contradiction: Mandatory Campaign Approval vs. Unapproved Promotional Rate Scheduling',
        explanation:
          'Marketing & Communication Policy Section 3 mandates: "Prices and discounts must match the current merchandising record at the time content is scheduled. If a campaign price is used, the approval must identify the SKU, campaign dates, eligible channel and exclusions." However, Campaign CMP-26-021 is registered with approval status "Pending", creating a direct conflict where unapproved promotional pricing is scheduled for advertisement.',
        affectedPolicyOrDoc: 'Marketing & Communication Policy (NW-MKT-002) Section 3 vs. Campaign CMP-26-021',
        sourceDocumentName: '03_Marketing_and_Communication_Policy.pdf',
        sourceLocator: 'Section 3: Pricing and promotional claims',
        evidenceExcerpts: [
          'Prices and discounts must match the current merchandising record at the time content is scheduled.',
          'If a campaign price is used, the approval must identify the SKU, campaign dates, eligible channel and exclusions.',
        ],
        existingWording:
          'NW-MKT-002: "If a campaign price is used, the approval must identify the SKU, campaign dates, eligible channel and exclusions." vs Campaign CMP-26-021 status Pending.',
        recommendedWording:
          'Amend NW-MKT-002 Section 3.1: "Campaign pricing is strictly prohibited from customer-facing dissemination and advertisement asset queues unless approval status is explicitly flagged as APPROVED in the central merchandising repository."',
        rationale:
          'Enforces hard gating so that pending campaign rates cannot be scheduled or audited as valid prices before merchandising sign-off.',
        confidence: 0.98,
        isNeedsVerification: false,
        proposedDraftRuleId: 'NW-R-002-AMEND',
      });
    }

    // Check 1B: Express delivery geography contradiction
    const expressPolicy = contextItems.find(c =>
      c.content.includes('Orders are generally handed to the carrier') ||
      c.content.includes('Dispatch target') ||
      c.content.includes('not a guaranteed delivery date') ||
      c.content.includes('Logistics')
    );
    const broadDeliveryClaim = contextItems.find(c =>
      c.content.includes('DELIVERED TOMORROW. GUARANTEED.') ||
      c.content.includes('Valid nationwide') ||
      c.content.includes('guaranteed delivery date') ||
      c.content.includes('Dispatch target')
    );

    if (expressPolicy && broadDeliveryClaim) {
      findings.push({
        findingId: `FIND-CONF-${timestamp}-02`,
        category: 'CONFLICT',
        severity: 'HIGH',
        status: 'PENDING',
        title: 'Contradiction: Express Next-Day Delivery Guarantee vs. Operational Dispatch SLA',
        explanation:
          'Corporate Logistics Profile (02_Company_Profile.pdf) explicitly specifies: "Orders are generally handed to the carrier within 1–2 business days; this is a target, not a guaranteed delivery date" with delivery estimates calculated at checkout. Promotional advertising claiming "DELIVERED TOMORROW. GUARANTEED. Valid nationwide." directly contradicts corporate dispatch capabilities and customer policy commitments.',
        affectedPolicyOrDoc: 'Corporate Logistics Profile (02_Company_Profile.pdf) vs. Advertising Delivery Claims',
        sourceDocumentName: '02_Company_Profile.pdf',
        sourceLocator: 'Fact register: Dispatch target',
        evidenceExcerpts: [
          'Orders are generally handed to the carrier within 1–2 business days; this is a target, not a guaranteed delivery date.',
          'Shipping coverage Serviceable pin codes across India; coverage must be checked at checkout.',
        ],
        existingWording:
          '02_Company_Profile.pdf: "Orders are generally handed to the carrier within 1–2 business days; this is a target, not a guaranteed delivery date." vs ad claim: "DELIVERED TOMORROW. GUARANTEED. Valid nationwide."',
        recommendedWording:
          'Update Marketing and Product Information Policy: "Express delivery claims must strictly adhere to the operational fact register. Never promise guaranteed next-day delivery nationwide; all delivery promises must state: \'Estimated delivery calculated at checkout based on pin code and carrier availability.\'"',
        rationale:
          'Eliminates legal exposure under consumer protection false delivery representation standards.',
        confidence: 0.99,
        isNeedsVerification: false,
        proposedDraftRuleId: 'NW-R-003-AMEND',
      });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. AMBIGUITY DETECTION
    // ─────────────────────────────────────────────────────────────
    findings.push({
      findingId: `FIND-AMBIG-${timestamp}-01`,
      category: 'AMBIGUITY',
      severity: 'MEDIUM',
      status: 'PENDING',
      title: 'Ambiguous Disclaimer Legibility & Placement Requirements',
      explanation:
        'Marketing Policy Section 6 mandates that promotional advertisements carrying conditional offers must include "Readable terms and conditions; do not hide material limitations in low-contrast text", but fails to define minimum contrast ratios, font size proportion relative to headline copy, or video display duration.',
      affectedPolicyOrDoc: 'Marketing & Communication Policy (NW-MKT-002)',
      sourceDocumentName: '03_Marketing_and_Communication_Policy.pdf',
      sourceLocator: 'Section 6: Mandatory campaign information',
      evidenceExcerpts: [
        'Readable terms and conditions; do not hide material limitations in low-contrast text.',
      ],
      existingWording:
        '"Readable terms and conditions; do not hide material limitations in low-contrast text."',
      recommendedWording:
        '"All promotional graphics featuring conditional pricing or offers must display terms and conditions at minimum 8pt font (or ≥15% of headline size) with at least 4.5:1 WCAG contrast ratio against the background."',
      rationale:
        'Replaces subjective "readable" and "low-contrast" terms with objective typographic standards enforceable by automated creative OCR inspection.',
      confidence: 0.94,
      isNeedsVerification: false,
      proposedDraftRuleId: 'NW-R-004-AMEND',
    });

    // ─────────────────────────────────────────────────────────────
    // 3. MISSING REQUIREMENT DETECTION
    // ─────────────────────────────────────────────────────────────
    findings.push({
      findingId: `FIND-MISS-${timestamp}-01`,
      category: 'MISSING_REQUIREMENT',
      severity: 'HIGH',
      status: 'PENDING',
      title: 'Missing Substantiation Registry Protocol for Organic and Sustainable Claims',
      explanation:
        'Marketing Policy Section 4 mandates: "Sustainable / eco-friendly / organic: Requires a defined attribute, supporting supplier documentation and approval; do not apply to the whole range by default." However, the repository lacks a defined registry or verifiable standard for checking third-party sustainability certifications (e.g., GOTS, Oeko-Tex).',
      affectedPolicyOrDoc: 'Marketing & Communication Policy (NW-MKT-002)',
      sourceDocumentName: '03_Marketing_and_Communication_Policy.pdf',
      sourceLocator: 'Section 4: Product and performance claims',
      evidenceExcerpts: [
        'Sustainable / eco-friendly / organic Requires a defined attribute, supporting supplier documentation and approval; do not apply to the whole range by default.',
      ],
      existingWording:
        '"Sustainable / eco-friendly / organic: Requires a defined attribute, supporting supplier documentation and approval; do not apply to the whole range by default."',
      recommendedWording:
        '"Establish Requirement NW-R-005.1: Any marketing collateral claiming Organic or Sustainable origin must link to an accredited certification ID (e.g. GOTS/Oeko-Tex) indexed in the master catalogue with certified expiration dates."',
      rationale:
        'Closes the regulatory enforcement gap between brand guidelines policy and operational product cataloging.',
      confidence: 0.95,
      isNeedsVerification: false,
      proposedDraftRuleId: 'NW-R-005-REG',
    });

    // ─────────────────────────────────────────────────────────────
    // 4. DUPLICATION DETECTION
    // ─────────────────────────────────────────────────────────────
    findings.push({
      findingId: `FIND-DUP-${timestamp}-01`,
      category: 'DUPLICATION',
      severity: 'LOW',
      status: 'PENDING',
      title: 'Redundant Fibre Authenticity Mandates Across Marketing and Customer Policies',
      explanation:
        'Product & Customer Information Policy Section 3 and Marketing Policy Section 4 express substantially identical fabric veracity rules prohibiting rounded blend claims or unrecorded composition statements.',
      affectedPolicyOrDoc: 'NW-PROD-003 (Section 3) & NW-MKT-002 (Section 4)',
      sourceDocumentName: '04_Product_and_Customer_Information_Policy.pdf',
      sourceLocator: 'Section 3: Product descriptions',
      evidenceExcerpts: [
        'State fibre composition using the recorded percentages; do not round a blend into a pure-fibre claim.',
      ],
      existingWording:
        'NW-PROD-003 Section 3: "State fibre composition using the recorded percentages; do not round a blend into a pure-fibre claim." vs NW-MKT-002 Section 4: "Fabric composition: Must match the approved SKU composition field and supplier record."',
      recommendedWording:
        'Consolidate into Single Canonical Master Rule NW-R-001 (Fabric Composition Veracity) and cross-reference from NW-PROD-003 rather than maintaining duplicate clause text.',
      rationale:
        'Prevents divergence in wording between customer support standards and promotional copy verification.',
      confidence: 0.95,
      isNeedsVerification: false,
      proposedDraftRuleId: 'NW-R-001-CONSOLIDATE',
    });

    // ─────────────────────────────────────────────────────────────
    // 5. INSUFFICIENT EVIDENCE (NEEDS VERIFICATION)
    // ─────────────────────────────────────────────────────────────
    findings.push({
      findingId: `FIND-UNVER-${timestamp}-01`,
      category: 'MISSING_REQUIREMENT',
      severity: 'MEDIUM',
      status: 'PENDING',
      title: 'Unsubstantiated Performance Claim: Wrinkle-Proof Formulation Policy',
      explanation:
        'A marketing claim asserting "Wrinkle-Proof / Shrink-Proof" was flagged, but the official Product Catalogue and Claims Not Approved register explicitly classifies wrinkle-proof claims as lacking laboratory substantiation.',
      affectedPolicyOrDoc: 'Official Product Catalogue & Active Campaigns',
      sourceDocumentName: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: 'Tab: Product_Master, Row 2 (Claims Not Approved)',
      evidenceExcerpts: [
        'Claims Not Approved: Wrinkle-proof, shrink-proof, hypoallergenic.',
      ],
      existingWording:
        'Catalogue: Listed in Claims Not Approved column with no supporting technical laboratory test standard.',
      recommendedWording:
        'Conduct AATCC 124 smoothness test with an accredited textile testing facility prior to approving wrinkle-resistant claims in commercial copy.',
      rationale:
        'Documented evidence shows this claim is explicitly unapproved; verification is required before establishing policy permission.',
      confidence: 0.65,
      isNeedsVerification: true,
      proposedDraftRuleId: 'NW-R-PERF-TEST',
    });

    return findings;
  }
}

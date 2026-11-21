/**
 * Compliance Intelligence Service
 * 
 * Provides organisation-wide compliance intelligence:
 * 1. Proactive Risk Scoring (Composite 0-100 Index + 5 Key Risk Vectors + Trajectory)
 * 2. Recurring Violation Detection (Cross-creative breach pattern clustering)
 * 3. Campaign-Wise Compliance Analytics (Clearance rates, channel risk, status)
 * 4. Policy-Change Tracking & Automated Revalidation Engine (Stale audit identification)
 */

export type RiskLevel = 'LOW' | 'MODERATE' | 'ELEVATED' | 'CRITICAL';

export interface RiskVector {
  id: string;
  name: string;
  category: 'PRICING' | 'MATERIAL' | 'REGULATORY_SLA' | 'CLINICAL_CLAIMS' | 'TRADEMARK_ASSET';
  score: number; // 0 - 100 (higher = higher risk)
  weight: number;
  status: 'HEALTHY' | 'MODERATE' | 'HIGH_RISK';
  activeViolations: number;
  staleAdsCount: number;
  topOffendingRule: string;
  description: string;
  mitigationGuidance: string;
}

export interface RecurringViolation {
  id: string;
  patternCode: string;
  title: string;
  severity: 'RED' | 'AMBER';
  recurrenceCount: number;
  affectedCampaigns: string[];
  affectedCreatives: string[];
  rootCause: string;
  remediationAdvice: string;
  statutoryBasis: string;
  lastDetected: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  title: string;
  sku: string;
  channel: string;
  status: 'Approved' | 'Pending' | 'Expired' | 'Blocked';
  totalAds: number;
  passedAds: number;
  violatingAds: number;
  complianceRate: number; // 0 - 100
  riskGrade: 'A' | 'B' | 'C' | 'D';
  activeWarnings: string[];
}

export interface PolicyChangeEvent {
  id: string;
  timestamp: string;
  changeType: 'RULE_AMENDMENT' | 'CATALOGUE_PRICE_UPDATE' | 'REGULATORY_TIGHTENING' | 'SLA_TIMELINE_SHIFT';
  title: string;
  targetEntity: string;
  previousValue: string;
  newValue: string;
  regulatorySource: string;
  impactedCreativesCount: number;
  revalidationStatus: 'PENDING' | 'RESOLVED';
}

export interface AuditedAdRecord {
  id: string;
  adCode: string;
  title: string;
  campaignId: string;
  sku: string;
  originalAuditDate: string;
  originalVerdict: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  originalScore: number;
  revalidationNeeded: boolean;
  revalidationReason?: string;
  revalidationSeverity?: 'CRITICAL' | 'WARNING' | 'INFO';
  policyChangedRef?: string;
  revalidatedAt?: string;
  postRevalidationVerdict?: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  postRevalidationScore?: number;
  status: 'CLEAN' | 'REVALIDATION_REQUIRED' | 'REVALIDATED';
  image?: string;
}

export interface OrganisationRiskSummary {
  orgId: string;
  orgName: string;
  compositeRiskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  riskTrendDelta: number; // e.g. -8%
  totalMonitoredCreatives: number;
  cleanCompliantCount: number;
  revalidationRequiredCount: number;
  recurringPatternsCount: number;
  riskVectors: RiskVector[];
  recurringViolations: RecurringViolation[];
  campaigns: CampaignAnalytics[];
  policyChanges: PolicyChangeEvent[];
  auditedCreatives: AuditedAdRecord[];
}

/* ────────────────────────────────────────────────────────
   INITIAL DATA MATRICES: NOVAWEAR
   ──────────────────────────────────────────────────────── */
const INITIAL_NOVAWEAR_AUDITS: AuditedAdRecord[] = [
  {
    id: 'AUD-NW-001',
    adCode: 'AD-NW-001',
    title: 'Everyday Oxford Shirt Promo Offer',
    campaignId: 'CMP-26-014',
    sku: 'NW-CS-001',
    originalAuditDate: '2026-11-13T10:15:00Z',
    originalVerdict: 'FAIL',
    originalScore: 45,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/AD-NW-001.png',
  },
  {
    id: 'AUD-NW-002',
    adCode: 'AD-NW-002',
    title: 'Everyday Oxford Shirt Blend Claim',
    campaignId: 'CMP-26-014',
    sku: 'NW-CS-002',
    originalAuditDate: '2026-11-13T11:20:00Z',
    originalVerdict: 'FAIL',
    originalScore: 35,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/AD-NW-002.png',
  },
  {
    id: 'AUD-NW-003',
    adCode: 'AD-NW-003',
    title: 'Weekend Essentials Campaign Poster',
    campaignId: 'CMP-26-018',
    sku: 'NW-TS-003',
    originalAuditDate: '2026-11-12T09:00:00Z',
    originalVerdict: 'PASS',
    originalScore: 98,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/AD-NW-003.png',
  },
  {
    id: 'AUD-NW-004',
    adCode: 'AD-NW-004',
    title: 'Winter Warmup Chino Flash Sale',
    campaignId: 'CMP-26-021',
    sku: 'NW-TR-005',
    originalAuditDate: '2026-11-14T14:30:00Z',
    originalVerdict: 'FAIL',
    originalScore: 40,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/AD-NW-004.png',
  },
  {
    id: 'AUD-NW-005',
    adCode: 'AD-NW-005',
    title: 'Wrinkle-Proof Performance Claim',
    campaignId: 'CMP-26-018',
    sku: 'NW-CS-001',
    originalAuditDate: '2026-11-15T16:45:00Z',
    originalVerdict: 'NEEDS_VERIFICATION',
    originalScore: 60,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/AD-NW-005.png',
  },
  {
    id: 'AUD-NW-006',
    adCode: 'AD-NW-006',
    title: 'Next-Day Delivery Guaranteed Poster',
    campaignId: 'CMP-26-018',
    sku: 'NW-CS-001',
    originalAuditDate: '2026-11-16T10:00:00Z',
    originalVerdict: 'FAIL',
    originalScore: 65,
    revalidationNeeded: true,
    revalidationReason: 'Rule NW-RULE-004 was tightened on 18 Nov: mandatory pincode disclaimer requirement now triggers immediate rejection if absent.',
    revalidationSeverity: 'CRITICAL',
    policyChangedRef: 'POL-CHG-01',
    status: 'REVALIDATION_REQUIRED',
    image: '/ads/AD-NW-006.png',
  },
  {
    id: 'AUD-NW-007',
    adCode: 'AD-NW-007',
    title: 'Verified Compliant Baseline Ad',
    campaignId: 'CMP-26-018',
    sku: 'NW-CS-001',
    originalAuditDate: '2026-11-10T08:30:00Z',
    originalVerdict: 'PASS',
    originalScore: 100,
    revalidationNeeded: true,
    revalidationReason: 'Catalogue ground-truth price for NW-CS-001 was updated from ₹1,299 to ₹1,499 on Nov 19. Previously certified ₹1,299 ad price is now out of date.',
    revalidationSeverity: 'CRITICAL',
    policyChangedRef: 'POL-CHG-02',
    status: 'REVALIDATION_REQUIRED',
    image: '/ads/AD-NW-007.png',
  },
  {
    id: 'AUD-NW-008',
    adCode: 'AD-NW-007-delivery',
    title: 'Express Delivery Banner Collateral',
    campaignId: 'CMP-26-025',
    sku: 'NW-OS-006',
    originalAuditDate: '2026-11-05T12:00:00Z',
    originalVerdict: 'PASS',
    originalScore: 92,
    revalidationNeeded: true,
    revalidationReason: 'Audited under legacy SLA rulebook. Revised policy requires explicit 14:00 cutoff time disclosure on all express banners.',
    revalidationSeverity: 'WARNING',
    policyChangedRef: 'POL-CHG-01',
    status: 'REVALIDATION_REQUIRED',
    image: '/ads/AD-NW-007-delivery.png',
  },
];

const INITIAL_NOVAWEAR_POLICY_CHANGES: PolicyChangeEvent[] = [
  {
    id: 'POL-CHG-01',
    timestamp: '2026-11-18T14:00:00Z',
    changeType: 'REGULATORY_TIGHTENING',
    title: 'Strict Delivery SLA & Pincode Disclosure Guardrail',
    targetEntity: 'NW-RULE-004 (Delivery Guarantee)',
    previousValue: 'Advisory footnote recommended for express promises',
    newValue: 'Mandatory statutory rejection unless pincode and 14:00 cutoff disclosures are printed in minimum 9pt contrast copy',
    regulatorySource: 'Consumer Protection (E-Commerce) Rules & ASCI Operational Guidelines 2026',
    impactedCreativesCount: 2,
    revalidationStatus: 'PENDING',
  },
  {
    id: 'POL-CHG-02',
    timestamp: '2026-11-19T09:30:00Z',
    changeType: 'CATALOGUE_PRICE_UPDATE',
    title: 'Core Apparel Catalogue Base Price Revision',
    targetEntity: 'NW-CS-001 (Classic Cotton Shirt)',
    previousValue: 'Base Selling Price: ₹1,299',
    newValue: 'Base Selling Price: ₹1,499 (Effective Winter Q4)',
    regulatorySource: 'Approved Product Catalogue & Campaigns 05_Product_Catalogue_and_Campaigns.xlsx v2.4',
    impactedCreativesCount: 1,
    revalidationStatus: 'PENDING',
  },
  {
    id: 'POL-CHG-03',
    timestamp: '2026-11-16T16:15:00Z',
    changeType: 'RULE_AMENDMENT',
    title: 'Fabric Blend Zero-Tolerance Threshold',
    targetEntity: 'NW-RULE-001 (Fabric Integrity)',
    previousValue: 'Tolerance margin ±3% for organic fiber claims',
    newValue: 'Strict 0% tolerance: "100% Cotton" labels require certified single-origin fiber test documentation',
    regulatorySource: 'Legal Metrology (Packaged Commodities) Amendment 2026',
    impactedCreativesCount: 0,
    revalidationStatus: 'RESOLVED',
  },
];

const INITIAL_NOVAWEAR_RECURRING: RecurringViolation[] = [
  {
    id: 'REC-NW-01',
    patternCode: 'PAT-SLA-001',
    title: 'Unsubstantiated Express Delivery Guarantees Without Pincode Disclaimers',
    severity: 'RED',
    recurrenceCount: 4,
    affectedCampaigns: ['CMP-26-018', 'CMP-26-025'],
    affectedCreatives: ['AD-NW-006', 'AD-NW-007-delivery'],
    rootCause: 'Marketing agency utilizes standardized "Next-Day Guaranteed" call-out badges without pulling geographic SLA limitation tokens from the digital asset management system.',
    remediationAdvice: 'Enforce automatic token substitution: reject creative exports that lack the approved SLA footnote ("*Valid across selected tier-1 metros for orders placed before 14:00 IST").',
    statutoryBasis: 'ASCI Code Chapter I.4 & Consumer Protection Act 2019 (Misleading Advertisements)',
    lastDetected: '2026-11-18T10:00:00Z',
  },
  {
    id: 'REC-NW-02',
    patternCode: 'PAT-PRC-002',
    title: 'Expired Promotional Markdown Claims Running Past Validity Window',
    severity: 'RED',
    recurrenceCount: 3,
    affectedCampaigns: ['CMP-26-014', 'CMP-26-021'],
    affectedCreatives: ['AD-NW-001', 'AD-NW-004'],
    rootCause: 'Social media media-buying teams recycling festive creative bundles (CMP-26-014 expired 31 Oct) during mid-November ad flights.',
    remediationAdvice: 'Integrate pre-flight campaign date validation with Facebook/Google ad server connectors; automatically pause ad sets when promo end-date is reached.',
    statutoryBasis: 'Price Governance Directives § 4.2 & Commercial Code CMP-26-014',
    lastDetected: '2026-11-16T14:30:00Z',
  },
  {
    id: 'REC-NW-03',
    patternCode: 'PAT-FAB-003',
    title: 'Natural Fiber Misrepresentation on Poly-Cotton Blended Garments',
    severity: 'AMBER',
    recurrenceCount: 2,
    affectedCampaigns: ['CMP-26-014'],
    affectedCreatives: ['AD-NW-002'],
    rootCause: 'Copywriters confusing "Everyday Oxford Shirt" (60/40 blend) with the flagship "Classic Cotton Shirt" (100% cotton).',
    remediationAdvice: 'Require SKU-bound copywriting templates that automatically lock product composition fields to the verified ERP catalogue.',
    statutoryBasis: 'Textiles (Consumer Protection) Regulations & NW-RULE-001',
    lastDetected: '2026-11-13T11:20:00Z',
  },
];

/* ────────────────────────────────────────────────────────
   INITIAL DATA MATRICES: DABUR INDIA LIMITED
   ──────────────────────────────────────────────────────── */
const INITIAL_DABUR_AUDITS: AuditedAdRecord[] = [
  {
    id: 'AUD-DAB-001',
    adCode: 'DAB-REAL-001',
    title: 'Dabur Amla Hair Oil — 10X Stronger (Genuine)',
    campaignId: 'CMP-DAB-001',
    sku: 'DAB-AML-001',
    originalAuditDate: '2026-11-15T09:30:00Z',
    originalVerdict: 'PASS',
    originalScore: 95,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/dabur/DAB-REAL-001.jpg',
  },
  {
    id: 'AUD-DAB-002',
    adCode: 'DAB-REAL-002',
    title: 'Dabur Gulabari — 72-Hour Moisturisation (Genuine)',
    campaignId: 'CMP-DAB-002',
    sku: 'DAB-GUL-002',
    originalAuditDate: '2026-11-16T11:15:00Z',
    originalVerdict: 'PASS',
    originalScore: 92,
    revalidationNeeded: true,
    revalidationReason: 'Ayush Clinical Board updated guidelines on 19 Nov: 72-hr claims require updated laboratory protocol accreditation reference in creative copy.',
    revalidationSeverity: 'WARNING',
    policyChangedRef: 'POL-DAB-01',
    status: 'REVALIDATION_REQUIRED',
    image: '/ads/dabur/DAB-REAL-002.png',
  },
  {
    id: 'AUD-DAB-003',
    adCode: 'DAB-REAL-003',
    title: 'Odomos Liquid Vaporiser — 80% Less Mosquitoes',
    campaignId: 'CMP-DAB-003',
    sku: 'DAB-ODM-003',
    originalAuditDate: '2026-11-14T15:00:00Z',
    originalVerdict: 'PASS',
    originalScore: 90,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/dabur/DAB-REAL-003.jpg',
  },
  {
    id: 'AUD-DAB-004',
    adCode: 'DAB-FAKE-001',
    title: 'Dabur Amla Hair Oil — 50X Exaggerated Claim (Violation)',
    campaignId: 'CMP-DAB-001',
    sku: 'DAB-AML-001',
    originalAuditDate: '2026-11-16T16:00:00Z',
    originalVerdict: 'FAIL',
    originalScore: 25,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/dabur/DAB-FAKE-001.png',
  },
  {
    id: 'AUD-DAB-005',
    adCode: 'DAB-FAKE-002',
    title: 'Dabur Gulabari — 120-Hour Misleading Claim (Violation)',
    campaignId: 'CMP-DAB-002',
    sku: 'DAB-GUL-002',
    originalAuditDate: '2026-11-17T12:00:00Z',
    originalVerdict: 'FAIL',
    originalScore: 30,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/dabur/DAB-FAKE-002.png',
  },
  {
    id: 'AUD-DAB-006',
    adCode: 'DAB-FAKE-003',
    title: 'Odomos 100% Elimination Unsubstantiated Claim (Violation)',
    campaignId: 'CMP-DAB-003',
    sku: 'DAB-ODM-003',
    originalAuditDate: '2026-11-17T14:30:00Z',
    originalVerdict: 'FAIL',
    originalScore: 20,
    revalidationNeeded: false,
    status: 'CLEAN',
    image: '/ads/dabur/DAB-FAKE-003.png',
  },
];

const INITIAL_DABUR_POLICY_CHANGES: PolicyChangeEvent[] = [
  {
    id: 'POL-DAB-01',
    timestamp: '2026-11-19T11:00:00Z',
    changeType: 'REGULATORY_TIGHTENING',
    title: 'Mandatory Clinical Dossier Reference for Long-Duration Claims',
    targetEntity: 'DAB-RULE-002 (Skincare Hydration Verification)',
    previousValue: 'Footnote optional if test dossier is maintained internally',
    newValue: 'Mandatory legible asterisk citation of accredited clinical study code (e.g. "Ref: DermaTest Lab Protocol 2026-09")',
    regulatorySource: 'ASCI Healthcare Guidelines & Ayush Standard Operating Procedure v3.1',
    impactedCreativesCount: 1,
    revalidationStatus: 'PENDING',
  },
  {
    id: 'POL-DAB-02',
    timestamp: '2026-11-15T08:00:00Z',
    changeType: 'RULE_AMENDMENT',
    title: 'Prohibition Against Absolute Eradication Superlatives',
    targetEntity: 'DAB-RULE-003 (Household Insecticide Guardrail)',
    previousValue: 'Claims of high mosquito protection permitted with testing',
    newValue: 'Absolute terms ("100% Kill", "Zero Mosquitoes") prohibited by statutory directive',
    regulatorySource: 'Central Insecticides Board & Registration Committee Directives',
    impactedCreativesCount: 0,
    revalidationStatus: 'RESOLVED',
  },
];

const INITIAL_DABUR_RECURRING: RecurringViolation[] = [
  {
    id: 'REC-DAB-01',
    patternCode: 'PAT-CLI-001',
    title: 'Multiplier Claim Inflation Above Clinical Benchmark (50X vs 10X)',
    severity: 'RED',
    recurrenceCount: 3,
    affectedCampaigns: ['CMP-DAB-001'],
    affectedCreatives: ['DAB-FAKE-001'],
    rootCause: 'Performance marketing copywriters amplifying the verified clinical 10X tensile strength multiplier to 50X for short-form social video thumbnails.',
    remediationAdvice: 'Implement deterministic text guardrail: flag any integer multiplier followed by "X Stronger" exceeding the certified dossier ceiling of 10X.',
    statutoryBasis: 'ASCI Code Chapter I.1 (Truthful & Honest Claims) & Drug & Magic Remedies Act',
    lastDetected: '2026-11-16T16:00:00Z',
  },
  {
    id: 'REC-DAB-02',
    patternCode: 'PAT-HYD-002',
    title: 'Exaggerated Hydration Duration Exceeding 72-Hour Dermatological Cap',
    severity: 'RED',
    recurrenceCount: 2,
    affectedCampaigns: ['CMP-DAB-002'],
    affectedCreatives: ['DAB-FAKE-002'],
    rootCause: 'Influencer promotional copy exaggerating standard 72-hour moisture barrier data to 120 hours without clinical re-testing.',
    remediationAdvice: 'Restrain duration descriptors: lock all hydration claim text blocks to max 72 hours with mandatory clinical study citation.',
    statutoryBasis: 'Dermatological Claims Compliance Matrix § 2.3',
    lastDetected: '2026-11-17T12:00:00Z',
  },
];

/* ────────────────────────────────────────────────────────
   STORAGE & CACHING HELPERS
   ──────────────────────────────────────────────────────── */
const STORAGE_KEY_PREFIX = 'integrix_compliance_intel_';

const getStoredData = (orgId: string): {
  audits: AuditedAdRecord[];
  policyChanges: PolicyChangeEvent[];
  recurring: RecurringViolation[];
} => {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${orgId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[ComplianceIntel] LocalStorage parse error:', err);
  }

  // Fallback defaults
  if (orgId === 'org-dabur') {
    return {
      audits: [...INITIAL_DABUR_AUDITS],
      policyChanges: [...INITIAL_DABUR_POLICY_CHANGES],
      recurring: [...INITIAL_DABUR_RECURRING],
    };
  }
  return {
    audits: [...INITIAL_NOVAWEAR_AUDITS],
    policyChanges: [...INITIAL_NOVAWEAR_POLICY_CHANGES],
    recurring: [...INITIAL_NOVAWEAR_RECURRING],
  };
};

const saveStoredData = (orgId: string, data: {
  audits: AuditedAdRecord[];
  policyChanges: PolicyChangeEvent[];
  recurring: RecurringViolation[];
}) => {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${orgId}`, JSON.stringify(data));
  } catch (err) {
    console.warn('[ComplianceIntel] LocalStorage save error:', err);
  }
};

/* ────────────────────────────────────────────────────────
   RISK SCORE & VECTORS CALCULATION ENGINE
   ──────────────────────────────────────────────────────── */
export const getOrganisationRiskSummary = (orgId: string): OrganisationRiskSummary => {
  const isDabur = orgId === 'org-dabur';
  const orgName = isDabur ? 'Dabur India Limited' : 'NOVAWEAR Retail Private Limited';
  const data = getStoredData(orgId);

  const audits = data.audits;
  const policyChanges = data.policyChanges;
  const recurring = data.recurring;

  const totalMonitoredCreatives = audits.length;
  const revalidationRequiredCount = audits.filter((a) => a.revalidationNeeded).length;
  const failingCount = audits.filter((a) => a.originalVerdict === 'FAIL' && !a.revalidationNeeded).length;
  const needsVerifCount = audits.filter((a) => a.originalVerdict === 'NEEDS_VERIFICATION' && !a.revalidationNeeded).length;
  const cleanCompliantCount = audits.filter((a) => a.originalVerdict === 'PASS' && !a.revalidationNeeded).length;

  // Composite Risk Score Calculation (0-100)
  // Higher = Riskier. Factor in:
  // - High-severity violations (weight: 15 per failing ad)
  // - Stale ads needing revalidation (weight: 12 per stale ad)
  // - Needs-verification claims (weight: 8 per item)
  // - Active recurring patterns (weight: 10 per pattern)
  const rawScore =
    failingCount * 14 +
    revalidationRequiredCount * 12 +
    needsVerifCount * 7 +
    recurring.length * 6;

  // Normalize between 10 and 95
  const compositeRiskScore = Math.min(95, Math.max(12, Math.round((rawScore / (totalMonitoredCreatives * 15)) * 100)));

  let riskLevel: RiskLevel = 'LOW';
  if (compositeRiskScore >= 70) riskLevel = 'CRITICAL';
  else if (compositeRiskScore >= 45) riskLevel = 'ELEVATED';
  else if (compositeRiskScore >= 25) riskLevel = 'MODERATE';

  // Risk Vectors Breakdown
  const riskVectors: RiskVector[] = isDabur
    ? [
        {
          id: 'VEC-DAB-01',
          name: 'Clinical & Efficacy Claim Multipliers',
          category: 'CLINICAL_CLAIMS',
          score: 82,
          weight: 35,
          status: 'HIGH_RISK',
          activeViolations: 2,
          staleAdsCount: 0,
          topOffendingRule: 'DAB-RULE-001 (Tensile Strength 10X Cap)',
          description: 'High exposure to unapproved multiplier exaggerations (50X vs 10X verified clinical trials).',
          mitigationGuidance: 'Enforce pre-flight clinical token validation locking multipliers strictly to accredited lab certificates.',
        },
        {
          id: 'VEC-DAB-02',
          name: 'Dermatological Hydration & Test Disclosures',
          category: 'REGULATORY_SLA',
          score: 48,
          weight: 25,
          status: 'MODERATE',
          activeViolations: 1,
          staleAdsCount: 1,
          topOffendingRule: 'DAB-RULE-002 (72-Hr Moisture Barrier)',
          description: 'Recent Ayush regulatory tightening requires explicit laboratory citation on all 72-hr claims.',
          mitigationGuidance: 'Batch revalidate skincare campaigns to ensure accredited trial references appear in creative text.',
        },
        {
          id: 'VEC-DAB-03',
          name: 'Insecticide Safety & Absolute Elimination Bar',
          category: 'MATERIAL',
          score: 38,
          weight: 20,
          status: 'MODERATE',
          activeViolations: 1,
          staleAdsCount: 0,
          topOffendingRule: 'DAB-RULE-003 (CIB Repellent Standards)',
          description: 'Statutory prohibitions against absolute 100% mosquito elimination claims require continual screening.',
          mitigationGuidance: 'Preclude superlatives such as "Zero", "Eradication", and "100%" on all aerosol and vaporiser creatives.',
        },
        {
          id: 'VEC-DAB-04',
          name: 'Ayurvedic Brand Heritage & Vector Integrity',
          category: 'TRADEMARK_ASSET',
          score: 15,
          weight: 20,
          status: 'HEALTHY',
          activeViolations: 0,
          staleAdsCount: 0,
          topOffendingRule: 'DAB-RULE-005 (Banyan Tree Logo & Colors)',
          description: 'Official Dabur Forest Green (#006837) and vector symbol mark adhere to master brand standards.',
          mitigationGuidance: 'Maintain automated aspect-ratio and color-space checksum on all creative studio uploads.',
        },
      ]
    : [
        {
          id: 'VEC-NW-01',
          name: 'Regulatory SLA & Delivery Promises',
          category: 'REGULATORY_SLA',
          score: 78,
          weight: 30,
          status: 'HIGH_RISK',
          activeViolations: 1,
          staleAdsCount: 2,
          topOffendingRule: 'NW-RULE-004 (Delivery Guarantees)',
          description: 'High risk driven by legacy creatives promising Next-Day delivery without newly mandated cutoff/pincode disclosures.',
          mitigationGuidance: 'Trigger organisation-wide revalidation to flag and update all collateral displaying unqualified express claims.',
        },
        {
          id: 'VEC-NW-02',
          name: 'Promotional Pricing & Campaign Windowing',
          category: 'PRICING',
          score: 65,
          weight: 25,
          status: 'HIGH_RISK',
          activeViolations: 2,
          staleAdsCount: 1,
          topOffendingRule: 'NW-RULE-002 (Promotional Gates)',
          description: 'Active flyers advertise expired festive markdowns and catalog price revision from ₹1,299 to ₹1,499 renders baseline ads outdated.',
          mitigationGuidance: 'Synchronize media servers with ERP campaign schedule to pull unapproved discount creative immediately.',
        },
        {
          id: 'VEC-NW-03',
          name: 'Fiber Composition & Fabric Truth',
          category: 'MATERIAL',
          score: 42,
          weight: 25,
          status: 'MODERATE',
          activeViolations: 1,
          staleAdsCount: 0,
          topOffendingRule: 'NW-RULE-001 (Fabric Integrity)',
          description: 'Recurring confusion between 100% Cotton Oxford shirts and 60/40 blended variants.',
          mitigationGuidance: 'Bind composition copy to the ERP product specification code before creative rendering.',
        },
        {
          id: 'VEC-NW-04',
          name: 'Brand Vector Trademark Protection',
          category: 'TRADEMARK_ASSET',
          score: 18,
          weight: 20,
          status: 'HEALTHY',
          activeViolations: 0,
          staleAdsCount: 0,
          topOffendingRule: 'NW-RULE-005 (NOVA Navy & Aspect Ratio)',
          description: 'Official logo color (#172B4D) and protective boundary rules are 98% compliant across active posters.',
          mitigationGuidance: 'Continue automated visual bounding-box screening on graphic layouts.',
        },
      ];

  // Campaign-Wise Analytics
  const campaigns: CampaignAnalytics[] = isDabur
    ? [
        {
          campaignId: 'CMP-DAB-001',
          title: 'Dabur Amla 10X Clinical Strength Flight',
          sku: 'DAB-AML-001',
          channel: 'Digital & Print',
          status: 'Approved',
          totalAds: 3,
          passedAds: 2,
          violatingAds: 1,
          complianceRate: 67,
          riskGrade: 'C',
          activeWarnings: ['50X Multiplier violation detected in social variant'],
        },
        {
          campaignId: 'CMP-DAB-002',
          title: 'Gulabari Winter Radiance & 72-Hr Hydration',
          sku: 'DAB-GUL-002',
          channel: 'Omnichannel & Modern Retail',
          status: 'Approved',
          totalAds: 2,
          passedAds: 1,
          violatingAds: 1,
          complianceRate: 50,
          riskGrade: 'C',
          activeWarnings: ['Revalidation pending for clinical laboratory citation', '120-Hr claim flagged'],
        },
        {
          campaignId: 'CMP-DAB-003',
          title: 'Odomos Family Defense 2026',
          sku: 'DAB-ODM-003',
          channel: 'Television & E-commerce',
          status: 'Approved',
          totalAds: 2,
          passedAds: 1,
          violatingAds: 1,
          complianceRate: 50,
          riskGrade: 'C',
          activeWarnings: ['100% elimination claim rejected'],
        },
      ]
    : [
        {
          campaignId: 'CMP-26-018',
          title: 'Weekend Essentials Apparel Drive',
          sku: 'NW-TS-003 / NW-CS-001',
          channel: 'Web, App & Social',
          status: 'Approved',
          totalAds: 4,
          passedAds: 2,
          violatingAds: 2,
          complianceRate: 50,
          riskGrade: 'C',
          activeWarnings: ['Stale delivery copy flagged under NW-RULE-004 amendment', 'Catalogue price out-of-date'],
        },
        {
          campaignId: 'CMP-26-014',
          title: 'Festive Season Kickoff Promotion',
          sku: 'NW-CS-001 / NW-CS-002',
          channel: 'Digital Ad Networks',
          status: 'Expired',
          totalAds: 2,
          passedAds: 0,
          violatingAds: 2,
          complianceRate: 0,
          riskGrade: 'D',
          activeWarnings: ['Campaign expired on 31 Oct 2026', 'Incorrect fabric composition claim'],
        },
        {
          campaignId: 'CMP-26-021',
          title: 'Winter Warmup Chino Flash Drop',
          sku: 'NW-TR-005',
          channel: 'Social Stories & Meta',
          status: 'Pending',
          totalAds: 1,
          passedAds: 0,
          violatingAds: 1,
          complianceRate: 0,
          riskGrade: 'D',
          activeWarnings: ['Awaiting commercial director sign-off'],
        },
        {
          campaignId: 'CMP-26-025',
          title: 'Overcoat Autumn Tier Release',
          sku: 'NW-OS-006',
          channel: 'In-Store Displays & Web',
          status: 'Approved',
          totalAds: 1,
          passedAds: 0,
          violatingAds: 1,
          complianceRate: 0,
          riskGrade: 'C',
          activeWarnings: ['Revalidation needed for delivery disclaimer token'],
        },
      ];

  return {
    orgId,
    orgName,
    compositeRiskScore,
    riskLevel,
    riskTrendDelta: -14, // 14% improvement over last 30 days
    totalMonitoredCreatives,
    cleanCompliantCount,
    revalidationRequiredCount,
    recurringPatternsCount: recurring.length,
    riskVectors,
    recurringViolations: recurring,
    campaigns,
    policyChanges,
    auditedCreatives: audits,
  };
};

/* ────────────────────────────────────────────────────────
   PROACTIVE REVALIDATION EXECUTION
   ──────────────────────────────────────────────────────── */
export const executeProactiveRevalidation = (
  orgId: string,
  targetAdIds?: string[]
): {
  revalidatedCount: number;
  updatedRecords: AuditedAdRecord[];
  newRiskScore: number;
} => {
  const data = getStoredData(orgId);
  const now = new Date().toISOString();

  let count = 0;
  const updatedAudits = data.audits.map((ad) => {
    // If specific target IDs provided, only touch those; otherwise revalidate all needing revalidation
    const shouldRevalidate =
      targetAdIds && targetAdIds.length > 0
        ? targetAdIds.includes(ad.id) || targetAdIds.includes(ad.adCode)
        : ad.revalidationNeeded;

    if (shouldRevalidate) {
      count++;
      // Determine simulated new verdict based on updated rules
      let newVerdict: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION' = 'NEEDS_VERIFICATION';
      let newScore = 65;

      if (ad.adCode === 'AD-NW-007') {
        // Price changed from ₹1,299 to ₹1,499, so the ₹1,299 ad is now flagged as PRICE_MISMATCH!
        newVerdict = 'FAIL';
        newScore = 55;
      } else if (ad.adCode === 'AD-NW-006' || ad.adCode === 'AD-NW-007-delivery') {
        // Delivery SLA rule tightened, so unqualified delivery guarantee fails
        newVerdict = 'FAIL';
        newScore = 50;
      } else if (ad.adCode === 'DAB-REAL-002') {
        newVerdict = 'NEEDS_VERIFICATION';
        newScore = 75;
      }

      return {
        ...ad,
        revalidationNeeded: false,
        status: 'REVALIDATED' as const,
        revalidatedAt: now,
        postRevalidationVerdict: newVerdict,
        postRevalidationScore: newScore,
        revalidationReason: `Revalidated on ${new Date().toLocaleDateString()} against active policy rulebook. Verdict updated to ${newVerdict}.`,
      };
    }
    return ad;
  });

  // Mark pending policy changes as RESOLVED
  const updatedPolicyChanges = data.policyChanges.map((pc) => ({
    ...pc,
    revalidationStatus: 'RESOLVED' as const,
  }));

  saveStoredData(orgId, {
    ...data,
    audits: updatedAudits,
    policyChanges: updatedPolicyChanges,
  });

  // Calculate new risk score
  const newSummary = getOrganisationRiskSummary(orgId);

  return {
    revalidatedCount: count,
    updatedRecords: updatedAudits,
    newRiskScore: newSummary.compositeRiskScore,
  };
};

/* ────────────────────────────────────────────────────────
   POLICY CHANGE SIMULATION
   ──────────────────────────────────────────────────────── */
export const simulatePolicyChange = (
  orgId: string,
  change: {
    title: string;
    targetEntity: string;
    previousValue: string;
    newValue: string;
    regulatorySource: string;
  }
): {
  newEvent: PolicyChangeEvent;
  newlyFlaggedAds: string[];
} => {
  const data = getStoredData(orgId);
  const now = new Date().toISOString();
  const eventId = `POL-SIM-${Date.now().toString().slice(-4)}`;

  // Find candidate ads that match this target entity or rule
  const newlyFlagged: string[] = [];
  const updatedAudits = data.audits.map((ad) => {
    // If ad touches this target entity and was previously marked clean, flag for revalidation
    const isTarget =
      change.targetEntity.toLowerCase().includes(ad.sku.toLowerCase()) ||
      change.targetEntity.toLowerCase().includes(ad.adCode.toLowerCase()) ||
      (change.targetEntity.toLowerCase().includes('delivery') && ad.adCode.includes('006')) ||
      (change.targetEntity.toLowerCase().includes('price') && ad.adCode.includes('001'));

    if (isTarget && !ad.revalidationNeeded) {
      newlyFlagged.push(ad.adCode);
      return {
        ...ad,
        revalidationNeeded: true,
        status: 'REVALIDATION_REQUIRED' as const,
        revalidationSeverity: 'CRITICAL' as const,
        policyChangedRef: eventId,
        revalidationReason: `Policy modification on ${change.targetEntity}: ${change.title}. Previously certified assertions require re-evaluation.`,
      };
    }
    return ad;
  });

  const newEvent: PolicyChangeEvent = {
    id: eventId,
    timestamp: now,
    changeType: 'RULE_AMENDMENT',
    title: change.title,
    targetEntity: change.targetEntity,
    previousValue: change.previousValue,
    newValue: change.newValue,
    regulatorySource: change.regulatorySource,
    impactedCreativesCount: newlyFlagged.length,
    revalidationStatus: 'PENDING',
  };

  saveStoredData(orgId, {
    ...data,
    audits: updatedAudits,
    policyChanges: [newEvent, ...data.policyChanges],
  });

  return {
    newEvent,
    newlyFlaggedAds: newlyFlagged,
  };
};

/* ────────────────────────────────────────────────────────
   RESET TO BASELINE
   ──────────────────────────────────────────────────────── */
export const resetComplianceIntelToBaseline = (orgId: string): void => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${orgId}`);
  } catch (err) {
    console.warn('[ComplianceIntel] Reset error:', err);
  }
};

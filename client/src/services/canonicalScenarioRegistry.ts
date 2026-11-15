/**
 * Integrix AI – Frontend Canonical Scenario Registry
 * Authoritative client-side registry synchronised with backend canonical definitions.
 * Strictly separates Advertisement Evidence, Organisation Ground Truth, and Test Benchmark.
 */

export interface CanonicalScenarioRecord {
  canonicalTestId: string;
  uiScenarioId: string;
  scenarioId?: string;
  adCode: string;
  testPackId: string;
  expectedAuditDocId: string;
  scenarioTitle: string;
  description: string;
  posterAssetPath: string;
  posterFileHash: string;
  targetSku: string | null;
  expectedOutcome: 'PASS' | 'FAIL' | 'NEEDS_VERIFICATION';
  expectedViolationCategory: string;
  primaryRule: string;
  expectedSeverity: 'GREEN' | 'AMBER' | 'RED';
  intendedTestDescription: string;
  catalogueFacts: {
    productName: string;
    sellingPrice: string;
    fabric: string;
    fit?: string;
    campaign?: string;
  } | null;
  requiredEvidence: string;
  fixtureConflictNote?: string;
}

export const CANONICAL_SCENARIO_REGISTRY: Record<string, CanonicalScenarioRecord> = {
  'INX-NW-T01': {
    canonicalTestId: 'INX-NW-T01',
    uiScenarioId: 'SCENARIO-2',
    adCode: 'AD-NW-001',
    testPackId: 'AD-NW-002',
    expectedAuditDocId: 'AD-NW-001',
    scenarioTitle: 'Incorrect Advertised Price',
    description: 'Advertised price does not match approved catalogue base selling price of ₹1,299. Promotional campaign CMP-26-014 expired on 31 Oct 2026 and cannot authorise discounted pricing on 13 Nov 2026.',
    posterAssetPath: '/ads/AD-NW-001.png',
    posterFileHash: 'aa6a955249c03bc8d273758c12e5229415db9b2510f1124accb13862dbbd1a0c',
    targetSku: 'NW-CS-001',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'PRICE_VIOLATION',
    primaryRule: 'NW-RULE-002',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Commercial pricing audit. Advertisement displays an unapproved discount price not supported by the active approved campaign registry.',
    catalogueFacts: {
      productName: 'Classic Cotton Shirt',
      sellingPrice: '₹1,299',
      fabric: '100% cotton',
      fit: 'Regular fit',
      campaign: 'CMP-26-014 (Expired 31 Oct 2026)',
    },
    requiredEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue (base ₹1,299) and Campaign Offers sheet (CMP-26-014 expired 31 Oct 2026).',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-001.png displays "Classic Cotton Kurta" with visible price ₹1,299. Benchmark oracle submission context tests pricing discrepancy against NW-CS-001.',
  },
  'INX-NW-T02': {
    canonicalTestId: 'INX-NW-T02',
    uiScenarioId: 'SCENARIO-3',
    adCode: 'AD-NW-002',
    testPackId: 'AD-NW-003',
    expectedAuditDocId: 'AD-NW-002',
    scenarioTitle: 'Incorrect Fabric Composition',
    description: 'Advertisement claims "100% Cotton" for Everyday Oxford Shirt (NW-CS-002). The official ground-truth catalogue specifies a 60% Cotton, 40% Polyester blended fabric.',
    posterAssetPath: '/ads/AD-NW-002.png',
    posterFileHash: 'eef86f056e500a33cd3602d96509df8ac43d5f698aaf33d2ccf9078757fac7ee',
    targetSku: 'NW-CS-002',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'COMPOSITION_MISMATCH',
    primaryRule: 'NW-RULE-001',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Material composition audit. Submission claims 100% pure cotton for a 60/40 polyester blend SKU, breaching fiber accuracy standards.',
    catalogueFacts: {
      productName: 'Everyday Oxford Shirt',
      sellingPrice: '₹1,199',
      fabric: '60% cotton, 40% polyester',
      fit: 'Regular fit',
    },
    requiredEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue sheet → NW-CS-002 row.',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-002.png displays an Essential Polo Tee with "100% Polyester, ₹899". Benchmark oracle tests fabric composition against NW-CS-002.',
  },
  'INX-NW-T03': {
    canonicalTestId: 'INX-NW-T03',
    uiScenarioId: 'SCENARIO-4',
    adCode: 'AD-NW-003',
    testPackId: 'AD-NW-004',
    expectedAuditDocId: 'AD-NW-003',
    scenarioTitle: 'Approved Campaign with Conditions',
    description: 'Authorized promotional offer under approved campaign CMP-26-018 for Core Crew T-Shirt (NW-TS-003) at ₹599. Valid 1–15 Nov 2026 on website and Instagram Shop, selected sizes only.',
    posterAssetPath: '/ads/AD-NW-003.png',
    posterFileHash: '694be14a43526919d385747ae36b040ec3f68972fa3aaa71612ce3666601372e',
    targetSku: 'NW-TS-003',
    expectedOutcome: 'PASS',
    expectedViolationCategory: 'CAMPAIGN_APPROVED',
    primaryRule: 'NW-RULE-002',
    expectedSeverity: 'GREEN',
    intendedTestDescription: 'Valid promotional campaign verification matching SKU, dates, channel, and conditions.',
    catalogueFacts: {
      productName: 'Core Crew T-Shirt',
      sellingPrice: '₹649 (Base) / ₹599 (CMP-26-018)',
      fabric: '95% cotton, 5% elastane',
      fit: 'Regular fit',
      campaign: 'CMP-26-018 (Approved, 1–15 Nov 2026)',
    },
    requiredEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Campaign Offers → CMP-26-018 row.',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-003.png displays "Festive Edit, 20% OFF on Ethnic Wear". Benchmark oracle verifies approved promotional conditions for NW-TS-003.',
  },
  'INX-NW-T04': {
    canonicalTestId: 'INX-NW-T04',
    uiScenarioId: 'SCENARIO-5',
    adCode: 'AD-NW-004',
    testPackId: 'AD-NW-005',
    expectedAuditDocId: 'AD-NW-004',
    scenarioTitle: 'Pending Campaign Price',
    description: 'Advertises promotional price ₹1,399 under campaign CMP-26-021 for Everyday Chino (NW-TR-005). Campaign status is "Pending" and unapproved by the commercial lead.',
    posterAssetPath: '/ads/AD-NW-004.png',
    posterFileHash: '4964ce88d640ff8e02c870224382ecc61458d321f1427e5d77522d46a25f2454',
    targetSku: 'NW-TR-005',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'PRICE_VIOLATION',
    primaryRule: 'NW-RULE-002',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Approval-state audit preventing publication of unapproved commercial promotions.',
    catalogueFacts: {
      productName: 'Everyday Chino',
      sellingPrice: '₹1,499 (Base) / ₹1,399 (Pending)',
      fabric: '98% cotton, 2% elastane',
      fit: 'Slim straight fit',
      campaign: 'CMP-26-021 (Status: Pending)',
    },
    requiredEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Campaign Offers sheet → CMP-26-021 row.',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-004.png is a "Winter Sale, Coming Soon" teaser. Benchmark asserts approval governance on pending campaign CMP-26-021 for NW-TR-005.',
  },
  'INX-NW-T05': {
    canonicalTestId: 'INX-NW-T05',
    uiScenarioId: 'SCENARIO-6',
    adCode: 'AD-NW-005',
    testPackId: 'AD-NW-006',
    expectedAuditDocId: 'AD-NW-005',
    scenarioTitle: 'Unsupported Performance Claim ("Wrinkle-Proof")',
    description: 'Promises "Wrinkle-Proof" functional benefit for Classic Cotton Shirt (NW-CS-001) without accredited laboratory test substantiation in the repository.',
    posterAssetPath: '/ads/AD-NW-005.png',
    posterFileHash: '9722ac2ec920084141eb65c73f4c78fd254a828a502cf37f4d753e6889befffb',
    targetSku: 'NW-CS-001',
    expectedOutcome: 'NEEDS_VERIFICATION',
    expectedViolationCategory: 'UNSUPPORTED_CLAIM',
    primaryRule: 'NW-RULE-003',
    expectedSeverity: 'AMBER',
    intendedTestDescription: 'Substantiation check for unverified consumer benefit and functional performance claims.',
    catalogueFacts: {
      productName: 'Classic Cotton Shirt',
      sellingPrice: '₹1,299',
      fabric: '100% cotton',
      fit: 'Regular fit',
    },
    requiredEvidence: '03_Marketing_and_Communication_Policy.pdf (Section 4); 05_Product_Catalogue_and_Campaigns.xlsx (Claims Not Approved sheet).',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-005.png displays "Wrinkle-Proof Shirts, ₹1,499". Both visible creative copy and benchmark oracle test unsubstantiated wrinkle-resistance claims.',
  },
  'INX-NW-T06': {
    canonicalTestId: 'INX-NW-T06',
    uiScenarioId: 'SCENARIO-7',
    adCode: 'AD-NW-006',
    testPackId: 'AD-NW-007',
    expectedAuditDocId: 'AD-NW-006',
    scenarioTitle: 'Unapproved Next-Day Delivery Guarantee',
    description: 'Guarantees next-day delivery without qualification or service disclaimer. The brand repository only authorises carrier handover dispatch within 1–2 business days.',
    posterAssetPath: '/ads/AD-NW-006.png',
    posterFileHash: '469fa7f3f8d99f65b57ea8e0dbb4a73d993da53bf46086774702620e64e6a874',
    targetSku: null,
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'DELIVERY_PROMISE',
    primaryRule: 'NW-RULE-004',
    expectedSeverity: 'AMBER',
    intendedTestDescription: 'Service-level agreement audit detecting unapproved delivery promises lacking geographical or operational qualifiers.',
    catalogueFacts: null,
    requiredEvidence: '02_Company_Profile.pdf and 04_Product_and_Customer_Information_Policy.pdf (Section 5: Approved dispatch estimates).',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-006.png displays "Next-Day Delivery Guaranteed!". Both visual creative and benchmark oracle assert delivery-guarantee policy violation.',
  },
  'INX-NW-T07': {
    canonicalTestId: 'INX-NW-T07',
    uiScenarioId: 'SCENARIO-1',
    adCode: 'AD-NW-007',
    testPackId: 'AD-NW-001',
    expectedAuditDocId: 'AD-NW-007',
    scenarioTitle: 'Compliant Product Advertisement',
    description: 'Fully compliant product advertisement matching approved ground-truth catalogue. 100% cotton composition, regular fit, and authorized base price verified.',
    posterAssetPath: '/ads/AD-NW-007.png',
    posterFileHash: '2896e99a9711a428548a691f608d6bf54b4d7f40223f84ae47c4e3e924b519b1',
    targetSku: 'NW-CS-001',
    expectedOutcome: 'PASS',
    expectedViolationCategory: 'COMPLIANT_BASELINE',
    primaryRule: 'NW-RULE-001',
    expectedSeverity: 'GREEN',
    intendedTestDescription: 'Compliant baseline. All advertised claims match approved NOVAWEAR catalogue specifications.',
    catalogueFacts: {
      productName: 'Classic Cotton Shirt',
      sellingPrice: '₹1,299',
      fabric: '100% cotton',
      fit: 'Regular fit',
    },
    requiredEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue → NW-CS-001 row.',
    fixtureConflictNote: 'Preliminary collage creative AD-NW-007.png shows "Essential T-Shirt, 100% Cotton, ₹699". Benchmark oracle asserts clean baseline verification against approved catalogue specs.',
  },

  /* ─────────────────────────────────────────────────────────────
     DABUR CANONICAL TEST SCENARIOS (REAL & FAKE)
  ───────────────────────────────────────────────────────────── */
  'INX-DAB-T01': {
    canonicalTestId: 'INX-DAB-T01',
    uiScenarioId: 'DAB-SCENARIO-1',
    adCode: 'DAB-REAL-001',
    testPackId: 'INX-DAB-T01',
    expectedAuditDocId: 'DAB-REAL-001',
    scenarioTitle: 'Dabur Amla Hair Oil — 10X Stronger (Genuine)',
    description: 'Official compliant Dabur Amla advertisement featuring certified 10X stronger hair claim backed by clinical study vs non-conditioning oil with legible footnote.',
    posterAssetPath: '/ads/dabur/DAB-REAL-001.jpg',
    posterFileHash: 'dab001_real_amla_10x',
    targetSku: 'DAB-AML-001',
    expectedOutcome: 'PASS',
    expectedViolationCategory: 'NONE',
    primaryRule: 'DAB-RULE-001',
    expectedSeverity: 'GREEN',
    intendedTestDescription: 'Clinical trial efficacy verification. Ad claim "10X Stronger Hair" aligns with certified laboratory trial.',
    catalogueFacts: {
      productName: 'Dabur Amla Hair Oil',
      sellingPrice: '₹180',
      fabric: 'Pure Amla Oil & Natural Antioxidants',
      fit: '275 ml Bottle',
      campaign: 'DAB-CMP-AML (Active Nov 2026)',
    },
    requiredEvidence: 'Dabur Clinical Research Dossier section 4.1 & ASCI Code for Self-Regulation.',
  },
  'INX-DAB-T02': {
    canonicalTestId: 'INX-DAB-T02',
    uiScenarioId: 'DAB-SCENARIO-2',
    adCode: 'DAB-REAL-002',
    testPackId: 'INX-DAB-T02',
    expectedAuditDocId: 'DAB-REAL-002',
    scenarioTitle: 'Dabur Gulabari — 72-Hour Moisturisation (Genuine)',
    description: 'Approved skincare creative with certified 72-hour hydration claim and approved pricing.',
    posterAssetPath: '/ads/dabur/DAB-REAL-002.png',
    posterFileHash: 'dab002_real_gulabari_72h',
    targetSku: 'DAB-GUL-002',
    expectedOutcome: 'PASS',
    expectedViolationCategory: 'NONE',
    primaryRule: 'DAB-RULE-002',
    expectedSeverity: 'GREEN',
    intendedTestDescription: 'Dermatological validation of hydration claim (72 hours max under standard conditions).',
    catalogueFacts: {
      productName: 'Dabur Gulabari Moisturiser',
      sellingPrice: '₹49',
      fabric: '100% Pure Rose Water & Natural Actives',
      fit: '50g Tub / 400ml Lotion',
    },
    requiredEvidence: 'Gulabari Dermatological Certification Study (controlled test conditions).',
  },
  'INX-DAB-T03': {
    canonicalTestId: 'INX-DAB-T03',
    uiScenarioId: 'DAB-SCENARIO-3',
    adCode: 'DAB-REAL-003',
    testPackId: 'INX-DAB-T03',
    expectedAuditDocId: 'DAB-REAL-003',
    scenarioTitle: 'Odomos Liquid Vaporiser — 80% Less Mosquitoes (Genuine)',
    description: 'Approved household repellent creative with accurate 80% reduction statement, family safety copy, and "Fits all machines" label.',
    posterAssetPath: '/ads/dabur/DAB-REAL-003.jpg',
    posterFileHash: 'dab003_real_odomos_80pct',
    targetSku: 'DAB-ODM-003',
    expectedOutcome: 'PASS',
    expectedViolationCategory: 'NONE',
    primaryRule: 'DAB-RULE-003',
    expectedSeverity: 'GREEN',
    intendedTestDescription: 'Pest repellent regulatory compliance. Certified percentage reduction claim without false absolute eradication guarantee.',
    catalogueFacts: {
      productName: 'Odomos Liquid Vaporiser',
      sellingPrice: '₹85',
      fabric: 'Transfluthrin 0.88% w/w PMD active repellent',
      fit: '45 ml Refill (Fits All Machines)',
    },
    requiredEvidence: 'Odomos Efficacy Dossier & Central Insecticides Board norms.',
  },
  'INX-DAB-T04': {
    canonicalTestId: 'INX-DAB-T04',
    uiScenarioId: 'DAB-SCENARIO-4',
    adCode: 'DAB-FAKE-001',
    testPackId: 'INX-DAB-T04',
    expectedAuditDocId: 'DAB-FAKE-001',
    scenarioTitle: 'Dabur Amla Hair Oil — 50X Exaggerated Claim (Violation)',
    description: 'Exaggerated / unsupported claim: "Makes hair 50X stronger" deviates from certified 10X clinical benchmark.',
    posterAssetPath: '/ads/dabur/DAB-FAKE-001.png',
    posterFileHash: 'dab004_fake_amla_50x',
    targetSku: 'DAB-AML-001',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'UNSUPPORTED_CLAIM',
    primaryRule: 'DAB-RULE-001',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Exaggerated claim audit. 50X stronger claim exceeds clinical benchmark of 10X by 500%.',
    catalogueFacts: {
      productName: 'Dabur Amla Hair Oil',
      sellingPrice: '₹180',
      fabric: 'Pure Amla Oil & Natural Antioxidants',
      fit: '275 ml Bottle',
    },
    requiredEvidence: 'Dabur Clinical Research Dossier section 4.1 & ASCI Code Section 1.4.',
  },
  'INX-DAB-T05': {
    canonicalTestId: 'INX-DAB-T05',
    uiScenarioId: 'DAB-SCENARIO-5',
    adCode: 'DAB-FAKE-002',
    testPackId: 'INX-DAB-T05',
    expectedAuditDocId: 'DAB-FAKE-002',
    scenarioTitle: 'Dabur Gulabari — 120-Hour Misleading Duration (Violation)',
    description: 'Misleading duration claim: "120 Hours\' of Moisturisation" exceeds verified 72-hour clinical certification by 66.7%.',
    posterAssetPath: '/ads/dabur/DAB-FAKE-002.png',
    posterFileHash: 'dab005_fake_gulabari_120h',
    targetSku: 'DAB-GUL-002',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'UNSUPPORTED_CLAIM',
    primaryRule: 'DAB-RULE-002',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Misleading longevity claim. 120-hour (5 days) duration claim is uncertified and deceptive.',
    catalogueFacts: {
      productName: 'Dabur Gulabari Moisturiser',
      sellingPrice: '₹49',
      fabric: '100% Pure Rose Water & Natural Actives',
      fit: '50g Tub / 400ml Lotion',
    },
    requiredEvidence: 'Gulabari Dermatological Efficacy Study & Product Dossier.',
  },
  'INX-DAB-T06': {
    canonicalTestId: 'INX-DAB-T06',
    uiScenarioId: 'DAB-SCENARIO-6',
    adCode: 'DAB-FAKE-003',
    testPackId: 'INX-DAB-T06',
    expectedAuditDocId: 'DAB-FAKE-003',
    scenarioTitle: 'Odomos — 100% Guaranteed Elimination (Violation)',
    description: 'False guarantee claim: "100% Kills Mosquitoes All Night" is an unprovable absolute guarantee violating Central Insecticides Board norms.',
    posterAssetPath: '/ads/dabur/DAB-FAKE-003.png',
    posterFileHash: 'dab006_fake_odomos_100pct',
    targetSku: 'DAB-ODM-003',
    expectedOutcome: 'FAIL',
    expectedViolationCategory: 'UNSUPPORTED_CLAIM',
    primaryRule: 'DAB-RULE-003',
    expectedSeverity: 'RED',
    intendedTestDescription: 'Prohibited absolute guarantee in household pesticide advertising violating CIB guidelines.',
    catalogueFacts: {
      productName: 'Odomos Liquid Vaporiser',
      sellingPrice: '₹85',
      fabric: 'Transfluthrin 0.88% w/w PMD active repellent',
      fit: '45 ml Refill (Fits All Machines)',
    },
    requiredEvidence: 'Central Insecticides Board & ASCI norms prohibiting absolute eradication guarantees.',
  },
};

/**
 * Retrieve canonical record by canonicalTestId, uiScenarioId, or adCode
 */
export function getCanonicalScenario(idOrCode: string): CanonicalScenarioRecord | undefined {
  if (!idOrCode) return undefined;
  const key = idOrCode.trim();
  if (CANONICAL_SCENARIO_REGISTRY[key]) {
    return CANONICAL_SCENARIO_REGISTRY[key];
  }
  for (const record of Object.values(CANONICAL_SCENARIO_REGISTRY)) {
    if (
      record.canonicalTestId === key ||
      record.uiScenarioId === key ||
      record.adCode === key ||
      record.testPackId === key ||
      record.expectedAuditDocId === key
    ) {
      return record;
    }
  }
  return undefined;
}

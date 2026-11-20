import { Organisation, PolicyRuleItem, ProductItem } from '../types';

export interface TestItem {
  id: string;
  scenarioId: string;
  adCode: string;
  title: string;
  sku: string;
  image: string;
  expectedStatus: 'FAIL' | 'PASS' | 'NEEDS_VERIFICATION';
  expectedIssue: string;
  primaryRule: string;
  scenarioDescription: string;
  expectedOutcomeDesc: string;
}

/* ─────────────────────────────────────────────────────────────
   ORGANISATIONS: EXACTLY 2 (NOVAWEAR & Dabur - Real Company)
───────────────────────────────────────────────────────────── */
export const DEFAULT_ORGANISATIONS: Organisation[] = [
  {
    id: 'org-novawear',
    name: 'NOVAWEAR',
    legalName: 'NOVAWEAR Retail Private Limited',
    slug: 'novawear',
    industry: 'Apparel & Lifestyle Fashion',
    brandTone: 'Straightforward, authentic, understated daily premium, zero exaggeration',
    currency: 'INR (₹)',
    region: 'India / South Asia',
    color: '#4F46E5', // Indigo
    complianceTolerance: 'Strict',
    isDefault: true,
    logoUrl: '/logos/novawear-logo.svg',
  },
  {
    id: 'org-dabur',
    name: 'Dabur',
    legalName: 'Dabur India Limited (Real-World Enterprise FMCG)',
    slug: 'dabur',
    industry: 'Real FMCG Enterprise • Ayurvedic Healthcare & Personal Care',
    brandTone: 'Real company 140+ years Ayurvedic FMCG enterprise (NSE/BSE listed), live ASCI and legal metrology regulatory benchmark',
    currency: 'INR (₹)',
    region: 'India & Global',
    color: '#059669', // Emerald Dabur Green
    complianceTolerance: 'Strict',
    isDefault: false,
    logoUrl: '/logos/dabur-logo.png',
  },
];

/* ─────────────────────────────────────────────────────────────
   DABUR DATA (PRODUCTS, RULES, TEST CREATIVES)
───────────────────────────────────────────────────────────── */
export const DABUR_PRODUCTS: ProductItem[] = [
  {
    sku: 'DAB-AML-001',
    name: 'Dabur Amla Hair Oil',
    category: 'Hair Care',
    basePrice: '₹180',
    fabric: 'Pure Amla Oil & Natural Antioxidants',
    fit: '275 ml Bottle',
    unapprovedClaims: ['50X Stronger', '100% Hair Fall Stop', 'Regrows Hair in 7 Days'],
    activeCampaign: {
      code: 'DAB-CMP-AML',
      price: '₹165',
      dates: '1–30 Nov 2026',
      conditions: 'National retail & online channels',
    },
  },
  {
    sku: 'DAB-GUL-002',
    name: 'Dabur Gulabari Moisturiser & Cold Cream',
    category: 'Skin Care',
    basePrice: '₹49',
    fabric: '100% Pure Rose Water & Natural Moisturising Actives',
    fit: '50g Tub / 400ml Lotion',
    unapprovedClaims: ['120-Hour Moisturisation', 'Permanent Fairness', 'Instant Wrinkle Eraser'],
    activeCampaign: {
      code: 'DAB-CMP-WIN',
      price: '₹45',
      dates: 'Winter Season 2026',
      conditions: 'Special winter pack discount',
    },
  },
  {
    sku: 'DAB-ODM-003',
    name: 'Odomos Liquid Vaporiser Mosquito Repellent',
    category: 'Home Care',
    basePrice: '₹85',
    fabric: 'Transfluthrin 0.88% w/w PMD active repellent',
    fit: '45 ml Refill (Fits All Machines)',
    unapprovedClaims: ['100% Kills Mosquitoes', 'Zero Bites Guaranteed', 'No Chemicals'],
    activeCampaign: {
      code: 'DAB-CMP-ODM',
      price: '₹79',
      dates: 'Monsoon-Winter 2026',
      conditions: 'Fits all machines promo',
    },
  },
  {
    sku: 'DAB-CHY-004',
    name: 'Dabur Chyawanprash 2X Immunity',
    category: 'Healthcare',
    basePrice: '₹399',
    fabric: '40+ Ayurvedic Herbs & Amla rich formulation',
    fit: '1 kg Jar',
    unapprovedClaims: ['Cures All Diseases', '100% Flu Immunity'],
  },
  {
    sku: 'DAB-HON-005',
    name: 'Dabur 100% Pure Honey',
    category: 'Health Foods',
    basePrice: '₹220',
    fabric: '100% Indigenous Pure Raw Honey',
    fit: '500g Squeezy Pack',
    unapprovedClaims: ['Cures Diabetes', 'Zero Calories'],
  },
  {
    sku: 'DAB-RED-006',
    name: 'Dabur Red Paste Ayurvedic Oral Care',
    category: 'Oral Care',
    basePrice: '₹125',
    fabric: 'Laung, Pudina, Tomar & 13 Ayurvedic Herbs',
    fit: '200g Pack',
    unapprovedClaims: ['Permanent Whitening', 'Dentist Replacement'],
  },
];

export const DABUR_RULES: PolicyRuleItem[] = [
  {
    id: 'DAB-RULE-001',
    title: 'Clinical Efficacy & Strength Multiplier Verification',
    cat: 'Claims & Substantiation',
    desc: 'Efficacy benchmarks (such as hair strength multiplier) must cite authorized clinical lab trials. Claims exceeding certified limits (e.g. 50X) are strictly prohibited.',
    bad: '"Makes hair 50X stronger"',
    good: '"10X Stronger Hair (based on internal lab trial vs non-conditioning hair)"',
    severity: 'CRITICAL',
    isActive: true,
    authoritySourceId: 'SRC-DAB-001',
    sourceLocator: 'Dabur Clinical Research Dossier section 4.1',
  },
  {
    id: 'DAB-RULE-002',
    title: 'Hydration & Moisturisation Duration Limits',
    cat: 'Product Performance',
    desc: 'Moisturisation duration statements must strictly match dermatological test certifications (maximum 72 hours). Uncertified claims like 120 hours are misleading.',
    bad: '"Get 120-Hour Moisturisation"',
    good: '"Get 72-Hour Moisturisation (under controlled test conditions)"',
    severity: 'CRITICAL',
    isActive: true,
    authoritySourceId: 'SRC-DAB-002',
    sourceLocator: 'Gulabari Dermatological Certification Study',
  },
  {
    id: 'DAB-RULE-003',
    title: 'Pest Protection & Absolute Elimination Claims',
    cat: 'Regulatory & Safety',
    desc: 'Mosquito repellent marketing must not claim 100% absolute kill/bite immunity. Must state verified reduction percentages (80% less) with family safety disclaimers.',
    bad: '"100% Kills Mosquitoes / Zero Bites Guaranteed"',
    good: '"80% Less Mosquitoes* (Safety for the Entire Family)"',
    severity: 'CRITICAL',
    isActive: true,
    authoritySourceId: 'SRC-DAB-003',
    sourceLocator: 'Odomos Efficacy Trial & Central Insecticides Board norms',
  },
  {
    id: 'DAB-RULE-004',
    title: 'Mandatory Scientific Asterisk Disclaimer Footnote',
    cat: 'Legal & Regulatory',
    desc: 'All efficacy claims marked with an asterisk (*) must feature an unambiguous, readable scientific methodology footnote at the base of the creative.',
    bad: 'Asterisk placed with missing or microscopic test basis footnote',
    good: '"*Based on controlled trial under standard test conditions. Results may vary."',
    severity: 'WARNING',
    isActive: true,
    authoritySourceId: 'SRC-DAB-004',
    sourceLocator: 'ASCI Code for Self-Regulation in Advertising Section 1.4',
  },
  {
    id: 'DAB-RULE-005',
    title: 'Authentic Ayurvedic Heritage Tone',
    cat: 'Editorial',
    desc: "Maintain Dabur's 140-year trust heritage; communicate gentle, scientifically backed natural nourishment without synthetic hyperbole.",
    bad: '"Magic chemical formula cures hair loss immediately"',
    good: '"The natural nourishment of Pure Amla for healthy, stronger hair"',
    severity: 'TIP',
    isActive: true,
    authoritySourceId: 'SRC-DAB-005',
    sourceLocator: 'Dabur Master Brand Positioning Guide',
  },
];

export const DABUR_TESTS: TestItem[] = [
  {
    id: 'INX-DAB-T01',
    scenarioId: 'DAB-SCENARIO-1',
    adCode: 'DAB-REAL-001',
    title: 'Dabur Amla Hair Oil — 10X Stronger (Genuine)',
    sku: 'DAB-AML-001',
    image: '/ads/dabur/DAB-REAL-001.jpg',
    expectedStatus: 'PASS',
    expectedIssue: 'Compliant claim: "10X Stronger Hair" is backed by clinical study vs non-conditioning oil with valid footnote citation.',
    primaryRule: 'DAB-RULE-001',
    scenarioDescription: 'Official compliant Dabur advertisement with verified clinical strength multiplier and legible scientific disclaimer.',
    expectedOutcomeDesc: 'PASS · Clinical Trial Verified · 0 Violations',
  },
  {
    id: 'INX-DAB-T02',
    scenarioId: 'DAB-SCENARIO-2',
    adCode: 'DAB-REAL-002',
    title: 'Dabur Gulabari — 72-Hour Moisturisation (Genuine)',
    sku: 'DAB-GUL-002',
    image: '/ads/dabur/DAB-REAL-002.png',
    expectedStatus: 'PASS',
    expectedIssue: 'Compliant claim: 72 hours moisturisation supported by dermatological study under controlled conditions.',
    primaryRule: 'DAB-RULE-002',
    scenarioDescription: 'Approved skincare creative with certified 72-hour hydration claim and approved pricing.',
    expectedOutcomeDesc: 'PASS · Certified Hydration Claim · 0 Violations',
  },
  {
    id: 'INX-DAB-T03',
    scenarioId: 'DAB-SCENARIO-3',
    adCode: 'DAB-REAL-003',
    title: 'Odomos Liquid Vaporiser — 80% Less Mosquitoes (Genuine)',
    sku: 'DAB-ODM-003',
    image: '/ads/dabur/DAB-REAL-003.jpg',
    expectedStatus: 'PASS',
    expectedIssue: 'Compliant claim: 80% reduction substantiated by lab efficacy testing with "Fits all machines" and family safety disclosure.',
    primaryRule: 'DAB-RULE-003',
    scenarioDescription: 'Approved household insecticide creative with accurate percentage efficacy statement and safety copy.',
    expectedOutcomeDesc: 'PASS · Substandard Claims Avoided · 0 Violations',
  },
  {
    id: 'INX-DAB-T04',
    scenarioId: 'DAB-SCENARIO-4',
    adCode: 'DAB-FAKE-001',
    title: 'Dabur Amla Hair Oil — 50X Exaggerated Claim (Violation)',
    sku: 'DAB-AML-001',
    image: '/ads/dabur/DAB-FAKE-001.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'Exaggerated / unsupported claim: "Makes hair 50X stronger" deviates from certified 10X clinical benchmark.',
    primaryRule: 'DAB-RULE-001',
    scenarioDescription: 'Exaggerated multiplier violation violating clinical substantiation and ASCI guidelines.',
    expectedOutcomeDesc: 'FAIL · Red Severity Violation · Unsupported 50X Claim',
  },
  {
    id: 'INX-DAB-T05',
    scenarioId: 'DAB-SCENARIO-5',
    adCode: 'DAB-FAKE-002',
    title: 'Dabur Gulabari — 120-Hour Misleading Duration (Violation)',
    sku: 'DAB-GUL-002',
    image: '/ads/dabur/DAB-FAKE-002.png',
    expectedStatus: 'FAIL',
    expectedIssue: "Misleading duration claim: \"120 Hours' of Moisturisation\" exceeds verified 72-hour clinical certification by 66%.",
    primaryRule: 'DAB-RULE-002',
    scenarioDescription: 'Exaggerated hydration longevity without clinical backing.',
    expectedOutcomeDesc: 'FAIL · Red Severity Violation · 120-Hour Misrepresentation',
  },
  {
    id: 'INX-DAB-T06',
    scenarioId: 'DAB-SCENARIO-6',
    adCode: 'DAB-FAKE-003',
    title: 'Odomos — 100% Guaranteed Elimination (Violation)',
    sku: 'DAB-ODM-003',
    image: '/ads/dabur/DAB-FAKE-003.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'False guarantee claim: "100% Kills Mosquitoes All Night" is an unprovable absolute guarantee violating repellent compliance.',
    primaryRule: 'DAB-RULE-003',
    scenarioDescription: 'Absolute immunity guarantee in pest management violating Central Insecticides Board & ASCI norms.',
    expectedOutcomeDesc: 'FAIL · Red Severity Violation · Absolute False Guarantee',
  },
];

/* ─────────────────────────────────────────────────────────────
   NOVAWEAR DATA (DEFAULT FOR FASHION)
───────────────────────────────────────────────────────────── */
export const NOVAWEAR_PRODUCTS: ProductItem[] = [
  {
    sku: 'NW-CS-001',
    name: 'Classic Cotton Shirt',
    category: 'Shirts',
    basePrice: '₹1,299',
    fabric: '100% Cotton',
    fit: 'Regular fit',
    unapprovedClaims: ['Wrinkle-proof', 'Shrink-proof', 'Hypoallergenic'],
  },
  {
    sku: 'NW-CS-002',
    name: 'Everyday Oxford Shirt',
    category: 'Shirts',
    basePrice: '₹1,199',
    fabric: '60% Cotton, 40% Polyester',
    fit: 'Slim / Regular',
    unapprovedClaims: ['100% Cotton', 'Pure Cotton', 'Stain-proof'],
  },
  {
    sku: 'NW-TS-003',
    name: 'Core Crew T-Shirt',
    category: 'T-Shirts',
    basePrice: '₹649',
    fabric: '95% Cotton, 5% Elastane',
    fit: 'Regular fit',
    unapprovedClaims: ['100% Cotton', 'Sweat-proof', 'Odour-proof'],
    activeCampaign: {
      code: 'CMP-26-018',
      price: '₹599',
      dates: '1–15 Nov 2026',
      conditions: 'Selected sizes S–XL',
    },
  },
  {
    sku: 'NW-TS-004',
    name: 'Relaxed Weekend Tee',
    category: 'T-Shirts',
    basePrice: '₹749',
    fabric: '100% Cotton',
    fit: 'Relaxed fit',
    unapprovedClaims: ['Non-shrink', 'Stain-resistant'],
  },
  {
    sku: 'NW-TR-005',
    name: 'Everyday Chino',
    category: 'Trousers',
    basePrice: '₹1,499',
    fabric: '98% Cotton, 2% Elastane',
    fit: 'Slim-straight',
    unapprovedClaims: ['100% Cotton', 'Waterproof'],
    activeCampaign: {
      code: 'CMP-26-021',
      price: '₹1,399',
      dates: '10–20 Nov 2026',
      conditions: 'Pending commercial sign-off',
    },
  },
  {
    sku: 'NW-OS-006',
    name: 'Lightweight Overshirt',
    category: 'Outerwear',
    basePrice: '₹1,899',
    fabric: '70% Cotton, 30% Linen',
    fit: 'Relaxed fit',
    unapprovedClaims: ['Pure Linen', 'Wrinkle-free'],
  },
  {
    sku: 'NW-CS-007',
    name: 'Textured Office Shirt',
    category: 'Shirts',
    basePrice: '₹1,399',
    fabric: '55% Cotton, 45% Viscose',
    fit: 'Tailored fit',
    unapprovedClaims: ['100% Cotton', 'Iron-free'],
  },
  {
    sku: 'NW-TS-008',
    name: 'Graphic Line T-Shirt',
    category: 'T-Shirts',
    basePrice: '₹849',
    fabric: '100% Cotton',
    fit: 'Regular fit',
    unapprovedClaims: ['Fadeproof'],
  },
];

export const NOVAWEAR_RULES: PolicyRuleItem[] = [
  {
    id: 'NW-RULE-001',
    title: 'Fabric Composition Match',
    cat: 'Product',
    desc: 'Fabric claims must exactly match catalogue specifications. No 100% claim on blends.',
    bad: '100% Cotton on 60/40 blend',
    good: 'State certified blend (e.g. 60% Cotton, 40% Polyester)',
    severity: 'CRITICAL',
    isActive: true,
    authoritySourceId: 'SRC-NW-005',
    sourceLocator: 'Product Catalogue sheet; matching SKU row',
  },
  {
    id: 'NW-RULE-002',
    title: 'Campaign Pricing Validity',
    cat: 'Commercial',
    desc: 'Promotional prices require active approved campaign sign-off. Indian Rupees (₹) only.',
    bad: '₹999 when expired or unapproved',
    good: 'Show approved base price ₹1,299 or active campaign',
    severity: 'CRITICAL',
    isActive: true,
    authoritySourceId: 'SRC-NW-005',
    sourceLocator: 'Campaign Offers sheet; matching campaign row',
  },
  {
    id: 'NW-RULE-003',
    title: 'Performance Claims Substantiation',
    cat: 'Consumer',
    desc: 'Functional benefits (wrinkle-proof, waterproof) must be backed by accredited lab test data.',
    bad: '"Wrinkle-Proof" or "Stain-proof"',
    good: '"Easy-care fabric" or accredited test statement',
    severity: 'WARNING',
    isActive: true,
    authoritySourceId: 'SRC-NW-003',
    sourceLocator: 'Product and performance claims section',
  },
  {
    id: 'NW-RULE-004',
    title: 'Delivery SLA Estimates',
    cat: 'Operations',
    desc: 'Next-day delivery guarantees require pincode and order cutoff disclaimers.',
    bad: '"Delivered tomorrow. Guaranteed."',
    good: '"Delivery in 2–4 business days (terms apply)"',
    severity: 'WARNING',
    isActive: true,
    authoritySourceId: 'SRC-NW-004',
    sourceLocator: 'Delivery and fulfilment section',
  },
  {
    id: 'NW-RULE-005',
    title: 'Brand Tone of Voice',
    cat: 'Editorial',
    desc: 'Keep messaging straightforward, premium, and authentic. Avoid hyperbolic superlatives.',
    bad: '"World\'s most revolutionary shirt"',
    good: '"Clean design, engineered for daily comfort"',
    severity: 'TIP',
    isActive: true,
    authoritySourceId: 'SRC-NW-001',
    sourceLocator: '01_Brand_Guidelines.pdf section 3.2',
  },
];

export const NOVAWEAR_TESTS: TestItem[] = [
  {
    id: 'INX-NW-T01',
    scenarioId: 'SCENARIO-2',
    adCode: 'AD-NW-001',
    title: 'Incorrect Advertised Price',
    sku: 'NW-CS-001',
    image: '/ads/AD-NW-001.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'Displayed price does not match base selling price of ₹1,299. The promotional campaign CMP-26-014 expired on 31 Oct 2026 and cannot authorise this discount on 13 Nov 2026.',
    primaryRule: 'NW-RULE-002',
    scenarioDescription: 'Price mismatch audit. Advertisement attempts unapproved discount pricing without active promotional sign-off.',
    expectedOutcomeDesc: 'FAIL · Red Severity Violation · Price Discrepancy',
  },
  {
    id: 'INX-NW-T02',
    scenarioId: 'SCENARIO-3',
    adCode: 'AD-NW-002',
    title: 'Incorrect Fabric Composition',
    sku: 'NW-CS-002',
    image: '/ads/AD-NW-002.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'Claims "100% Cotton" for Everyday Oxford Shirt (NW-CS-002). Ground-truth catalogue specifies 60% Cotton, 40% Polyester blend.',
    primaryRule: 'NW-RULE-001',
    scenarioDescription: 'Material composition audit detecting fiber specification misrepresentation against ground-truth catalogue.',
    expectedOutcomeDesc: 'FAIL · Red Severity Violation · Composition Mismatch',
  },
  {
    id: 'INX-NW-T03',
    scenarioId: 'SCENARIO-4',
    adCode: 'AD-NW-003',
    title: 'Approved Campaign with Conditions',
    sku: 'NW-TS-003',
    image: '/ads/AD-NW-003.png',
    expectedStatus: 'PASS',
    expectedIssue: 'Authorized promotional offer under approved campaign CMP-26-018 at ₹599 with required terms & condition disclosures.',
    primaryRule: 'NW-RULE-002',
    scenarioDescription: 'Valid promotional campaign verification matching SKU, dates, channel, and conditions.',
    expectedOutcomeDesc: 'PASS · Campaign Approved · 0 Violations',
  },
  {
    id: 'INX-NW-T04',
    scenarioId: 'SCENARIO-5',
    adCode: 'AD-NW-004',
    title: 'Pending Campaign Price',
    sku: 'NW-TR-005',
    image: '/ads/AD-NW-004.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'Advertises ₹1,399 under campaign CMP-26-021 whose status is "Pending" and not yet signed off by commercial lead.',
    primaryRule: 'NW-RULE-002',
    scenarioDescription: 'Approval-state audit preventing publication of unapproved promotional pricing.',
    expectedOutcomeDesc: 'FAIL · Approval Gate Enforced · Pending Campaign',
  },
  {
    id: 'INX-NW-T05',
    scenarioId: 'SCENARIO-6',
    adCode: 'AD-NW-005',
    title: 'Unsupported Performance Claim ("Wrinkle-Proof")',
    sku: 'NW-CS-001',
    image: '/ads/AD-NW-005.png',
    expectedStatus: 'NEEDS_VERIFICATION',
    expectedIssue: 'Promises "Wrinkle-Proof" functional benefit without accredited laboratory test substantiation in repository.',
    primaryRule: 'NW-RULE-003',
    scenarioDescription: 'Substantiation check for unverified consumer benefit and functional performance claims.',
    expectedOutcomeDesc: 'NEEDS_VERIFICATION · Amber Flag · Missing Test Data',
  },
  {
    id: 'INX-NW-T06',
    scenarioId: 'SCENARIO-7',
    adCode: 'AD-NW-006',
    title: 'Unapproved Delivery Guarantee',
    sku: '',
    image: '/ads/AD-NW-006.png',
    expectedStatus: 'FAIL',
    expectedIssue: 'Guarantees next-day delivery without pincode or cutoff disclaimers. Repository only authorizes 1–2 business day dispatch.',
    primaryRule: 'NW-RULE-004',
    scenarioDescription: 'Service-level agreement audit detecting unapproved delivery promises lacking SLA qualifications.',
    expectedOutcomeDesc: 'FAIL · Amber Severity Violation · SLA Disclaimer Missing',
  },
  {
    id: 'INX-NW-T07',
    scenarioId: 'SCENARIO-1',
    adCode: 'AD-NW-007',
    title: 'Compliant Product Advertisement',
    sku: 'NW-CS-001',
    image: '/ads/AD-NW-007.png',
    expectedStatus: 'PASS',
    expectedIssue: 'No violations. Validates 100% cotton composition, regular fit, and authorized ₹1,299 base selling price.',
    primaryRule: 'NW-RULE-001',
    scenarioDescription: 'Official compliant advertisement fixture featuring verified catalogue garment specifications.',
    expectedOutcomeDesc: 'PASS · Base Catalogue Verified · 0 Violations',
  },
];

// Fallback defaults for backwards compatibility (NOVAWEAR first)
export const DEFAULT_RULES: PolicyRuleItem[] = NOVAWEAR_RULES;
export const DEFAULT_PRODUCTS: ProductItem[] = NOVAWEAR_PRODUCTS;

const ORGS_KEY = 'integrix_organisations_v4';
const ACTIVE_ORG_KEY = 'integrix_active_org_v4';
const RULES_PREFIX = 'integrix_rules_v4_';
const PRODUCTS_PREFIX = 'integrix_products_v4_';

export const getStoredOrganisations = (): Organisation[] => {
  try {
    const raw = localStorage.getItem(ORGS_KEY);
    if (!raw) return DEFAULT_ORGANISATIONS;
    const parsed = JSON.parse(raw);
    // Ensure only NOVAWEAR and Dabur exist and in correct order
    if (Array.isArray(parsed) && parsed.length === 2 && parsed[0]?.id === 'org-novawear') {
      return parsed;
    }
    return DEFAULT_ORGANISATIONS;
  } catch {
    return DEFAULT_ORGANISATIONS;
  }
};

export const saveStoredOrganisations = (orgs: Organisation[]): void => {
  try {
    localStorage.setItem(ORGS_KEY, JSON.stringify(orgs));
  } catch (e) {
    console.error('Failed to save organisations:', e);
  }
};

export const getStoredActiveOrgId = (): string => {
  try {
    return localStorage.getItem(ACTIVE_ORG_KEY) || 'org-novawear';
  } catch {
    return 'org-novawear';
  }
};

export const saveStoredActiveOrgId = (id: string): void => {
  try {
    localStorage.setItem(ACTIVE_ORG_KEY, id);
  } catch (e) {
    console.error('Failed to save active organisation id:', e);
  }
};

export const getStoredRulesForOrg = (orgId: string): PolicyRuleItem[] => {
  try {
    const raw = localStorage.getItem(`${RULES_PREFIX}${orgId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse rules for org:', e);
  }
  return orgId === 'org-novawear' ? NOVAWEAR_RULES : DABUR_RULES;
};

export const saveStoredRulesForOrg = (orgId: string, rules: PolicyRuleItem[]): void => {
  try {
    localStorage.setItem(`${RULES_PREFIX}${orgId}`, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save rules for org:', e);
  }
};

export const getStoredProductsForOrg = (orgId: string): ProductItem[] => {
  try {
    const raw = localStorage.getItem(`${PRODUCTS_PREFIX}${orgId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to parse products for org:', e);
  }
  return orgId === 'org-novawear' ? NOVAWEAR_PRODUCTS : DABUR_PRODUCTS;
};

export const saveStoredProductsForOrg = (orgId: string, prods: ProductItem[]): void => {
  try {
    localStorage.setItem(`${PRODUCTS_PREFIX}${orgId}`, JSON.stringify(prods));
  } catch (e) {
    console.error('Failed to save products for org:', e);
  }
};

export const getTestsForOrg = (orgId: string): TestItem[] => {
  return orgId === 'org-novawear' ? NOVAWEAR_TESTS : DABUR_TESTS;
};

/* ─────────────────────────────────────────────────────────────
   CAMPAIGNS & SOURCE POLICIES PER ORGANISATION
───────────────────────────────────────────────────────────── */
export interface CampaignItem {
  campaignId: string;
  sku: string;
  campaignPriceInr: number;
  startDate: string;
  endDate: string;
  approvalStatus: 'Approved' | 'Pending' | 'Expired';
  conditions: string;
}

export interface PolicyDocumentItem {
  id: string;
  name: string;
  status: 'Indexed' | 'Pending' | 'Draft';
  category?: string;
  description?: string;
}

export const DABUR_CAMPAIGNS: CampaignItem[] = [
  {
    campaignId: 'CMP-DAB-001',
    sku: 'DAB-AML-001',
    campaignPriceInr: 165,
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    approvalStatus: 'Approved',
    conditions: 'Valid across national GT & MT modern retail and Dabur e-store. Mandatory asterisk footnote required.',
  },
  {
    campaignId: 'CMP-DAB-002',
    sku: 'DAB-GUL-002',
    campaignPriceInr: 45,
    startDate: '2026-11-01',
    endDate: '2026-12-31',
    approvalStatus: 'Approved',
    conditions: 'Winter Radiance Pack discount. Must disclose dermatological study test basis.',
  },
  {
    campaignId: 'CMP-DAB-003',
    sku: 'DAB-ODM-003',
    campaignPriceInr: 79,
    startDate: '2026-10-15',
    endDate: '2026-11-30',
    approvalStatus: 'Approved',
    conditions: 'Applies to 45ml refill pack. Absolute 100% elimination claims prohibited.',
  },
  {
    campaignId: 'CMP-DAB-004',
    sku: 'DAB-CHY-004',
    campaignPriceInr: 369,
    startDate: '2026-11-10',
    endDate: '2026-12-15',
    approvalStatus: 'Pending',
    conditions: 'Pending commercial sign-off from Ayush Legal Directorate.',
  },
];

export const DABUR_POLICIES: PolicyDocumentItem[] = [
  { id: 'SRC-DAB-001', name: '01_Dabur_Ayurvedic_Master_Brand_Guidelines_2026.pdf', status: 'Indexed', category: 'Brand & Heritage', description: 'Tone of voice, Ayurvedic heritage claims, symbol marks, packaging guidelines.' },
  { id: 'SRC-DAB-002', name: '02_ASCI_Code_for_Healthcare_and_Personal_Care.pdf', status: 'Indexed', category: 'Regulatory Standard', description: 'Mandatory substantiate-before-publish rules and comparative advertising code.' },
  { id: 'SRC-DAB-003', name: '03_Dabur_Clinical_Research_&_Efficacy_Substantiation.pdf', status: 'Indexed', category: 'Clinical Dossier', description: 'Accredited lab protocols, tensile strength tests (10X vs baseline), dermatological hydration trials.' },
  { id: 'SRC-DAB-004', name: '04_Central_Insecticides_Board_Regulatory_Compliance.pdf', status: 'Indexed', category: 'Statutory Compliance', description: 'Prohibitions against 100% eradication guarantees, chemical repellent labelling rules.' },
  { id: 'SRC-DAB-005', name: '05_Legal_Metrology_and_Pricing_Directives.pdf', status: 'Indexed', category: 'Pricing & Disclosures', description: 'MRP, batch numbers, consumer care disclosures, and pack size declarations.' },
];

export const NOVAWEAR_CAMPAIGNS: CampaignItem[] = [
  {
    campaignId: 'CMP-26-018',
    sku: 'NW-TS-003',
    campaignPriceInr: 599,
    startDate: '2026-11-10',
    endDate: '2026-11-20',
    approvalStatus: 'Approved',
    conditions: 'Exclusive to app and web channels; returns accepted within standard 14-day window.',
  },
  {
    campaignId: 'CMP-26-021',
    sku: 'NW-TR-005',
    campaignPriceInr: 1399,
    startDate: '2026-11-15',
    endDate: '2026-11-25',
    approvalStatus: 'Pending',
    conditions: 'Awaiting commercial sign-off; not valid for public advertising.',
  },
  {
    campaignId: 'CMP-26-025',
    sku: 'NW-OS-006',
    campaignPriceInr: 1699,
    startDate: '2026-11-01',
    endDate: '2026-11-15',
    approvalStatus: 'Approved',
    conditions: 'Limited stock tier; terms apply while supplies last.',
  },
];

export const NOVAWEAR_POLICIES: PolicyDocumentItem[] = [
  { id: 'SRC-NW-001', name: '01_Brand_Guidelines.pdf', status: 'Indexed', category: 'Brand Guidelines', description: 'Tone of voice, logo protection zones, approved colour codes (#1A2B4C navy), font hierarchies.' },
  { id: 'SRC-NW-002', name: '02_Company_Profile.pdf', status: 'Indexed', category: 'Corporate Profile', description: 'Legal entity details, registered trade names, corporate governance, key contacts.' },
  { id: 'SRC-NW-003', name: '03_Marketing_and_Communication_Policy.pdf', status: 'Indexed', category: 'Marketing Policy', description: 'Claims substantiation standards, prohibited superlatives, social media guidelines, influencer rules.' },
  { id: 'SRC-NW-004', name: '04_Product_and_Customer_Information_Policy.pdf', status: 'Indexed', category: 'Product Policy', description: 'Fibre composition disclosure rules, country of origin, size charting, care label standards.' },
  { id: 'SRC-NW-005', name: '05_Product_Catalogue_and_Campaigns.xlsx', status: 'Indexed', category: 'Product Catalogue & Campaigns', description: 'Master spreadsheet with approved SKU compositions, pricing floors (₹899), and discount bounds.' },
  { id: 'SRC-NW-006', name: '06_Universal_Policy_Document_Template.docx', status: 'Indexed', category: 'Governance Word Template', description: 'Standard enterprise Word document template defining policy hierarchy and compliance terms.' },
  { id: 'SRC-NW-007', name: '07_Generated_Policy_Profile_Draft.docx', status: 'Indexed', category: 'Policy Profile Synthesis', description: 'Comprehensive drafted policy profile synthesized by AI for NOVAWEAR commercial governance.' },
  { id: 'SRC-NW-008', name: 'Colour_Reference.txt', status: 'Indexed', category: 'Style Palette Reference', description: 'Exact RGB and HEX colour specification file for brand and packaging collateral.' },
  { id: 'SRC-NW-009', name: 'README.txt', status: 'Indexed', category: 'Repository Manifest', description: 'Master document repository manifest and regulatory ingestion checklist.' },
];

export const getCampaignsForOrg = (orgId: string): CampaignItem[] => {
  return orgId === 'org-novawear' ? NOVAWEAR_CAMPAIGNS : DABUR_CAMPAIGNS;
};

export const getPoliciesForOrg = (orgId: string): PolicyDocumentItem[] => {
  return orgId === 'org-novawear' ? NOVAWEAR_POLICIES : DABUR_POLICIES;
};

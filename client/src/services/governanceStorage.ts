import { Organisation, PolicyRuleItem, ProductItem } from '../types';

export const DEFAULT_ORGANISATIONS: Organisation[] = [
  {
    id: 'org-novawear',
    name: 'NOVAWEAR',
    legalName: 'NOVAWEAR Retail Private Limited',
    slug: 'novawear',
    industry: 'Apparel & Lifestyle Fashion',
    brandTone: 'Straightforward, authentic, understated daily premium',
    currency: 'INR (₹)',
    region: 'India / South Asia',
    color: '#4F46E5', // Indigo
    complianceTolerance: 'Strict',
    isDefault: true,
  },
  {
    id: 'org-aura',
    name: 'AURA Organics',
    legalName: 'Aura Skincare & Botanical Labs Ltd.',
    slug: 'aura-organics',
    industry: 'Cosmetics & Personal Wellness',
    brandTone: 'Clinical, transparent, gentle, scientific yet holistic',
    currency: 'INR (₹)',
    region: 'India & Global',
    color: '#059669', // Emerald
    complianceTolerance: 'Strict',
  },
  {
    id: 'org-velox',
    name: 'VELOX Performance',
    legalName: 'Velox Athletic Gear Global Inc.',
    slug: 'velox-gear',
    industry: 'High-Performance Sportswear',
    brandTone: 'Bold, energetic, technically precise, athletic excellence',
    currency: 'INR (₹)',
    region: 'Global / Multi-region',
    color: '#D97706', // Amber
    complianceTolerance: 'Standard',
  },
];

export const DEFAULT_RULES: PolicyRuleItem[] = [
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

export const DEFAULT_PRODUCTS: ProductItem[] = [
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

const ORGS_KEY = 'integrix_organisations_v2';
const ACTIVE_ORG_KEY = 'integrix_active_org_v2';
const RULES_KEY = 'integrix_policy_rules_v2';
const PRODUCTS_KEY = 'integrix_products_v2';

export const getStoredOrganisations = (): Organisation[] => {
  try {
    const raw = localStorage.getItem(ORGS_KEY);
    if (!raw) return DEFAULT_ORGANISATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_ORGANISATIONS;
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

export const getStoredRules = (): PolicyRuleItem[] => {
  try {
    const raw = localStorage.getItem(RULES_KEY);
    if (!raw) return DEFAULT_RULES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
};

export const saveStoredRules = (rules: PolicyRuleItem[]): void => {
  try {
    localStorage.setItem(RULES_KEY, JSON.stringify(rules));
  } catch (e) {
    console.error('Failed to save policy rules:', e);
  }
};

export const getStoredProducts = (): ProductItem[] => {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    if (!raw) return DEFAULT_PRODUCTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRODUCTS;
  } catch {
    return DEFAULT_PRODUCTS;
  }
};

export const saveStoredProducts = (prods: ProductItem[]): void => {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(prods));
  } catch (e) {
    console.error('Failed to save products:', e);
  }
};

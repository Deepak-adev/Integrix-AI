import React, { useState, useEffect } from 'react';
import {
  Building2,
  FolderOpen,
  FileText,
  Cpu,
  FileCheck2,
  CheckSquare,
  BookOpen,
  Zap,
  AlertTriangle,
  Scale,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Upload,
  Sparkles,
  Info,
  ShieldCheck,
  Download,
  Eye,
  ExternalLink,
  Lock,
  ArrowRight,
  ArrowLeft,
  Filter,
  Check,
  CheckCircle,
  CircleDot,
  X,
  AlertCircle,
  ShoppingBag,
  HeartPulse,
  Landmark,
  GraduationCap,
  Utensils,
  CarFront,
  RadioTower
} from 'lucide-react';

export type LifecycleStage =
  | 'org'
  | 'sector'
  | 'docs'
  | 'extraction'
  | 'review'
  | 'approval'
  | 'repository'
  | 'audit'
  | 'report'
  | 'decision';

export type StageStatus = 'COMPLETED' | 'CURRENT' | 'UPCOMING' | 'NEEDS_ATTENTION';

export interface OrgProfile {
  name: string;
  industry: string;
  location: string;
  description: string;
  website: string;
  isSample: boolean;
}

export interface SectorItem {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'ACTIVE' | 'PLANNED';
  badge: string;
}

export interface SampleDoc {
  id: string;
  filename: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  path: string;
  uploaded: boolean;
  status: 'pending' | 'uploaded' | 'extracted';
}

export interface ExtractedFact {
  id: string;
  category: 'PRODUCT' | 'CAMPAIGN' | 'POLICY';
  title: string;
  fact: string;
  sourceDoc: string;
  sourcePage: string;
  confidence: number;
  status: 'CONFIRMED' | 'NEEDS_VERIFICATION' | 'CONFLICTING';
}

export interface PolicyDraft {
  id: string;
  ruleId: string;
  title: string;
  category: string;
  description: string;
  condition: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sourceDocument: string;
  rationale: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
}

export interface AdminDecision {
  adId: string;
  action: 'APPROVE' | 'REJECT' | 'EDIT' | 'REQUEST_CHANGES' | 'EXCEPTION';
  adminName: string;
  timestamp: string;
  comments: string;
  rejectionReason?: string;
  exceptionExpiry?: string;
}

// Stage-to-app-page mapping for direct navigation if requested
export const STAGE_PAGE_MAP: Partial<Record<LifecycleStage, string>> = {
  audit: 'audit',
  report: 'audit-history',
  repository: 'rules',
  decision: 'approval-centre',
};

interface LifecycleManagerProps {
  currentStage: LifecycleStage;
  onStageChange: (stage: LifecycleStage) => void;
  onAuditScenarioSelect?: (scenarioId: string) => void;
  onNavigateToAudit?: () => void;
  /** Navigate to any named app page */
  onNavigateTo?: (page: string) => void;
  onBackToHome?: () => void;
  onSwitchOrg?: () => void;
  activeOrgName?: string;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({
  currentStage,
  onStageChange,
  onAuditScenarioSelect,
  onNavigateToAudit,
  onNavigateTo,
  onBackToHome,
  onSwitchOrg,
  activeOrgName,
}) => {
  // ─────────────────────────────────────────────────────────────
  // 1. STATE INITIALIZATION & LOCALSTORAGE PERSISTENCE
  // ─────────────────────────────────────────────────────────────

  // Default Organisation
  const defaultOrg: OrgProfile = {
    name: 'NOVAWEAR Retail Private Limited',
    industry: 'Retail & Fashion Apparel',
    location: 'Chennai, Tamil Nadu, India',
    description:
      'Direct-to-consumer sustainable apparel brand offering premium cotton shirts, polos, and chinos with strict claims substantiation standards.',
    website: 'https://novawear.demo.integrix.ai',
    isSample: true,
  };

  const [org, setOrg] = useState<OrgProfile>(() => {
    try {
      const saved = localStorage.getItem('integrix_org_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultOrg;
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_org_profile', JSON.stringify(org));
    } catch {}
  }, [org]);

  // Sector State
  const [selectedSector, setSelectedSector] = useState<string>(() => {
    try {
      return localStorage.getItem('integrix_selected_sector') || 'retail';
    } catch {}
    return 'retail';
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_selected_sector', selectedSector);
    } catch {}
  }, [selectedSector]);

  const [sectorModalInfo, setSectorModalInfo] = useState<SectorItem | null>(null);

  const sectors: SectorItem[] = [
    {
      id: 'retail',
      name: 'Retail & Fashion',
      description: 'Apparel, fabric authenticity, promotional pricing, delivery SLAs, and consumer protection.',
      icon: ShoppingBag,
      status: 'ACTIVE',
      badge: 'ACTIVE WORKING SECTOR',
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Pharma',
      description: 'Clinical efficacy claims, drug dosage advertising, side-effect disclosures, and CDSCO/FDA compliance.',
      icon: HeartPulse,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'finance',
      name: 'Banking & Financial Services',
      description: 'Interest rate disclosures, credit APR truth-in-advertising, investment risk warnings, RBI/SEBI standards.',
      icon: Landmark,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'education',
      name: 'Education & EdTech',
      description: 'Placement guarantees, accredited degrees verification, course refund mandates, and UGC/AICTE norms.',
      icon: GraduationCap,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'food',
      name: 'Food & Beverages',
      description: 'FSSAI standards, organic certifications, nutritional claims, allergen disclosures, and shelf-life policies.',
      icon: Utensils,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'auto',
      name: 'Automotive & EV',
      description: 'Range verification, ARAI fuel economy substantiation, safety rating citations, and battery warranty terms.',
      icon: CarFront,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'telecom',
      name: 'Telecommunications',
      description: 'Network coverage maps, unlimited data fair usage policies (FUP), speed guarantees, and TRAI consumer safeguards.',
      icon: RadioTower,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'realestate',
      name: 'Real Estate & Infrastructure',
      description: 'RERA registration numbers, carpet area disclosures, project handover timelines, and amenity veracity.',
      icon: Building2,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
    {
      id: 'other',
      name: 'Cross-Industry Governance',
      description: 'Custom rule engine tailored to multinational conglomerate compliance matrices.',
      icon: ShieldCheck,
      status: 'PLANNED',
      badge: 'PLANNED SECTOR',
    },
  ];

  // Document Upload State
  const initialDocs: SampleDoc[] = [
    {
      id: 'doc-1',
      filename: '01_Brand_Guidelines.pdf',
      title: 'NOVAWEAR Brand Guidelines',
      description: 'Tone of voice, logo protection zones, approved colour codes (#1A2B4C navy), font hierarchies, and core brand mission.',
      fileType: 'PDF Document',
      fileSize: '9.8 KB',
      path: '/sample-docs/01_Brand_Guidelines.pdf',
      uploaded: true,
      status: 'uploaded',
    },
    {
      id: 'doc-2',
      filename: '02_Company_Profile.pdf',
      title: 'Corporate Capabilities & Logistics Profile',
      description: 'Operational footprint, warehouse locations (Chennai), standard shipping SLAs (3-5 business days across India), express limitations.',
      fileType: 'PDF Document',
      fileSize: '6.0 KB',
      path: '/sample-docs/02_Company_Profile.pdf',
      uploaded: true,
      status: 'uploaded',
    },
    {
      id: 'doc-3',
      filename: '03_Marketing_and_Communication_Policy.pdf',
      title: 'Marketing & Communication Policy (MCP-01)',
      description: 'Mandatory claim substantiation requirements, superlative term restrictions ("100% Guaranteed"), disclaimer placement, and promotional terms.',
      fileType: 'PDF Document',
      fileSize: '6.4 KB',
      path: '/sample-docs/03_Marketing_and_Communication_Policy.pdf',
      uploaded: true,
      status: 'uploaded',
    },
    {
      id: 'doc-4',
      filename: '04_Product_and_Customer_Information_Policy.pdf',
      title: 'Product & Customer Service Policy (PCIP-01)',
      description: 'Fabric disclosure rules, reverse logistics SLA (15-day return policy), exchange conditions, and customer support response mandates.',
      fileType: 'PDF Document',
      fileSize: '5.9 KB',
      path: '/sample-docs/04_Product_and_Customer_Information_Policy.pdf',
      uploaded: true,
      status: 'uploaded',
    },
    {
      id: 'doc-5',
      filename: '05_Product_Catalogue_and_Campaigns.xlsx',
      title: 'Official Product Catalogue & Active Campaigns',
      description: 'Verified 8 SKUs (Classic Cotton Shirt ₹1,499, Essential Polo ₹999, etc.), exact fabric blends, discount caps (max 40%), and seasonal campaign codes.',
      fileType: 'Excel Spreadsheet',
      fileSize: '9.4 KB',
      path: '/sample-docs/05_Product_Catalogue_and_Campaigns.xlsx',
      uploaded: true,
      status: 'uploaded',
    },
  ];

  const [docs, setDocs] = useState<SampleDoc[]>(() => {
    try {
      const saved = localStorage.getItem('integrix_uploaded_docs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDocs;
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_uploaded_docs', JSON.stringify(docs));
    } catch {}
  }, [docs]);

  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Extracted Facts State
  const extractedFacts: ExtractedFact[] = [
    {
      id: 'fact-1',
      category: 'PRODUCT',
      title: 'NW-CS-001 Fabric Composition',
      fact: '100% Long-Staple Combed Cotton. Hand wash or gentle machine wash.',
      sourceDoc: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourcePage: 'Tab: Product_Master, Row 2',
      confidence: 0.99,
      status: 'CONFIRMED',
    },
    {
      id: 'fact-2',
      category: 'PRODUCT',
      title: 'NW-CS-002 Fabric Composition',
      fact: '60% Cotton, 40% Polyester blended fabric. Must NOT be advertised as 100% Pure Cotton.',
      sourceDoc: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourcePage: 'Tab: Product_Master, Row 3',
      confidence: 0.98,
      status: 'CONFIRMED',
    },
    {
      id: 'fact-3',
      category: 'PRODUCT',
      title: 'NW-CS-001 Official Catalogue Pricing',
      fact: 'Base MRP: ₹1,499. Minimum allowed promotional floor: ₹899.',
      sourceDoc: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourcePage: 'Tab: Product_Master, Row 2',
      confidence: 0.99,
      status: 'CONFIRMED',
    },
    {
      id: 'fact-4',
      category: 'CAMPAIGN',
      title: 'End of Season Sale (EOSS) Discount Boundary',
      fact: 'Maximum advertised discount capped at "UP TO 40% OFF". Any claim of 50%+ without CEO waiver is strictly prohibited.',
      sourceDoc: '03_Marketing_and_Communication_Policy.pdf',
      sourcePage: 'Section 4.1: Promotional Pricing',
      confidence: 0.96,
      status: 'CONFIRMED',
    },
    {
      id: 'fact-5',
      category: 'POLICY',
      title: 'Express Delivery Commitments',
      fact: 'Same-day or next-day delivery claims are restricted strictly to Chennai metro limits. Pan-India delivery SLA is 3-5 business days.',
      sourceDoc: '02_Company_Profile.pdf',
      sourcePage: 'Section 3: Supply Chain SLAs',
      confidence: 0.97,
      status: 'CONFIRMED',
    },
    {
      id: 'fact-6',
      category: 'POLICY',
      title: 'Mandatory Legal Disclaimers',
      fact: 'Promotional ads featuring discounts or conditional offers must carry legible disclaimer text: "*T&C Apply. Valid until stocks last."',
      sourceDoc: '03_Marketing_and_Communication_Policy.pdf',
      sourcePage: 'Section 5.2: Footnote Legibility',
      confidence: 0.95,
      status: 'CONFIRMED',
    },
  ];

  // Policy Drafts State
  const initialDrafts: PolicyDraft[] = [
    {
      id: 'draft-1',
      ruleId: 'NW-R-001',
      title: 'Fabric Composition Veracity',
      category: 'Product Claims',
      description: 'Creatives must accurately reflect certified product composition from the catalogue master.',
      condition: 'IF creative claims fabric = "100% Cotton" AND product catalogue fabric != 100% Cotton THEN FAIL (Severity: CRITICAL)',
      severity: 'CRITICAL',
      sourceDocument: '04_Product_and_Customer_Information_Policy.pdf (Section 2.1)',
      rationale: 'Misrepresenting synthetic blend shirts as pure cotton violates Consumer Protection Act and NOVAWEAR quality commitments.',
      status: 'APPROVED',
    },
    {
      id: 'draft-2',
      ruleId: 'NW-R-002',
      title: 'Promotional Pricing & Discount Consistency',
      category: 'Pricing Compliance',
      description: 'All prices and discount percentages must match active approved campaign tables.',
      condition: 'IF advertised discount > active campaign maximum discount THEN FAIL (Severity: HIGH)',
      severity: 'HIGH',
      sourceDocument: '05_Product_Catalogue_and_Campaigns.xlsx (Tab: Campaigns)',
      rationale: 'Overstating discounts creates unfulfillable checkout expectations and regulatory scrutiny.',
      status: 'APPROVED',
    },
    {
      id: 'draft-3',
      ruleId: 'NW-R-003',
      title: 'Express Delivery SLA Substantiation',
      category: 'Operations & Fulfillment',
      description: 'Fast delivery promises must specify geographical limitations (Chennai metro only).',
      condition: 'IF creative claims "Next Day Delivery" WITHOUT explicit "Chennai only" qualification THEN FAIL (Severity: HIGH)',
      severity: 'HIGH',
      sourceDocument: '02_Company_Profile.pdf (Section 3: Logistics Capabilities)',
      rationale: 'Pan-India logistics partners require 3-5 business days; unqualified express claims trigger consumer disputes.',
      status: 'APPROVED',
    },
    {
      id: 'draft-4',
      ruleId: 'NW-R-004',
      title: 'Mandatory Campaign Disclaimer Inclusion',
      category: 'Legal & Regulatory',
      description: 'Promotional and discount advertising must include the mandatory asterisk disclaimer.',
      condition: 'IF creative includes promotional price or discount AND creative text DOES NOT contain "T&C" OR "Terms" THEN FAIL (Severity: MEDIUM)',
      severity: 'MEDIUM',
      sourceDocument: '03_Marketing_and_Communication_Policy.pdf (Section 5)',
      rationale: 'Statutory compliance requires clear terms and condition notifications on all promotional collateral.',
      status: 'APPROVED',
    },
    {
      id: 'draft-5',
      ruleId: 'NW-R-005',
      title: 'Unsubstantiated Eco-Friendly & Sustainability Claims',
      category: 'Brand Governance',
      description: 'Claims such as "100% Organic" or "Zero Carbon" require accredited certification IDs.',
      condition: 'IF creative claims "Organic" OR "Zero Carbon" AND SKU not certified in GOTS registry THEN NEEDS_VERIFICATION (Severity: MEDIUM)',
      severity: 'MEDIUM',
      sourceDocument: '01_Brand_Guidelines.pdf (Section 6: Sustainable Messaging)',
      rationale: 'Protects brand against greenwashing complaints by mandating third-party audit trail.',
      status: 'APPROVED',
    },
  ];

  const [policyDrafts, setPolicyDrafts] = useState<PolicyDraft[]>(() => {
    try {
      const saved = localStorage.getItem('integrix_policy_drafts');
      if (saved) return JSON.parse(saved);
    } catch {}
    return initialDrafts;
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_policy_drafts', JSON.stringify(policyDrafts));
    } catch {}
  }, [policyDrafts]);

  const [rejectingDraftId, setRejectingDraftId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Admin Decisions State
  const defaultDecisions: Record<string, AdminDecision> = {
    'AD-NW-001': {
      adId: 'AD-NW-001',
      action: 'APPROVE',
      adminName: 'Lead Compliance Administrator',
      timestamp: '2026-11-15 14:32 IST',
      comments: 'Fully verified against NW-CS-001 specs and approved EOSS campaign price (₹999).',
    },
    'AD-NW-002': {
      adId: 'AD-NW-002',
      action: 'REJECT',
      adminName: 'Lead Compliance Administrator',
      timestamp: '2026-11-15 15:10 IST',
      comments: 'Critical pricing mismatch. Advertised ₹799 is ₹200 below catalogue floor price of ₹999.',
      rejectionReason: 'Pricing violation: Below authorised campaign floor price.',
    },
  };

  const [adminDecisions, setAdminDecisions] = useState<Record<string, AdminDecision>>(() => {
    try {
      const saved = localStorage.getItem('integrix_admin_decisions');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultDecisions;
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_admin_decisions', JSON.stringify(adminDecisions));
    } catch {}
  }, [adminDecisions]);

  const [activeDecisionAd, setActiveDecisionAd] = useState<string>('AD-NW-002');
  const [decisionAction, setDecisionAction] = useState<AdminDecision['action']>('REJECT');
  const [decisionComments, setDecisionComments] = useState<string>(
    'Pricing violation detected: Advertised price of ₹799 violates minimum floor price rule NW-R-002.'
  );
  const [decisionRejectionReason, setDecisionRejectionReason] = useState<string>(
    'Pricing violation: Below authorised campaign floor price.'
  );
  const [decisionExceptionExpiry, setDecisionExceptionExpiry] = useState<string>('2026-12-31');

  // ─────────────────────────────────────────────────────────────
  // 2. LIFECYCLE REGISTRY: 4 PHASES & 10 STAGES
  // ─────────────────────────────────────────────────────────────

  const stages: {
    id: LifecycleStage;
    number: number;
    label: string;
    short: string;
    phaseId: string;
    phaseNumber: string;
    phaseTitle: string;
  }[] = [
    { id: 'org', number: 1, label: 'Organisation Onboarding', short: 'Org Setup', phaseId: 'phase-1', phaseNumber: 'PHASE 01', phaseTitle: 'ORGANISATION SETUP' },
    { id: 'sector', number: 2, label: 'Sector Selection', short: 'Sector', phaseId: 'phase-1', phaseNumber: 'PHASE 01', phaseTitle: 'ORGANISATION SETUP' },
    { id: 'docs', number: 3, label: 'Document Upload', short: 'Documents', phaseId: 'phase-1', phaseNumber: 'PHASE 01', phaseTitle: 'ORGANISATION SETUP' },
    { id: 'extraction', number: 4, label: 'AI Document Extraction', short: 'AI Extraction', phaseId: 'phase-2', phaseNumber: 'PHASE 02', phaseTitle: 'POLICY GOVERNANCE' },
    { id: 'review', number: 5, label: 'Policy Draft & Review', short: 'Policy Review', phaseId: 'phase-2', phaseNumber: 'PHASE 02', phaseTitle: 'POLICY GOVERNANCE' },
    { id: 'approval', number: 6, label: 'Administrator Approval', short: 'Admin Approval', phaseId: 'phase-2', phaseNumber: 'PHASE 02', phaseTitle: 'POLICY GOVERNANCE' },
    { id: 'repository', number: 7, label: 'Versioned Policy Repository', short: 'Policy Repository', phaseId: 'phase-2', phaseNumber: 'PHASE 02', phaseTitle: 'POLICY GOVERNANCE' },
    { id: 'audit', number: 8, label: 'Creative Audit Studio', short: 'Audit Studio', phaseId: 'phase-3', phaseNumber: 'PHASE 03', phaseTitle: 'CONTENT VERIFICATION' },
    { id: 'report', number: 9, label: 'Violation Report', short: 'Violation Report', phaseId: 'phase-3', phaseNumber: 'PHASE 03', phaseTitle: 'CONTENT VERIFICATION' },
    { id: 'decision', number: 10, label: 'Administrator Decision', short: 'Final Decision', phaseId: 'phase-4', phaseNumber: 'PHASE 04', phaseTitle: 'FINAL DECISION' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);
  const safeCurrentStageIndex = currentStageIndex >= 0 ? currentStageIndex : 0;
  const currentStageObj = stages[safeCurrentStageIndex];

  // Helper to determine if a stage is actually completed based on application state
  const isStageComplete = (stageId: LifecycleStage): boolean => {
    switch (stageId) {
      case 'org':
        return Boolean(org.name && org.industry && org.location);
      case 'sector':
        return selectedSector === 'retail';
      case 'docs':
        return docs.length > 0 && docs.every((d) => d.uploaded);
      case 'extraction':
        return extractedFacts.length >= 6;
      case 'review':
        return policyDrafts.length > 0;
      case 'approval':
        return (
          policyDrafts.length > 0 &&
          policyDrafts.every((d) => d.status === 'APPROVED' || d.status === 'REJECTED') &&
          policyDrafts.some((d) => d.status === 'APPROVED')
        );
      case 'repository':
        return policyDrafts.some((d) => d.status === 'APPROVED');
      case 'audit':
        return safeCurrentStageIndex >= 7;
      case 'report':
        return safeCurrentStageIndex >= 8;
      case 'decision':
        return Object.keys(adminDecisions).length > 0;
      default:
        return false;
    }
  };

  const getStageStatus = (stageId: LifecycleStage): StageStatus => {
    if (stageId === currentStage) {
      return 'CURRENT';
    }
    if (stageId === 'approval') {
      const hasPending = policyDrafts.some((d) => d.status === 'PENDING_REVIEW');
      if (hasPending && safeCurrentStageIndex > 5) {
        return 'NEEDS_ATTENTION';
      }
    }
    if (isStageComplete(stageId)) {
      return 'COMPLETED';
    }
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx < safeCurrentStageIndex) {
      return 'NEEDS_ATTENTION';
    }
    return 'UPCOMING';
  };

  // 4 Grouped Lifecycle Phases
  const phases = [
    {
      id: 'phase-1',
      number: 'PHASE 01',
      title: 'ORGANISATION SETUP',
      firstStage: 'org' as LifecycleStage,
      description: 'Corporate profile, sector guardrails, and compliance source documents.',
      stages: [
        { id: 'org' as LifecycleStage, number: 1, name: 'Organisation Onboarding', short: 'Org Setup', desc: 'Configure brand profile, commercial scope and parameters.' },
        { id: 'sector' as LifecycleStage, number: 2, name: 'Sector Selection', short: 'Sector', desc: 'Select regulated sector guardrails (Retail & Fashion active).' },
        { id: 'docs' as LifecycleStage, number: 3, name: 'Document Upload', short: 'Documents', desc: 'Ingest brand guidelines, policies, and product catalogue master.' },
      ],
      guidance: 'Begin by configuring your organisation and providing its source documents.',
    },
    {
      id: 'phase-2',
      number: 'PHASE 02',
      title: 'POLICY GOVERNANCE',
      firstStage: 'extraction' as LifecycleStage,
      description: 'Rule synthesis, policy drafts review, and certified rulebooks.',
      stages: [
        { id: 'extraction' as LifecycleStage, number: 4, name: 'AI Document Extraction', short: 'Extraction', desc: 'Extract operational facts and policy clauses from documents.' },
        { id: 'review' as LifecycleStage, number: 5, name: 'Policy Draft & Review', short: 'Draft Review', desc: 'Examine synthesised rule conditions, severity levels, and citations.' },
        { id: 'approval' as LifecycleStage, number: 6, name: 'Administrator Approval', short: 'Sign-off', desc: 'Authorize and activate rules to govern live commercial advertising.' },
        { id: 'repository' as LifecycleStage, number: 7, name: 'Versioned Policy Repository', short: 'Repository', desc: 'Audit published active rules, versions, and executable rulebook.' },
      ],
      guidance: 'Review extracted policies, approve applicable rules and establish your versioned repository.',
    },
    {
      id: 'phase-3',
      number: 'PHASE 03',
      title: 'CONTENT VERIFICATION',
      firstStage: 'audit' as LifecycleStage,
      description: 'Multi-modal visual OCR audit, claim checking, and violation analysis.',
      stages: [
        { id: 'audit' as LifecycleStage, number: 8, name: 'Creative Audit Studio', short: 'Audit Studio', desc: 'Run multi-modal OCR extraction and automated policy evaluation.' },
        { id: 'report' as LifecycleStage, number: 9, name: 'Violation Report', short: 'Violation Report', desc: 'Inspect breach severity, verbatim evidence excerpts, and remediation.' },
      ],
      guidance: 'Submit creative content for verification against your approved policies.',
    },
    {
      id: 'phase-4',
      number: 'PHASE 04',
      title: 'FINAL DECISION',
      firstStage: 'decision' as LifecycleStage,
      description: 'Authoritative administrator sign-offs, exceptions, and audit logs.',
      stages: [
        { id: 'decision' as LifecycleStage, number: 10, name: 'Administrator Decision', short: 'Decision', desc: 'Sign off, reject, or request revisions with immutable audit log entries.' },
      ],
      guidance: 'Review audit findings and record the administrator final decision.',
    },
  ];

  // Active Phase calculation
  const activePhaseIndex = phases.findIndex((p) => p.stages.some((s) => s.id === currentStage));
  const safeActivePhaseIndex = activePhaseIndex >= 0 ? activePhaseIndex : 0;
  const activePhase = phases[safeActivePhaseIndex];

  // Phase metrics helper
  const getPhaseMetrics = (phaseIndex: number) => {
    const phase = phases[phaseIndex];
    const completedStages = phase.stages.filter((s) => isStageComplete(s.id)).length;
    const totalStages = phase.stages.length;
    const isCompleted = completedStages === totalStages;
    const isActive = safeActivePhaseIndex === phaseIndex;
    const progressPct = Math.round((completedStages / totalStages) * 100);

    let statusText: 'COMPLETED' | 'IN PROGRESS' | 'UPCOMING' = 'UPCOMING';
    if (isCompleted) {
      statusText = 'COMPLETED';
    } else if (isActive || completedStages > 0) {
      statusText = 'IN PROGRESS';
    }

    return {
      completedStages,
      totalStages,
      isCompleted,
      isActive,
      progressPct,
      statusText,
    };
  };

  // Overall lifecycle progress
  const totalCompletedStages = stages.filter((s) => isStageComplete(s.id)).length;
  const totalStagesCount = stages.length;
  const overallProgressPct = Math.round((totalCompletedStages / totalStagesCount) * 100);

  // ─────────────────────────────────────────────────────────────
  // 3. ACTION HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleApproveDraft = (id: string) => {
    setPolicyDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED', rejectionReason: undefined } : d))
    );
    setUploadToast('Policy rule approved and marked ACTIVE for rulebook execution.');
    setTimeout(() => setUploadToast(null), 3000);
  };

  const handleApproveAllDrafts = () => {
    setPolicyDrafts((prev) =>
      prev.map((d) => ({ ...d, status: 'APPROVED', rejectionReason: undefined }))
    );
    setUploadToast('All 5 synthesized policy rules approved and certified for repository publishing.');
    setTimeout(() => setUploadToast(null), 3500);
  };

  const handleRejectDraft = (id: string) => {
    if (!rejectReason.trim()) return;
    setPolicyDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'REJECTED', rejectionReason: rejectReason } : d))
    );
    setRejectingDraftId(null);
    setRejectReason('');
    setUploadToast('Draft policy rejected. Rationale logged in audit trail.');
    setTimeout(() => setUploadToast(null), 3000);
  };

  const handleSaveDecision = () => {
    const newDecision: AdminDecision = {
      adId: activeDecisionAd,
      action: decisionAction,
      adminName: 'Lead Compliance Administrator',
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      comments: decisionComments,
      rejectionReason: decisionAction === 'REJECT' ? decisionRejectionReason : undefined,
      exceptionExpiry: decisionAction === 'EXCEPTION' ? decisionExceptionExpiry : undefined,
    };
    setAdminDecisions((prev) => ({ ...prev, [activeDecisionAd]: newDecision }));
    setUploadToast(`Decision saved: ${decisionAction} recorded for ${activeDecisionAd}`);
    setTimeout(() => setUploadToast(null), 3000);
  };

  // Canonical NOVAWEAR Creatives for Stage 8 preview
  const canonicalPosters = [
    { id: 'AD-NW-001', title: 'Classic Cotton Shirt', sku: 'NW-CS-001', price: '₹999', outcome: 'PASS', issue: 'None (Approved Campaign)' },
    { id: 'AD-NW-002', title: 'Classic Cotton Shirt', sku: 'NW-CS-001', price: '₹799', outcome: 'FAIL', issue: 'Price below campaign floor (₹999)' },
    { id: 'AD-NW-003', title: 'Festive Kurta', sku: 'NW-CK-002', price: '₹1,299', outcome: 'FAIL', issue: 'Fabric blend misrepresented as 100% Cotton' },
    { id: 'AD-NW-004', title: 'Essential Polo Tee', sku: 'NW-EP-003', price: '₹899', outcome: 'PASS', issue: 'None (Approved Campaign)' },
    { id: 'AD-NW-005', title: 'Wrinkle-Proof Shirt', sku: 'NW-WP-004', price: '₹899', outcome: 'FAIL', issue: 'Unapproved campaign promotional price' },
    { id: 'AD-NW-006', title: 'Express Delivery Polo', sku: 'NW-EP-003', price: '₹999', outcome: 'FAIL', issue: 'Unqualified express delivery outside Chennai' },
    { id: 'AD-NW-007', title: 'Summer T-Shirt', sku: 'NW-ST-005', price: '₹599', outcome: 'FAIL', issue: 'Unapproved delivery guarantee claim' },
  ];

  // Phase icons mapping for modern pipeline cards
  const phaseIcons = [Building2, Scale, Zap, ShieldCheck];
  const orgDisplayName = activeOrgName
    ? activeOrgName.replace(/Private Limited|Limited|Retail/gi, '').trim()
    : org?.name
    ? org.name.replace(/Private Limited|Limited|Retail/gi, '').trim()
    : 'NOVAWEAR';

  return (
    <div className="w-full mb-12 space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 0: ARCHITECTURE COMMAND CENTER & 4-PHASE PIPELINE
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
        {/* Top Control Bar: Back Navigation, Brand Badges & Quick Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Return to Home Landing Page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Home</span>
              </button>
            )}
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
              Brand Governance Lifecycle
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{orgDisplayName} Live Workspace</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onSwitchOrg && (
              <button
                onClick={onSwitchOrg}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-95"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>Switch Organisation</span>
              </button>
            )}
            {onNavigateToAudit && (
              <button
                onClick={onNavigateToAudit}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Launch Audit Studio</span>
              </button>
            )}
          </div>
        </div>

        {/* Header Title & Executive Radial HUD Gauge */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              End-to-End Governance Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Deterministic 4-phase compliance pipeline enforcing automated policy validation, catalogue truth checks, and audit sign-offs across 10 verification gates.
            </p>
          </div>

          {/* Executive Circular Radial Progress Widget */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 sm:px-4 sm:py-3.5 flex items-center gap-4 min-w-[280px] shadow-xs shrink-0">
            <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" className="stroke-slate-200" strokeWidth="4.5" fill="none" />
                <circle
                  cx="28"
                  cy="28"
                  r="22"
                  className="stroke-indigo-600 transition-all duration-700"
                  strokeWidth="4.5"
                  strokeDasharray={138.23}
                  strokeDashoffset={138.23 - (138.23 * overallProgressPct) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <span className="absolute font-black text-sm text-slate-900 mono">{overallProgressPct}%</span>
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="text-xs font-black text-slate-900 tracking-tight">Lifecycle Progress</div>
              <div className="text-[11px] text-slate-500 font-medium">
                {totalCompletedStages} of {totalStagesCount} Gates Verified
              </div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                <span>{activePhase.number}: {activePhase.title}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            THE 4-PHASE GOVERNANCE PIPELINE (Connected & Interactive)
            ───────────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>Governance Lifecycle Phases</span>
              <span className="text-slate-400 font-normal">• Click any phase to switch workflow</span>
            </span>
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium">
              Stage {currentStageObj.number} of 10 currently active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {phases.map((phase, pIdx) => {
              const m = getPhaseMetrics(pIdx);
              const isPhaseActive = safeActivePhaseIndex === pIdx;
              const IconComponent = phaseIcons[pIdx] || ShieldCheck;

              return (
                <div
                  key={phase.id}
                  onClick={() => onStageChange(phase.firstStage)}
                  className={`group relative rounded-2xl p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between border select-none card-3d-hover ${
                    isPhaseActive
                      ? 'bg-gradient-to-b from-indigo-50/80 via-white to-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                      : m.isCompleted
                      ? 'bg-white hover:bg-slate-50/60 border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-xs'
                      : 'bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  {/* Top Phase Accent Line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl transition-all ${
                      isPhaseActive
                        ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600'
                        : m.isCompleted
                        ? 'bg-emerald-500'
                        : 'bg-transparent group-hover:bg-slate-200'
                    }`}
                  />

                  <div className="space-y-3">
                    {/* Phase Header Tag & Status Badge */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isPhaseActive
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : m.isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                        </div>
                        <span
                          className={`mono text-[10px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded ${
                            isPhaseActive
                              ? 'bg-indigo-100 text-indigo-800 font-extrabold'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {phase.number}
                        </span>
                      </div>

                      {/* Status Chip */}
                      {m.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-300/80">
                          <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                          100% DONE
                        </span>
                      ) : isPhaseActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                          UPCOMING
                        </span>
                      )}
                    </div>

                    {/* Title & Concise Non-Truncated Summary */}
                    <div>
                      <h3
                        className={`text-sm font-black transition-colors ${
                          isPhaseActive
                            ? 'text-indigo-700'
                            : 'text-slate-900 group-hover:text-indigo-600'
                        }`}
                      >
                        {phase.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                        {phase.description}
                      </p>
                    </div>
                  </div>

                  {/* Micro Stage Segment Progress Bar */}
                  <div className="pt-3 mt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">
                        {m.completedStages} of {m.totalStages} stages done
                      </span>
                      <span className={`mono font-bold ${isPhaseActive ? 'text-indigo-700' : m.isCompleted ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {m.progressPct}%
                      </span>
                    </div>

                    {/* Segmented Micro-Bars */}
                    <div
                      className="grid gap-1.5"
                      style={{ gridTemplateColumns: `repeat(${phase.stages.length}, minmax(0, 1fr))` }}
                    >
                      {phase.stages.map((st) => {
                        const isStDone = isStageComplete(st.id);
                        const isStCurrent = st.id === currentStage;
                        return (
                          <div
                            key={st.id}
                            title={`${st.number}. ${st.name}: ${isStCurrent ? 'Current' : isStDone ? 'Completed' : 'Upcoming'}`}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isStDone
                                ? 'bg-emerald-500'
                                : isStCurrent
                                ? 'bg-indigo-600 ring-2 ring-indigo-400/40 animate-pulse'
                                : 'bg-slate-200'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Action Navigation Cue */}
                    <div className="flex items-center justify-between pt-0.5 text-[11px] font-bold">
                      {isPhaseActive ? (
                        <span className="text-indigo-700 flex items-center gap-1 font-extrabold">
                          <span>In Focus</span>
                          <span className="text-xs">↓</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 group-hover:text-indigo-600 flex items-center gap-0.5 transition-colors">
                          <span>{m.isCompleted ? 'Revisit' : 'Enter'} Phase</span>
                          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {phase.stages.length} {phase.stages.length === 1 ? 'stage' : 'stages'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: ACTIVE PHASE STAGE WORKFLOW TRACK
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-50/70 border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[10px] font-black uppercase text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded border border-indigo-200">
                {activePhase.number} WORKFLOW
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                {activePhase.title} Execution Track
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>{activePhase.guidance}</span>
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Currently Active
            </span>
            <span className="text-xs font-black text-indigo-700 mono">
              Stage {currentStageObj.number} of 10 • {currentStageObj.label}
            </span>
          </div>
        </div>

        {/* Horizontal responsive step progress bar for active phase stages */}
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns:
              activePhase.stages.length === 1
                ? '1fr'
                : activePhase.stages.length === 2
                ? 'repeat(auto-fit, minmax(280px, 1fr))'
                : 'repeat(auto-fit, minmax(230px, 1fr))',
          }}
        >
          {activePhase.stages.map((st) => {
            const stStatus = getStageStatus(st.id);
            const isSelected = st.id === currentStage;

            return (
              <button
                key={st.id}
                type="button"
                onClick={() => onStageChange(st.id)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-white border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                    : stStatus === 'COMPLETED'
                    ? 'bg-white/80 hover:bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
                    : stStatus === 'NEEDS_ATTENTION'
                    ? 'bg-amber-50/70 border-amber-300 hover:bg-amber-50 shadow-2xs'
                    : 'bg-white/50 border-slate-200/80 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Indicator Icon */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : stStatus === 'COMPLETED'
                        ? 'bg-emerald-600 text-white'
                        : stStatus === 'NEEDS_ATTENTION'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {stStatus === 'COMPLETED' ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : stStatus === 'NEEDS_ATTENTION' ? (
                      <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      st.number
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 truncate">{st.name}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">{st.desc}</div>
                  </div>
                </div>

                {/* Status Pill Indicator */}
                <div className="shrink-0">
                  {isSelected ? (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                      CURRENT
                    </span>
                  ) : stStatus === 'COMPLETED' ? (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" /> DONE
                    </span>
                  ) : stStatus === 'NEEDS_ATTENTION' ? (
                    <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                      ATTN
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold uppercase tracking-wider bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded-full">
                      NEXT
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: MAIN STAGE WORKSPACE (Renders ONLY Current Stage)
          ───────────────────────────────────────────────────────────── */}

      {/* Toast Notification */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* ── STAGE 1: ORGANISATION ONBOARDING ── */}
      {currentStage === 'org' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  STAGE 01 OF 10 • PHASE 01: ORGANISATION SETUP
                </span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Sample Organisation Preloaded
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Organisation Profile & Operational Parameters
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Configure your enterprise entity. All downstream policy extractions, catalogues, and audit verifications inherit this organisation scope.
              </p>
            </div>
            <button
              onClick={() => {
                setOrg(defaultOrg);
                setUploadToast('Reset to NOVAWEAR default sample profile');
                setTimeout(() => setUploadToast(null), 2500);
              }}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 self-start cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to NOVAWEAR Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Organisation Legal Entity Name
              </label>
              <input
                type="text"
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Canonical entity name used in consumer compliance disclaimers and legal declarations.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Primary Industry & Operating Segment
              </label>
              <input
                type="text"
                value={org.industry}
                onChange={(e) => setOrg({ ...org, industry: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Defines the baseline regulatory framework (Consumer Protection Act, E-Commerce Rules).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Headquarters & Principal Operations Hub
              </label>
              <input
                type="text"
                value={org.location}
                onChange={(e) => setOrg({ ...org, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Critical for verifying express delivery geography and warehouse logistics SLAs.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Official Digital Domain / E-Commerce Storefront
              </label>
              <input
                type="text"
                value={org.website}
                onChange={(e) => setOrg({ ...org, website: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Channel origin for online promotional campaigns and terms link resolution.
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Brand Mission & Governance Mandate
              </label>
              <textarea
                rows={3}
                value={org.description}
                onChange={(e) => setOrg({ ...org, description: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Organisation profile configured. Proceed to verify business sector alignment.
            </div>
            <button
              onClick={() => onStageChange('sector')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Select Business Sector <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: SECTOR SELECTION ── */}
      {currentStage === 'sector' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              STAGE 02 OF 10 • PHASE 01: ORGANISATION SETUP
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
              Select Business Sector & Industry Compliance Model
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Integrix AI adapts policy extraction schemas and severity thresholds per industry. In this verification suite,{' '}
              <strong className="text-slate-900">Retail & Fashion (NOVAWEAR)</strong> is the active working sector. Other sectors illustrate the extensible platform architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {sectors.map((sec) => {
              const isActive = sec.status === 'ACTIVE';
              const isSelected = selectedSector === sec.id;
              return (
                <div
                  key={sec.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedSector(sec.id);
                    } else {
                      setSectorModalInfo(sec);
                    }
                  }}
                  className={`p-5 rounded-2xl border transition-all text-left relative ${
                    isActive
                      ? isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-sm cursor-pointer ring-2 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-indigo-300 cursor-pointer'
                      : 'bg-slate-50/70 border-slate-200/70 opacity-60 hover:opacity-80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <sec.icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isActive ? (
                        <CircleDot className="w-2.5 h-2.5 text-emerald-600" />
                      ) : (
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                      )}
                      {sec.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{sec.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{sec.description}</p>
                  <div className="text-[11px] font-semibold flex items-center justify-between pt-3 border-t border-slate-100">
                    {isActive ? (
                      <span className="text-indigo-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active Working Sector
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Planned Roadmap Sector
                      </span>
                    )}
                    <span className="text-xs text-slate-400">Click to inspect</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sector Informational Modal */}
          {sectorModalInfo && (
            <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                      <sectorModalInfo.icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <h4 className="text-base font-bold text-slate-900">{sectorModalInfo.name}</h4>
                  </div>
                  <button
                    onClick={() => setSectorModalInfo(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Extensible Architecture:</strong> Integrix AI is designed to support {sectorModalInfo.name} through industry-specific document parsers, regulatory rule templates, and claim taxonomy.
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <strong>Planned Roadmap Sector:</strong> This sector rulebook is planned for expansion. In this verification session, <strong className="underline">NOVAWEAR (Retail & Fashion)</strong> is the active working sector with live backend verification.
                  </div>
                  <p>
                    Clicking continue will keep Retail & Fashion as the active sector so you can proceed with the live sample documents.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSectorModalInfo(null)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Understood — Return to NOVAWEAR
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('org')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Organisation
            </button>
            <button
              onClick={() => onStageChange('docs')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Upload NOVAWEAR Source Documents <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 3: DOCUMENT UPLOAD ── */}
      {currentStage === 'docs' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 03 OF 10 • PHASE 01: ORGANISATION SETUP
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Guided Source Document Ingestion Workspace
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Ingest official brand collateral from which ground-truth policies, product specs, and marketing restrictions are extracted.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setDocs((prev) => prev.map((d) => ({ ...d, uploaded: true, status: 'uploaded' })));
                  setUploadToast('All 5 official NOVAWEAR repository documents verified and synced.');
                  setTimeout(() => setUploadToast(null), 3000);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" /> Upload All 5 Documents (1-Click)
              </button>
            </div>
          </div>

          {/* Explainer Callout */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">How this works in the real world:</strong> Brand and legal teams upload raw master documents (PDF brand guidelines, shipping policies, excel product catalogues). Integrix AI performs OCR, multimodal document layout decomposition, and automated fact extraction to construct the company verified policy truth graph.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {docs.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {d.fileType}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{d.fileSize}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{d.title}</h4>
                  <p className="text-xs text-slate-500 mb-3">{d.description}</p>
                  <div className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded border border-slate-100 flex items-center justify-between">
                    <span>{d.filename}</span>
                    <span className="text-emerald-700 font-sans font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Synced
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={d.path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Sample Document
                  </a>
                  <button
                    onClick={() => {
                      setUploadToast(`Re-ingesting and verifying ${d.filename}...`);
                      setTimeout(() => setUploadToast(`${d.filename} verified successfully!`), 1000);
                      setTimeout(() => setUploadToast(null), 3500);
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Re-extract
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('sector')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Sector
            </button>
            <button
              onClick={() => onStageChange('extraction')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: View AI Document Extraction Results <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 4: AI DOCUMENT EXTRACTION ── */}
      {currentStage === 'extraction' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 04 OF 10 • PHASE 02: POLICY GOVERNANCE
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Real AI Document Extraction & Ground-Truth Graph
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Extract and classify information from NOVAWEAR uploaded source documents with exact page citations and confidence metrics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 6 Verified Truth Assertions
              </span>
            </div>
          </div>

          {/* Pipeline flow */}
          <div className="my-6 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 1</div>
              <div className="font-bold text-slate-800 mt-0.5">PDF / Excel Parsing</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 2</div>
              <div className="font-bold text-slate-800 mt-0.5">OCR & Layout Analysis</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 3</div>
              <div className="font-bold text-slate-800 mt-0.5">Entity Classification</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-400">Step 4</div>
              <div className="font-bold text-slate-800 mt-0.5">Constraint Mapping</div>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200">
              <div className="text-[10px] uppercase font-bold text-indigo-500">Step 5</div>
              <div className="font-bold text-indigo-900 mt-0.5">Truth Graph Index</div>
            </div>
          </div>

          <div className="space-y-3 mt-4">
            {extractedFacts.map((fact) => (
              <div
                key={fact.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        fact.category === 'PRODUCT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : fact.category === 'CAMPAIGN'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {fact.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{fact.title}</h4>
                  </div>
                  <p className="text-xs font-medium text-slate-700">{fact.fact}</p>
                </div>

                <div className="flex md:flex-col items-end justify-between md:justify-center text-right text-xs gap-1 flex-shrink-0">
                  <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    {fact.sourceDoc}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {fact.sourcePage} • {(fact.confidence * 100).toFixed(0)}% AI Confidence
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('docs')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Document Upload
            </button>
            <button
              onClick={() => onStageChange('review')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Review Generated Policy Drafts <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 5: POLICY DRAFT & REVIEW ── */}
      {currentStage === 'review' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 05 OF 10 • PHASE 02: POLICY GOVERNANCE
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                AI-Synthesised Policy Drafts (Pre-Execution Verification)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Examine candidate policy constraints generated from extracted catalogue specifications and marketing guidelines.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                {policyDrafts.length} Candidate Rules Synthesised
              </span>
            </div>
          </div>

          {/* Governance Notice */}
          <div className="my-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 leading-relaxed">
              <strong>Human-in-the-Loop Governance Guardrail:</strong> AI synthesises suggested rule conditions, but candidate policies are non-executable until signed off by an administrator. In Stage 6, administrators review each condition and grant formal operational sign-off.
            </div>
          </div>

          <div className="space-y-4">
            {policyDrafts.map((draft) => (
              <div
                key={draft.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {draft.ruleId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        draft.severity === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : draft.severity === 'HIGH'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {draft.severity} SEVERITY
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {draft.category}
                    </span>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Draft Policy Clause
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900">{draft.title}</h4>
                <p className="text-xs text-slate-600">{draft.description}</p>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-indigo-950">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Machine Rule Condition:
                  </div>
                  {draft.condition}
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>
                    <strong>Source:</strong> {draft.sourceDocument}
                  </span>
                  <span>
                    <strong>Rationale:</strong> {draft.rationale}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('extraction')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: AI Extraction
            </button>
            <button
              onClick={() => onStageChange('approval')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Administrator Approval & Sign-off <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 6: ADMINISTRATOR APPROVAL ── */}
      {currentStage === 'approval' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 06 OF 10 • PHASE 02: POLICY GOVERNANCE
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Administrator Policy Governance & Activation Authority
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Authoritative compliance sign-off. Only approved rules are dispatched into the live executable policy repository.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                {policyDrafts.filter((d) => d.status === 'APPROVED').length} / {policyDrafts.length} Rules Approved
              </span>
              <button
                onClick={handleApproveAllDrafts}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve All Drafts
              </button>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {policyDrafts.map((draft) => (
              <div
                key={draft.id}
                className={`p-5 rounded-2xl border transition-all ${
                  draft.status === 'APPROVED'
                    ? 'border-emerald-300 bg-emerald-50/20 shadow-2xs'
                    : draft.status === 'REJECTED'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {draft.ruleId}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          draft.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : draft.severity === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {draft.severity} SEVERITY
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {draft.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          draft.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : draft.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {draft.status === 'APPROVED'
                          ? 'ACTIVE / EXECUTABLE'
                          : draft.status === 'REJECTED'
                          ? 'REJECTED'
                          : 'DRAFT (NEEDS APPROVAL)'}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{draft.title}</h4>
                    <p className="text-xs text-slate-600">{draft.description}</p>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-indigo-950">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                        Machine Rule Condition:
                      </div>
                      {draft.condition}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>
                        <strong>Source:</strong> {draft.sourceDocument}
                      </span>
                      <span>
                        <strong>Rationale:</strong> {draft.rationale}
                      </span>
                    </div>

                    {draft.rejectionReason && (
                      <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                        <strong>Rejection Reason:</strong> {draft.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Administrator Action Controls */}
                  <div className="flex md:flex-col items-end gap-2 flex-shrink-0">
                    {draft.status !== 'APPROVED' ? (
                      <button
                        onClick={() => handleApproveDraft(draft.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Approve Rule
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Approved & Active
                      </span>
                    )}

                    {draft.status !== 'REJECTED' && (
                      <button
                        onClick={() => setRejectingDraftId(draft.id)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition cursor-pointer"
                      >
                        Reject
                      </button>
                    )}
                  </div>
                </div>

                {/* Reject Reason Form Inline */}
                {rejectingDraftId === draft.id && (
                  <div className="mt-4 pt-4 border-t border-slate-200 animate-fade-in">
                    <label className="block text-xs font-bold text-rose-800 uppercase tracking-wider mb-1">
                      Specify Administrator Rejection Rationale (Mandatory)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Condition overly restrictive or requires legal counsel review..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="flex-grow px-3 py-2 text-xs border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <button
                        onClick={() => handleRejectDraft(draft.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingDraftId(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('review')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Policy Review
            </button>
            <button
              onClick={() => onStageChange('repository')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Generate Versioned Policy Repository <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 7: VERSIONED POLICY REPOSITORY ── */}
      {currentStage === 'repository' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 07 OF 10 • PHASE 02: POLICY GOVERNANCE
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Versioned Policy Repository (NW-RB-0.1)
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                The compilation of administrator-approved policies into a machine-executable rulebook. Only approved rules are dispatched during advertisement audits.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200">
                Rulebook Version: v0.1-certified
              </span>
            </div>
          </div>

          {/* Comparison human policies vs machine rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Human-Readable Policy Registry</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Formulated from NOVAWEAR Marketing & Communication Policy (MCP-01) and Product & Customer Information Policy (PCIP-01). Stored with complete rationale, brand tone standards, and regulatory justification.
              </p>
              <ul className="text-xs space-y-2 text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Section 2.1: Certified Fibre & Fabric Truth Mandates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Section 4.1: Promotional Pricing & Campaign Ceiling (Max 40% OFF)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Section 3.0: Express Delivery Geographic Demarcation (Chennai Only)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Section 5.2: Asterisk Disclaimer Placement Rules
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-950">Machine-Executable Rule Engine</h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Deterministic algorithmic constraints executed during creative audits. Evaluates multimodal visual creative extractions against catalogue SKU specifications.
              </p>
              <div className="space-y-2 text-xs font-mono text-indigo-900">
                {policyDrafts
                  .filter((d) => d.status === 'APPROVED')
                  .map((rule) => (
                    <div
                      key={rule.id}
                      className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between"
                    >
                      <span>
                        {rule.ruleId} ({rule.severity})
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('approval')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Approval
            </button>
            <button
              onClick={() => onStageChange('audit')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Creative Audit Studio <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 8: CREATIVE AUDIT STUDIO ── */}
      {currentStage === 'audit' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 08 OF 10 • PHASE 03: CONTENT VERIFICATION
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Creative Audit Studio & Policy Verification
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Audit campaign creatives against catalogue facts and active governance policies in real time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  const el = document.getElementById('evaluator-demo-gallery');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Inspect Creative Gallery Below ↓</span>
              </button>
              {onNavigateToAudit && (
                <button
                  onClick={() => onNavigateToAudit()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Open Dedicated Studio Screen</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Creative Inspection Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-900">
                NOVAWEAR Canonical Campaign Creatives (7 Advertisements)
              </h4>
              <span className="text-xs text-slate-500">Dual-Pass OCR & Deterministic Audits</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {canonicalPosters.map((poster) => (
                <div
                  key={poster.id}
                  onClick={() => {
                    if (onAuditScenarioSelect) onAuditScenarioSelect(poster.id);
                    const el = document.getElementById('evaluator-demo-gallery');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:shadow-2xs transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[10px] font-bold text-slate-500">{poster.id}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          poster.outcome === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {poster.outcome}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900">{poster.title}</div>
                    <div className="text-[11px] text-slate-500">
                      SKU: <strong className="text-slate-700">{poster.sku}</strong> • Price: {poster.price}
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 line-clamp-1">
                    {poster.issue}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('repository')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Policy Repository
            </button>
            <button
              onClick={() => onStageChange('report')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: View Violation Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 9: VIOLATION REPORT ── */}
      {currentStage === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 09 OF 10 • PHASE 03: CONTENT VERIFICATION
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Detailed Brand Violation Analysis & Audit Report
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Structured non-compliance breakdown across policy rule matches, detected evidence, and AI remediation guidance.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Download / Print Report (PDF)
              </button>
            </div>
          </div>

          {/* Creative Selection for Report */}
          <div className="flex flex-wrap items-center gap-2 my-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Inspect Report For:
            </span>
            {['AD-NW-002', 'AD-NW-003', 'AD-NW-004', 'AD-NW-005', 'AD-NW-006', 'AD-NW-001'].map((adId) => (
              <button
                key={adId}
                onClick={() => setActiveDecisionAd(adId)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  activeDecisionAd === adId
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {adId}
              </button>
            ))}
          </div>

          {/* Report Metadata Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 my-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Creative ID</div>
              <div className="font-bold text-slate-900 mt-0.5">{activeDecisionAd}.png</div>
            </div>
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Target Product</div>
              <div className="font-bold text-slate-900 mt-0.5">NW-CS-001 (Classic Cotton Shirt)</div>
            </div>
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Overall Verdict</div>
              <div className="font-bold text-rose-600 mt-0.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> NON-COMPLIANT (FAIL)
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-bold uppercase text-[10px]">Rulebook Version</div>
              <div className="font-bold text-slate-900 mt-0.5">NW-RB-0.1 (Certified)</div>
            </div>
          </div>

          {/* Detailed Findings Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mt-6">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Rule Violation</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Detected Evidence</th>
                  <th className="py-3 px-4">Ground-Truth Policy Conflict</th>
                  <th className="py-3 px-4">Do-This-Instead Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>NW-R-002</div>
                    <div className="font-normal text-slate-500 text-[11px]">Pricing Discrepancy</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      HIGH
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">"₹799 ONLY"</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    Catalogue base MRP is ₹1,499. Approved campaign floor price is ₹999. Advertised ₹799 creates misleading pricing claim.
                  </td>
                  <td className="py-3.5 px-4 text-indigo-700 font-medium">
                    Update advertisement copy to approved campaign price "₹999 ONLY".
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>NW-R-004</div>
                    <div className="font-normal text-slate-500 text-[11px]">Missing Asterisk Disclaimer</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      MEDIUM
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">No "*T&C Apply" text found</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    MCP-01 Section 5 mandates prominent disclaimer on all promotional pricing.
                  </td>
                  <td className="py-3.5 px-4 text-indigo-700 font-medium">
                    Append "*Terms & Conditions apply. Valid until stocks last." in legible footnote font.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('audit')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Creative Audit Studio
            </button>
            <button
              onClick={() => onStageChange('decision')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Administrator Adjudication & Decision <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STAGE 10: ADMINISTRATOR DECISION ── */}
      {currentStage === 'decision' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                STAGE 10 OF 10 • PHASE 04: FINAL DECISION
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Administrator Adjudication & Enforcement Workflow
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Final compliance sign-off. Authorised administrators can formally approve, reject, demand edits, or grant temporary exceptions with mandatory audit logging.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                Logged in: Chief Compliance Officer
              </span>
            </div>
          </div>

          {/* Ad Selector Tabs */}
          <div className="flex flex-wrap items-center gap-2 my-5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Ad Decision Queue:
            </span>
            {['AD-NW-001', 'AD-NW-002', 'AD-NW-003', 'AD-NW-004', 'AD-NW-005', 'AD-NW-006', 'AD-NW-007'].map((adId) => {
              const dec = adminDecisions[adId];
              return (
                <button
                  key={adId}
                  onClick={() => {
                    setActiveDecisionAd(adId);
                    if (dec) {
                      setDecisionAction(dec.action);
                      setDecisionComments(dec.comments);
                      if (dec.rejectionReason) setDecisionRejectionReason(dec.rejectionReason);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                    activeDecisionAd === adId
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{adId}</span>
                  {dec && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        dec.action === 'APPROVE'
                          ? 'bg-emerald-500 text-white'
                          : dec.action === 'REJECT'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {dec.action}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Adjudication Form */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Selected Advertisement
              </div>
              <div className="text-lg font-bold text-slate-900">{activeDecisionAd}</div>
              <div className="text-xs text-slate-500 mt-1 mb-4">
                Visual creative asset for NOVAWEAR Campaign.
              </div>

              {adminDecisions[activeDecisionAd] && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="font-bold text-slate-700">Persisted Decision Record</div>
                  <div className="text-slate-500">
                    Status: <strong className="text-slate-900">{adminDecisions[activeDecisionAd].action}</strong>
                  </div>
                  <div className="text-slate-500">
                    Timestamp: {adminDecisions[activeDecisionAd].timestamp}
                  </div>
                  <div className="text-slate-500">
                    Admin: {adminDecisions[activeDecisionAd].adminName}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Compliance Adjudication Action
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {(['APPROVE', 'REJECT', 'EDIT', 'REQUEST_CHANGES', 'EXCEPTION'] as const).map((act) => (
                    <button
                      key={act}
                      type="button"
                      onClick={() => setDecisionAction(act)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center cursor-pointer ${
                        decisionAction === act
                          ? act === 'APPROVE'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : act === 'REJECT'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {act.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {decisionAction === 'REJECT' && (
                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">
                    Mandatory Rejection Justification
                  </label>
                  <input
                    type="text"
                    value={decisionRejectionReason}
                    onChange={(e) => setDecisionRejectionReason(e.target.value)}
                    placeholder="e.g. Unsubstantiated price claim below campaign floor..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}

              {decisionAction === 'EXCEPTION' && (
                <div>
                  <label className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">
                    Authorised Temporary Exception Expiry Date
                  </label>
                  <input
                    type="date"
                    value={decisionExceptionExpiry}
                    onChange={(e) => setDecisionExceptionExpiry(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Administrator Notes & Regulatory Audit Trail
                </label>
                <textarea
                  rows={2}
                  value={decisionComments}
                  onChange={(e) => setDecisionComments(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveDecision}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Commit Adjudication Record
                </button>
              </div>
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('report')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Violation Report
            </button>
            <button
              onClick={() => onStageChange('org')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Restart Lifecycle Workflow <RotateCcw className="w-3.5 h-3.5 ml-1 inline" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: PERSISTENT STAGE NAVIGATION CONTROLS (Footer Bar)
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
        <button
          onClick={() => {
            if (safeCurrentStageIndex > 0) {
              onStageChange(stages[safeCurrentStageIndex - 1].id);
            }
          }}
          disabled={safeCurrentStageIndex === 0}
          className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>
            {safeCurrentStageIndex > 0
              ? `Previous: ${stages[safeCurrentStageIndex - 1].short}`
              : 'At First Stage'}
          </span>
        </button>

        {/* Center Stage & Phase Status */}
        <div className="text-center">
          <div className="text-xs font-extrabold text-white">
            Stage {currentStageObj.number} of 10: {currentStageObj.label}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center justify-center gap-1.5">
            <span className="mono text-indigo-400 font-bold">{currentStageObj.phaseNumber}</span>
            <span>•</span>
            <span>{currentStageObj.phaseTitle}</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">{overallProgressPct}% Complete</span>
          </div>
        </div>

        <button
          onClick={() => {
            if (safeCurrentStageIndex < stages.length - 1) {
              onStageChange(stages[safeCurrentStageIndex + 1].id);
            } else {
              onStageChange('org');
            }
          }}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>
            {safeCurrentStageIndex < stages.length - 1
              ? `Next: ${stages[safeCurrentStageIndex + 1].short}`
              : 'Restart Lifecycle'}
          </span>
          {safeCurrentStageIndex < stages.length - 1 ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <RotateCcw className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
};

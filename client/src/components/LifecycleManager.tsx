import React, { useState } from 'react';
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

// Stage-to-app-page mapping for direct navigation
export const STAGE_PAGE_MAP: Partial<Record<LifecycleStage, string>> = {
  audit: "audit",
  report: "audit-history",
  repository: "rules",
  decision: "approval-centre",
};

interface LifecycleManagerProps {
  currentStage: LifecycleStage;
  onStageChange: (stage: LifecycleStage) => void;
  onAuditScenarioSelect?: (scenarioId: string) => void;
  onNavigateToAudit?: () => void;
  /** Navigate to any named app page */
  onNavigateTo?: (page: string) => void;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({
  currentStage,
  onStageChange,
  onAuditScenarioSelect,
  onNavigateToAudit,
  onNavigateTo,
}) => {
  // 1. Org State
  const defaultOrg: OrgProfile = {
    name: 'NOVAWEAR Retail Private Limited',
    industry: 'Retail & Fashion Apparel',
    location: 'Chennai, Tamil Nadu, India',
    description: 'Direct-to-consumer sustainable apparel brand offering premium cotton shirts, polos, and chinos with strict claims substantiation standards.',
    website: 'https://novawear.demo.integrix.ai',
    isSample: true,
  };
  const [org, setOrg] = useState<OrgProfile>(defaultOrg);

  // 2. Sector State
  const [selectedSector, setSelectedSector] = useState<string>('retail');
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

  // 3. Document Upload State
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
  const [docs, setDocs] = useState<SampleDoc[]>(initialDocs);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // 4. Extracted Facts State
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

  // 5. Policy Drafts & Approval State
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
  const [policyDrafts, setPolicyDrafts] = useState<PolicyDraft[]>(initialDrafts);
  const [rejectingDraftId, setRejectingDraftId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // 6. Admin Decision State
  const [adminDecisions, setAdminDecisions] = useState<Record<string, AdminDecision>>({
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
  });

  const [activeDecisionAd, setActiveDecisionAd] = useState<string>('AD-NW-002');
  const [decisionAction, setDecisionAction] = useState<AdminDecision['action']>('REJECT');
  const [decisionComments, setDecisionComments] = useState<string>('Pricing violation detected: Advertised price of ₹799 violates minimum floor price rule NW-R-002.');
  const [decisionRejectionReason, setDecisionRejectionReason] = useState<string>('Pricing violation: Below authorised campaign floor price.');
  const [decisionExceptionExpiry, setDecisionExceptionExpiry] = useState<string>('2026-12-31');

  // Flattened 10 Stages Definition
  const stages: { id: LifecycleStage; number: number; label: string; short: string }[] = [
    { id: 'org', number: 1, label: 'Organisation Onboarding', short: 'Org Setup' },
    { id: 'sector', number: 2, label: 'Sector Selection', short: 'Sector' },
    { id: 'docs', number: 3, label: 'Document Upload', short: 'Documents' },
    { id: 'extraction', number: 4, label: 'AI Document Extraction', short: 'Extraction' },
    { id: 'review', number: 5, label: 'Policy Review & Drafts', short: 'Drafts' },
    { id: 'approval', number: 6, label: 'Administrator Approval', short: 'Approval' },
    { id: 'repository', number: 7, label: 'Versioned Rulebook Repository', short: 'Repository' },
    { id: 'audit', number: 8, label: 'Creative Audit Studio', short: 'Audit' },
    { id: 'report', number: 9, label: 'Violation Report', short: 'Report' },
    { id: 'decision', number: 10, label: 'Final Decision & Action', short: 'Decision' },
  ];

  const currentStageIndex = stages.findIndex((s) => s.id === currentStage);

  // 4 Grouped Lifecycle Phases
  const phases = [
    {
      id: 'phase-1',
      number: 'PHASE 01',
      title: 'ORGANISATION SETUP',
      description: 'Configure corporate identity, active industry sector boundaries, and ingest compliance source documents.',
      stages: [
        { id: 'org' as LifecycleStage, number: 1, name: 'Organisation Onboarding', short: 'Org Setup', desc: 'Configure brand profile, commercial scope and multi-tenant parameters.' },
        { id: 'sector' as LifecycleStage, number: 2, name: 'Sector Selection', short: 'Sector', desc: 'Select regulated sector guardrails, apparel/retail advertising standards.' },
        { id: 'docs' as LifecycleStage, number: 3, name: 'Document Upload', short: 'Documents', desc: 'Ingest brand guidelines, policy PDFs, and product catalogue workbooks.' },
      ],
      guidance: 'Begin by configuring your organisation and providing its source documents.',
    },
    {
      id: 'phase-2',
      number: 'PHASE 02',
      title: 'POLICY GOVERNANCE',
      description: 'Synthesise deterministic rules from documents, review policy drafts, approve rulebooks and publish repositories.',
      stages: [
        { id: 'extraction' as LifecycleStage, number: 4, name: 'AI Document Extraction', short: 'Extraction', desc: 'Extract operational facts, claims restrictions, and policy clauses from documents.' },
        { id: 'review' as LifecycleStage, number: 5, name: 'Policy Review & Drafts', short: 'Drafts', desc: 'Examine synthesised rule conditions, severity levels, and source citations.' },
        { id: 'approval' as LifecycleStage, number: 6, name: 'Administrator Approval', short: 'Approval', desc: 'Sign off and activate rules to govern live commercial advertising.' },
        { id: 'repository' as LifecycleStage, number: 7, name: 'Versioned Rulebook Repository', short: 'Repository', desc: 'Audit published active rules, version history, and rulebook records.' },
      ],
      guidance: "Review extracted policies, approve applicable rules and establish your organisation's repository.",
    },
    {
      id: 'phase-3',
      number: 'PHASE 03',
      title: 'CONTENT VERIFICATION',
      description: 'Audit creative posters and marketing claims against catalogue facts and active policies in real time.',
      stages: [
        { id: 'audit' as LifecycleStage, number: 8, name: 'Creative Audit Studio', short: 'Audit Studio', desc: 'Run multi-modal OCR extraction and automated policy compliance evaluation.' },
        { id: 'report' as LifecycleStage, number: 9, name: 'Violation Report', short: 'Violation Report', desc: 'Inspect breach severity, verbatim evidence excerpts, and Do-This-Instead remedies.' },
      ],
      guidance: 'Submit creative content for verification against your approved policies.',
    },
    {
      id: 'phase-4',
      number: 'PHASE 04',
      title: 'FINAL DECISION',
      description: 'Record authoritative administrator decisions, publish sign-offs, or issue structured rejection notifications.',
      stages: [
        { id: 'decision' as LifecycleStage, number: 10, name: 'Administrator Decision', short: 'Decision', desc: 'Sign off, reject, or request revisions with immutable audit log entries.' },
      ],
      guidance: "Review findings and record the administrator's final decision.",
    },
  ];

  // Helper to determine phase status and progress
  const getPhaseInfo = (phaseIndex: number) => {
    // Current stage maps to a phase
    // Phase 0: stages 0..2 (org, sector, docs)
    // Phase 1: stages 3..6 (extraction, review, approval, repository)
    // Phase 2: stages 7..8 (audit, report)
    // Phase 3: stage 9 (decision)
    const phaseRanges = [
      { start: 0, end: 2 },
      { start: 3, end: 6 },
      { start: 7, end: 8 },
      { start: 9, end: 9 },
    ];
    const range = phaseRanges[phaseIndex];
    const isPastPhase = currentStageIndex > range.end;
    const isCurrentPhase = currentStageIndex >= range.start && currentStageIndex <= range.end;

    if (isPastPhase) {
      return {
        status: 'COMPLETED' as const,
        completedCount: range.end - range.start + 1,
        totalCount: range.end - range.start + 1,
        progressPct: 100,
      };
    } else if (isCurrentPhase) {
      const completedInPhase = currentStageIndex - range.start;
      const totalInPhase = range.end - range.start + 1;
      return {
        status: 'IN_PROGRESS' as const,
        completedCount: completedInPhase,
        totalCount: totalInPhase,
        progressPct: Math.round((completedInPhase / totalInPhase) * 100),
      };
    } else {
      return {
        status: 'UPCOMING' as const,
        completedCount: 0,
        totalCount: range.end - range.start + 1,
        progressPct: 0,
      };
    }
  };

  const activePhaseIndex = phases.findIndex((p) => p.stages.some((s) => s.id === currentStage));
  const activePhase = phases[activePhaseIndex >= 0 ? activePhaseIndex : 0];

  const handleApproveDraft = (id: string) => {
    setPolicyDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED', rejectionReason: undefined } : d))
    );
  };

  const handleRejectDraft = (id: string) => {
    if (!rejectReason.trim()) return;
    setPolicyDrafts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'REJECTED', rejectionReason: rejectReason } : d))
    );
    setRejectingDraftId(null);
    setRejectReason('');
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

  return (
    <div className="w-full mb-12 space-y-6">
      {/* ──── 4-PHASE LIFECYCLE OVERVIEW CARDS (2x2 Grid) ──── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
                Brand Governance Lifecycle
              </span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                NOVAWEAR Live
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
              End-to-End Governance Architecture
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => onStageChange(stages[Math.max(0, currentStageIndex - 1)].id)}
              disabled={currentStageIndex === 0}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1 inline" /> Previous Stage
            </button>
            <button
              onClick={() => onStageChange(stages[Math.min(stages.length - 1, currentStageIndex + 1)].id)}
              disabled={currentStageIndex === stages.length - 1}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:cursor-not-allowed font-bold shadow-sm transition-colors cursor-pointer flex items-center gap-1"
            >
              Next Stage <ArrowRight className="w-3.5 h-3.5 ml-1 inline" />
            </button>
          </div>
        </div>

        {/* 2x2 Grid on desktop, 1-col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((phase, pIdx) => {
            const info = getPhaseInfo(pIdx);
            const isPhaseActive = activePhaseIndex === pIdx;
            const isCompleted = info.status === 'COMPLETED';
            const isInProgress = info.status === 'IN_PROGRESS';

            return (
              <div
                key={phase.id}
                onClick={() => {
                  // If the first stage of this phase has a mapped app screen, navigate there directly
                  const firstMappedPage = phase.stages
                    .map((s) => STAGE_PAGE_MAP[s.id])
                    .find(Boolean);
                  if (firstMappedPage && onNavigateTo) {
                    onNavigateTo(firstMappedPage);
                  } else {
                    // Otherwise switch to the first stage within the lifecycle view
                    if (!isPhaseActive) {
                      onStageChange(phase.stages[0].id);
                    }
                  }
                }}
                className={`creative-card p-5 sm:p-6 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                  isPhaseActive
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md bg-white'
                    : isCompleted
                    ? 'border-emerald-200 hover:border-emerald-400 bg-white/90'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                {/* Visual accent top highlight */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isPhaseActive
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                      : isCompleted
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="mono text-[11px] font-black tracking-wider text-slate-400">
                      {phase.number}
                    </span>

                    {/* Status Badge */}
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3 stroke-[2.5]" />
                        COMPLETED
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
                        <CircleDot className="w-3 h-3 text-indigo-600" />
                        IN PROGRESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                        UPCOMING
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {phase.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                      {phase.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {phase.stages.length} Stages · {info.completedCount}/{info.totalCount} Done
                    </span>
                    <span className="mono text-[11px] font-black text-slate-700">
                      {info.progressPct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted
                          ? 'bg-emerald-500'
                          : isInProgress
                          ? 'bg-gradient-to-r from-indigo-600 to-violet-600'
                          : 'bg-slate-300'
                      }`}
                      style={{ width: `${info.progressPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                      {isPhaseActive ? 'Currently Active Phase' : 'Open Phase →'}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform ${
                        isPhaseActive ? 'text-indigo-600' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── ACTIVE PHASE DETAIL & VERTICAL STAGE LIST ──── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="mono text-[11px] font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                {activePhase.number}
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {activePhase.title}
              </h3>
            </div>
            {/* Guided Experience Callout */}
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{activePhase.guidance}</span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
              Selected Stage
            </span>
            <span className="text-xs font-black text-slate-800 mono">
              Stage {currentStageIndex + 1} of 10 ({stages[currentStageIndex].short})
            </span>
          </div>
        </div>

        {/* Compact Vertical Timeline / Structured Stage List */}
        <div className="space-y-2.5">
          {activePhase.stages.map((st) => {
            const overallIdx = stages.findIndex((s) => s.id === st.id);
            const isStageCurrent = st.id === currentStage;
            const isStageDone = overallIdx < currentStageIndex;

            return (
              <div
                key={st.id}
                onClick={() => onStageChange(st.id)}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isStageCurrent
                    ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 shadow-2xs'
                    : isStageDone
                    ? 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                    : 'bg-white border-slate-200/70 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                      isStageCurrent
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : isStageDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    {isStageDone ? <Check className="w-4 h-4 stroke-[3]" /> : st.number}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{st.name}</span>
                      {isStageCurrent && (
                        <span className="text-[10px] font-extrabold uppercase bg-indigo-600 text-white px-2 py-0.2 rounded-md">
                          Active
                        </span>
                      )}
                      {isStageDone && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      {st.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageChange(st.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isStageCurrent
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isStageCurrent ? 'Current View' : isStageDone ? 'Review Stage' : 'Go to Stage →'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ──── TOAST NOTIFICATION ──── */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm animate-fade-in border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>{uploadToast}</span>
        </div>
      )}

      {/* ──── STAGE 1: ORGANISATION ONBOARDING ──── */}
      {currentStage === 'org' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Stage 1 of 10
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
              className="text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 flex items-center gap-1.5 self-start"
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

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Organisation profile loaded. Proceed to verify business sector alignment.
            </div>
            <button
              onClick={() => onStageChange('sector')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Select Business Sector <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 2: SECTOR SELECTION ──── */}
      {currentStage === 'sector' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              Stage 2 of 10
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
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      <sec.icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {isActive ? <CircleDot className="w-2.5 h-2.5 text-emerald-600" /> : <Lock className="w-2.5 h-2.5 text-slate-400" />}
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
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>
                    <strong className="text-slate-900">Extensible Architecture:</strong> Integrix AI is designed to support {sectorModalInfo.name} through industry-specific document parsers, regulatory rule templates, and claim taxonomy.
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                    <strong>Planned Roadmap Sector:</strong> This sector's rulebook is not enabled in the current test run. In this verification session, <strong className="underline">NOVAWEAR (Retail & Fashion)</strong> is the only active working sector with live backend verification.
                  </div>
                  <p>
                    Clicking continue will keep Retail & Fashion as the active sector so you can proceed with the live sample documents.
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    onClick={() => setSectorModalInfo(null)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold"
                  >
                    Understood – Return to NOVAWEAR
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('org')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Organisation
            </button>
            <button
              onClick={() => onStageChange('docs')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Upload NOVAWEAR Source Documents <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 3: GUIDED DOCUMENT UPLOAD WORKSPACE ──── */}
      {currentStage === 'docs' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Stage 3 of 10
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
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Upload All 5 Documents (1-Click)
              </button>
            </div>
          </div>

          {/* Real-World Explainer Callout */}
          <div className="my-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong className="text-slate-900">How this works in the real world:</strong> Brand and legal teams upload raw master documents (PDF brand guidelines, shipping policies, excel product catalogues). Integrix AI performs OCR, multimodal document layout decomposition, and automated fact extraction to construct the company's verified policy truth graph.
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
                    className="text-xs font-semibold text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Sample Document
                  </a>
                  <button
                    onClick={() => {
                      setUploadToast(`Re-ingesting and verifying ${d.filename}...`);
                      setTimeout(() => setUploadToast(`${d.filename} verified successfully!`), 1000);
                      setTimeout(() => setUploadToast(null), 3500);
                    }}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Re-extract
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('sector')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Sector
            </button>
            <button
              onClick={() => onStageChange('extraction')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: View AI Document Extraction Results <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 4: AI EXTRACTION RESULTS ──── */}
      {currentStage === 'extraction' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Stage 4 of 10
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                Real AI Document Extraction & Ground-Truth Graph
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Structured entities and factual assertions extracted from NOVAWEAR master brand collateral with precise page citations.
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
                    {fact.sourcePage} · {(fact.confidence * 100).toFixed(0)}% AI Confidence
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('docs')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Document Upload
            </button>
            <button
              onClick={() => onStageChange('review')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Review Generated Policy Drafts <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 5 & 6: POLICY DRAFT REVIEW & ADMINISTRATOR APPROVAL ──── */}
      {(currentStage === 'review' || currentStage === 'approval') && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {currentStage === 'review' ? 'Stage 5 of 10: Policy Review' : 'Stage 6 of 10: Administrator Approval'}
              </span>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {currentStage === 'review'
                  ? 'AI-Synthesised Policy Drafts (Pre-Execution Verification)'
                  : 'Administrator Policy Governance & Activation Authority'}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                <strong className="text-slate-900">Critical Governance Invariant:</strong> AI never autonomously deploys rules into production. All draft policies must be reviewed, fine-tuned, and explicitly approved by an administrator before becoming executable.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl">
                {policyDrafts.filter((d) => d.status === 'APPROVED').length} / {policyDrafts.length} Approved
              </span>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {policyDrafts.map((draft) => (
              <div
                key={draft.id}
                className={`p-5 rounded-2xl border transition-all ${
                  draft.status === 'APPROVED'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : draft.status === 'REJECTED'
                    ? 'border-rose-200 bg-rose-50/20'
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
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                      <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                        <strong>Rejection Reason:</strong> {draft.rejectionReason}
                      </div>
                    )}
                  </div>

                  {/* Administrator Action Controls */}
                  <div className="flex md:flex-col items-end gap-2 flex-shrink-0">
                    {draft.status !== 'APPROVED' ? (
                      <button
                        onClick={() => handleApproveDraft(draft.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1"
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
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-700 text-slate-600 text-xs font-semibold transition"
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
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg"
                      >
                        Confirm Rejection
                      </button>
                      <button
                        onClick={() => {
                          setRejectingDraftId(null);
                          setRejectReason('');
                        }}
                        className="px-3 py-2 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange(currentStage === 'approval' ? 'review' : 'extraction')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous
            </button>
            <button
              onClick={() => onStageChange('repository')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Generate Versioned Policy Repository <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 7: VERSIONED RULEBOOK REPOSITORY ──── */}
      {currentStage === 'repository' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Stage 7 of 10
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

          {/* Differentiating human policies vs machine rules */}
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
                <div className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>NW-R-001 (CRITICAL)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>NW-R-002 (HIGH)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>NW-R-003 (HIGH)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>NW-R-004 (MEDIUM)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between">
                  <span>NW-R-005 (MEDIUM)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">EXECUTABLE</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('approval')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Approval
            </button>
            <button
              onClick={() => {
                onStageChange('audit');
                if (onNavigateToAudit) onNavigateToAudit();
              }}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Audit an Advertisement Against Repository <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 8: AUDIT NOTIFICATION CALLOUT (Directs to Audit Studio below) ──── */}
      {currentStage === 'audit' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200">
                Stage 8 of 10
              </span>
              <h3 className="text-xl font-bold text-indigo-950 tracking-tight mt-1">
                Active Audit Studio & Demo Poster Verification
              </h3>
              <p className="text-sm text-indigo-900/80 mt-1">
                Open the dedicated Audit Studio screen to inspect visual creatives via OCR, cross-reference certified catalogue facts, and view live policy checks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (onNavigateToAudit) onNavigateToAudit();
                }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Open Creative Audit Studio Screen</span> <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
              <button
                onClick={() => onStageChange('report')}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                Proceed to Violation Report <ArrowRight className="w-4 h-4 ml-1 inline" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──── STAGE 9: COMPREHENSIVE VIOLATION REPORT ──── */}
      {currentStage === 'report' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Stage 9 of 10
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
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download / Print Report (PDF)
              </button>
            </div>
          </div>

          {/* Sample Active Creative Selection for Report */}
          <div className="flex flex-wrap items-center gap-2 my-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">
              Inspect Report For:
            </span>
            {['AD-NW-002', 'AD-NW-003', 'AD-NW-004', 'AD-NW-005', 'AD-NW-006', 'AD-NW-001'].map((adId) => (
              <button
                key={adId}
                onClick={() => setActiveDecisionAd(adId)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
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
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Rule Violation</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Detected Text / Evidence</th>
                  <th className="py-3 px-4">Policy Rationale</th>
                  <th className="py-3 px-4">Recommended Correction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
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
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    "₹799 ONLY"
                  </td>
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
                  <td className="py-3.5 px-4 font-mono text-slate-700">
                    No "*T&C Apply" text found
                  </td>
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

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('audit')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Audit Studio
            </button>
            <button
              onClick={() => onStageChange('decision')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2"
            >
              Next: Administrator Adjudication & Decision <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ──── STAGE 10: ADMINISTRATOR DECISION & ENFORCEMENT ──── */}
      {currentStage === 'decision' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Stage 10 of 10
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
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 ${
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
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition text-center ${
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
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Commit Adjudication Record
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => onStageChange('report')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Violation Report
            </button>
            <button
              onClick={() => onStageChange('org')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition flex items-center gap-2"
            >
              Restart Lifecycle Workflow <RotateCcw className="w-3.5 h-3.5 ml-1 inline" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


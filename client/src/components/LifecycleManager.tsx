import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  BookOpen,
  Zap,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Building2,
  FolderOpen,
  RotateCcw,
  Info,
  ShoppingBag,
  HeartPulse,
  Landmark,
  GraduationCap,
  Utensils,
  CarFront,
  RadioTower,
  CircleDot,
  CheckCircle2,
  Lock,
  X,
  Eye,
  Download,
  FileSpreadsheet,
  FileCode
} from 'lucide-react';
import { DocumentPreviewModal, DocumentPreviewItem } from './DocumentPreviewModal';

export type LifecycleStage =
  | 'org'
  | 'sector'
  | 'docs'
  | 'intelligence'
  | 'review'
  | 'approval'
  | 'activation'
  | 'audit'
  // Legacy aliases for backwards compatibility
  | 'extraction'
  | 'repository'
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

export interface WorkflowStageDefinition {
  id: LifecycleStage;
  stageNumber: number;
  title: string;
  shortTitle: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  purpose: string;
  whatOrgDoes: string;
  aiFunctionality: string;
  targetPage: string;
  actionButtonText: string;
  actionButtonDesc: string;
  previewCardTitle: string;
  previewDetails: { label: string; value: string }[];
}

export const CANONICAL_WORKFLOW_STAGES: WorkflowStageDefinition[] = [
  {
    id: 'docs',
    stageNumber: 1,
    title: 'Document Submission',
    shortTitle: 'Document Submission',
    badge: 'Stage 01 • Source Ingestion',
    icon: FolderOpen,
    purpose:
      'Ingest and catalog the organisation’s foundational commercial documents, master product specs, brand guidelines, and marketing promotional directives into the Integrix document vault.',
    whatOrgDoes:
      'NOVAWEAR submits brand policy briefs, e-commerce catalogue sheets (NW-CS-001, NW-CS-002, NW-EP-003), promotional pricing constraints, and logistics SLA commitments.',
    aiFunctionality:
      'Deterministic document parsers extract structured text, tabular catalogue matrices, warranty stipulations, and discount boundaries with full source provenance tracking.',
    targetPage: 'policy-repository',
    actionButtonText: 'Open Document Repository',
    actionButtonDesc: 'Inspect uploaded source documents, catalogue master rows, and campaign briefs.',
    previewCardTitle: 'NOVAWEAR Ingested Reference Documents',
    previewDetails: [
      { label: '01_Brand_Style_and_Identity.pdf', value: 'Logo clear zones, typography, unapproved superlative restrictions' },
      { label: '02_Company_Profile.pdf', value: 'Corporate identity, Chennai express delivery SLA specifications' },
      { label: '03_Marketing_Policy.pdf', value: 'Promotional discount ceilings (Max 40% OFF), mandatory disclaimer mandates' },
      { label: '05_Product_Catalogue.xlsx', value: 'Official SKUs, fabric compositions (100% Cotton), pricing floor (₹899)' },
    ],
  },
  {
    id: 'intelligence',
    stageNumber: 2,
    title: 'Policy Intelligence Analysis',
    shortTitle: 'Policy Intelligence',
    badge: 'Stage 02 • AI Analysis',
    icon: Sparkles,
    purpose:
      'Perform autonomous cross-document synthesis to detect conflicting directives, ambiguous compliance criteria, and missing operational constraints across brand assets.',
    whatOrgDoes:
      'NOVAWEAR triggers automated policy intelligence scans whenever new campaign materials or supplier catalogue updates are submitted.',
    aiFunctionality:
      'Identifies inter-document contradictions (e.g. Express delivery claims vs regional fulfillment boundaries; EOSS discount caps vs product margin floors) and stages structured remediation proposals.',
    targetPage: 'policy-intelligence',
    actionButtonText: 'Open Policy Intelligence Studio',
    actionButtonDesc: 'Review detected contradictions, ambiguity findings, and AI-staged resolutions.',
    previewCardTitle: 'Autonomous Cross-Document Intelligence Findings',
    previewDetails: [
      { label: 'Conflict NW-INT-001', value: 'Promotional discount ceiling: Marketing policy says Max 40% OFF vs Campaign Brief draft claiming 50% Flat' },
      { label: 'Ambiguity NW-INT-002', value: 'Express shipping: "Next Day Delivery" advertised without geographical caveat (restricted strictly to Chennai)' },
      { label: 'Missing Rule NW-INT-003', value: 'Mandatory disclaimer: EOSS promotional banners must declare "*T&C Apply. Valid until stocks last."' },
      { label: 'Composition Gap NW-INT-004', value: 'Blended poly-cotton items (NW-CS-002) require explicit non-100% cotton labeling' },
    ],
  },
  {
    id: 'review',
    stageNumber: 3,
    title: 'Policy Review',
    shortTitle: 'Policy Review',
    badge: 'Stage 03 • Harmonization',
    icon: FileText,
    purpose:
      'Examine flagged policy contradictions, inspect verbatim document citations, and evaluate harmonized draft recommendations staged by the intelligence engine.',
    whatOrgDoes:
      'Compliance managers and legal officers review proposed policy syntheses, compare conflicting document excerpts, and determine whether to accept or adjust recommendations.',
    aiFunctionality:
      'Synthesizes plain-language harmonization rationales, evaluates legal severity levels, and presents executable condition definitions before administrator sign-off.',
    targetPage: 'policy-intelligence',
    actionButtonText: 'Open Recommendation Review',
    actionButtonDesc: 'Inspect citation evidence, examine harmonized wording, and advance recommendations.',
    previewCardTitle: 'Harmonization Findings & Proposed Wording',
    previewDetails: [
      { label: 'Recommended Rule NW-R-004', value: 'Enforce maximum discount ceiling at 40% OFF across all digital & print campaign creatives' },
      { label: 'Recommended Rule NW-R-005', value: 'Require "Within Chennai metro limits" qualification whenever Same-Day / Next-Day delivery is claimed' },
      { label: 'Recommended Rule NW-R-002', value: 'Prohibit advertised pricing below ₹899 promotional floor for Classic Cotton Shirt (NW-CS-001)' },
      { label: 'Target Action', value: 'Accept recommendation to queue for formal Administrator Approval sign-off' },
    ],
  },
  {
    id: 'approval',
    stageNumber: 4,
    title: 'Administrator Approval',
    shortTitle: 'Admin Approval',
    badge: 'Stage 04 • Governance Sign-Off',
    icon: CheckSquare,
    purpose:
      'Enforce formal administrative governance through dual-control review, explicit approval sign-offs, or justified rejections with immutable audit trail logging.',
    whatOrgDoes:
      'The designated Lead Compliance Administrator formally reviews queued recommendations and authorizes them into the certified organisation policy registry.',
    aiFunctionality:
      'Maintains strict status separation: rejected recommendations are permanently discarded from execution, while approved policies advance into the executable rule compiler.',
    targetPage: 'approval-centre',
    actionButtonText: 'Open Administrator Approval Centre',
    actionButtonDesc: 'Access formal approval queue, verify rationale, and authorize staged rules.',
    previewCardTitle: 'Administrator Review & Governance Sign-Off Queue',
    previewDetails: [
      { label: 'Decision Queue', value: 'Staged policy harmonizations awaiting formal enterprise administrator signature' },
      { label: 'Authority Controls', value: 'Role-based approvals prevent unverified policy shifts from silently altering enforcement' },
      { label: 'Audit Logging', value: 'Records administrator identity, timestamp (IST), justification, and version tag' },
      { label: 'Rejection Handling', value: 'Rejected candidates are archived with recorded rationale and never compile to active rules' },
    ],
  },
  {
    id: 'activation',
    stageNumber: 5,
    title: 'Rulebook Activation',
    shortTitle: 'Rulebook Activation',
    badge: 'Stage 05 • Rule Compiler',
    icon: BookOpen,
    purpose:
      'Compile approved policy recommendations into deterministic, versioned executable rulebooks ready for real-time creative compliance enforcement.',
    whatOrgDoes:
      'NOVAWEAR maintains an active, immutable rulebook (Version v1.0) governing all promotional campaigns, product claims, and pricing declarations.',
    aiFunctionality:
      'Translates legal and brand directives into deterministic AST logic, regex pattern evaluators, and numerical boundary validators that execute in milliseconds.',
    targetPage: 'rules',
    actionButtonText: 'Open Policy Rulebook',
    actionButtonDesc: 'Inspect active compiled rules, condition logic, severity levels, and version metadata.',
    previewCardTitle: 'NOVAWEAR Active Policy Rulebook (v1.0)',
    previewDetails: [
      { label: 'NW-R-001 (Fabric Integrity)', value: 'Claims of 100% Pure Cotton require SKU fabric composition verification' },
      { label: 'NW-R-002 (Price Integrity)', value: 'Advertised price for NW-CS-001 must not be below catalogue floor ₹899' },
      { label: 'NW-R-003 (Legal Disclaimer)', value: 'Promotional offers require visible "*T&C Apply. Valid until stocks last"' },
      { label: 'NW-R-004 (Discount Ceiling)', value: 'Discount percentages exceeding 40% are flagged as CRITICAL violations' },
    ],
  },
  {
    id: 'audit',
    stageNumber: 6,
    title: 'Creative Compliance Verification',
    shortTitle: 'Creative Verification',
    badge: 'Stage 06 • Enforcement Audit',
    icon: Zap,
    purpose:
      'Verify marketing posters, social media banners, and campaign copy against the active policy rulebook using multimodal OCR, catalogue cross-checks, and deterministic scoring.',
    whatOrgDoes:
      'Marketing teams submit draft creative assets (e.g. AD-NW-001 through AD-NW-007) prior to media spend to prevent misleading consumer claims and regulatory penalties.',
    aiFunctionality:
      'Extracts visual text via multi-modal OCR, resolves advertised product SKUs and prices, matches claims against active rules, and generates actionable remediation diffs.',
    targetPage: 'creative-audit',
    actionButtonText: 'Open Creative File Audit',
    actionButtonDesc: 'Upload marketing collateral, run OCR extraction, and test live deterministic enforcement.',
    previewCardTitle: 'Creative Audit Engine & Verification Test Pack',
    previewDetails: [
      { label: 'AD-NW-001 (Compliant)', value: 'Classic Cotton Shirt at ₹999 with valid disclaimers → 100/100 COMPLIANT PASS' },
      { label: 'AD-NW-002 (Price Violation)', value: 'Advertised price ₹799 violates minimum floor NW-R-002 → NON-COMPLIANT' },
      { label: 'AD-NW-003 (Fabric Misrepresentation)', value: 'Poly-blend shirt claimed as 100% Cotton violates NW-R-001 → NON-COMPLIANT' },
      { label: 'AD-NW-007 (Delivery Guarantee)', value: 'Unqualified delivery claim outside Chennai violates NW-R-005 → NON-COMPLIANT' },
    ],
  },
];

interface LifecycleManagerProps {
  currentStage: LifecycleStage;
  onStageChange: (stage: LifecycleStage) => void;
  onNavigateTo?: (page: string, returnStage?: LifecycleStage) => void;
  onBackToHome?: () => void;
  activeOrgName?: string;
  activeOrgId?: string;
  onNavigateToAudit?: () => void;
  onSwitchOrg?: () => void;
  onAuditScenarioSelect?: (scenarioId: string) => void;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({
  currentStage,
  onStageChange,
  onNavigateTo,
  onBackToHome,
}) => {
  // Pre-filled NOVAWEAR Organisation Profile
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
      const saved = localStorage.getItem('integrix_org_profile_org-novawear') || localStorage.getItem('integrix_org_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultOrg;
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_org_profile_org-novawear', JSON.stringify(org));
    } catch {}
  }, [org]);

  // Sector State: pre-selected to Retail & Fashion for NOVAWEAR
  const [selectedSector, setSelectedSector] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('integrix_selected_sector_org-novawear') || localStorage.getItem('integrix_selected_sector');
      if (saved) return saved;
    } catch {}
    return 'retail';
  });

  useEffect(() => {
    try {
      localStorage.setItem('integrix_selected_sector_org-novawear', selectedSector);
    } catch {}
  }, [selectedSector]);

  const [sectorModalInfo, setSectorModalInfo] = useState<SectorItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

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

  // Map legacy / non-canonical stages
  const normalizeCanonicalStage = (stage: LifecycleStage): LifecycleStage => {
    switch (stage) {
      case 'org':
        return 'org';
      case 'sector':
        return 'sector';
      case 'docs':
        return 'docs';
      case 'intelligence':
        return 'intelligence';
      case 'extraction':
      case 'review':
        return 'review';
      case 'approval':
        return 'approval';
      case 'repository':
      case 'activation':
        return 'activation';
      case 'audit':
      case 'report':
      case 'decision':
      default:
        return 'audit';
    }
  };

  const activeStage = normalizeCanonicalStage(currentStage);
  const isIntroductoryStage = activeStage === 'org' || activeStage === 'sector';

  const canonicalStageIndex = CANONICAL_WORKFLOW_STAGES.findIndex((s) => s.id === activeStage);
  const currentStageObj =
    canonicalStageIndex >= 0
      ? CANONICAL_WORKFLOW_STAGES[canonicalStageIndex]
      : CANONICAL_WORKFLOW_STAGES[0];

  const handleOpenModule = (targetPage: string) => {
    if (onNavigateTo) {
      onNavigateTo(targetPage, currentStageObj.id);
    }
  };

  return (
    <div className="w-full mb-12 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold animate-fadeIn flex items-center gap-2 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          HEADER BANNER: FIXED NOVAWEAR CONTEXT & SETUP TABS
          ───────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5">
            {onBackToHome && (
              <button
                type="button"
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Return to Home Landing Page"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Home</span>
              </button>
            )}
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-1 rounded-lg">
              Evaluator Demonstration Mode
            </span>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>NOVAWEAR Retail Private Limited</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">
              End-to-End Governance Architecture
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[11px] font-mono font-bold text-slate-600">
              {activeStage === 'org'
                ? 'Setup 01: Onboarding'
                : activeStage === 'sector'
                ? 'Setup 02: Sector Selection'
                : `Stage ${currentStageObj.stageNumber} of 6`}
            </span>
          </div>
        </div>

        {/* Header Introduction */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              End-to-End Governance Architecture Walkthrough
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Explore how Integrix AI transforms unstructured enterprise documents into verified policy intelligence,
              formal administrator approvals, certified executable rulebooks, and automated creative compliance enforcement.
              Review the initial organisation onboarding and sector compliance setup below, or inspect any of the six canonical governance stages.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onStageChange('org')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              title="Start journey from Organisation Onboarding"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Restart from Onboarding</span>
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TWO-TIER NAVIGATION:
            1. INTRODUCTORY SETUP SCREENS (Onboarding & Sector)
            2. 6 CANONICAL GOVERNANCE STAGES (Step 1 to Step 6)
            ───────────────────────────────────────────────────────────── */}
        <div className="pt-2 space-y-3">
          {/* Tier 1: Introductory Setup Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5">
              Introductory Setup:
            </span>
            <button
              type="button"
              onClick={() => onStageChange('org')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStage === 'org'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>1. Organisation Onboarding</span>
              <span className="text-[10px] opacity-80">(NOVAWEAR Prefilled)</span>
            </button>

            <button
              type="button"
              onClick={() => onStageChange('sector')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeStage === 'sector'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>2. Business Sector Selection</span>
              <span className="text-[10px] opacity-80">(Retail & Fashion)</span>
            </button>

            <div className="ml-auto hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
              <span>Next up:</span>
              <button
                type="button"
                onClick={() => onStageChange('docs')}
                className="font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Step 1: Document Submission</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Tier 2: 6 Canonical Governance Stages */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5 px-1">
              Canonical Governance Stages (Steps 1 – 6):
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {CANONICAL_WORKFLOW_STAGES.map((stg) => {
                const isSelected = !isIntroductoryStage && stg.id === currentStageObj.id;
                const IconComp = stg.icon;

                return (
                  <button
                    type="button"
                    key={stg.id}
                    onClick={() => onStageChange(stg.id)}
                    className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between group relative ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        Step 0{stg.stageNumber}
                      </span>
                      <IconComp
                        className={`w-4 h-4 ${
                          isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                    </div>

                    <div>
                      <div
                        className={`text-xs font-extrabold truncate ${
                          isSelected ? 'text-indigo-950' : 'text-slate-800'
                        }`}
                      >
                        {stg.shortTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {stg.badge.split('•')[1]?.trim() || stg.title}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-600 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STAGE VIEWPORT:
          CASE A: INTRODUCTORY SETUP 1 – ORGANISATION ONBOARDING
          ───────────────────────────────────────────────────────────── */}
      {activeStage === 'org' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  INTRODUCTORY SETUP 01 • ORGANISATION ONBOARDING
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
              type="button"
              onClick={() => {
                setOrg(defaultOrg);
                showToast('Reset to NOVAWEAR default sample profile');
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
              NOVAWEAR profile prefilled. Proceed to verify business sector alignment.
            </div>
            <button
              type="button"
              onClick={() => onStageChange('sector')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Next: Select Business Sector <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE VIEWPORT:
          CASE B: INTRODUCTORY SETUP 2 – BUSINESS SECTOR SELECTION
          ───────────────────────────────────────────────────────────── */}
      {activeStage === 'sector' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8 animate-fadeIn">
          <div className="pb-6 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              INTRODUCTORY SETUP 02 • BUSINESS SECTOR SELECTION
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
                    type="button"
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
                    type="button"
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
              type="button"
              onClick={() => onStageChange('org')}
              className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1 inline" /> Previous: Organisation Onboarding
            </button>
            <button
              type="button"
              onClick={() => onStageChange('docs')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              Proceed to Step 1: Document Submission <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE VIEWPORT:
          CASE C: CANONICAL GOVERNANCE STAGES (STEPS 1 – 6)
          ───────────────────────────────────────────────────────────── */}
      {!isIntroductoryStage && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden animate-fadeIn">
          {/* Stage Header */}
          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/60 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                <currentStageObj.icon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-md">
                    Step 0{currentStageObj.stageNumber}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    {currentStageObj.badge}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  {currentStageObj.title}
                </h3>
              </div>
            </div>

            {/* High-Visibility Action Button to Real Application Module */}
            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenModule(currentStageObj.targetPage)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{currentStageObj.actionButtonText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Stage Explanatory Body */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Purpose & Enterprise Context */}
              <div className="space-y-4 lg:col-span-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-700">
                    <Info className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Stage Objective</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {currentStageObj.purpose}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-indigo-900">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Organisation Action</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentStageObj.whatOrgDoes}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-900">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>AI & System Intelligence</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {currentStageObj.aiFunctionality}
                  </p>
                </div>
              </div>

              {/* Column 2 & 3: Interactive Visual Preview */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                        {currentStageObj.previewCardTitle}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      NOVAWEAR Workspace
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentStageObj.previewDetails.map((item, idx) => {
                      // If this is stage 1 (docs), add a preview button directly to inspect the sample file
                      const isDocsStage = currentStageObj.id === 'docs';
                      const filename = item.label.endsWith('.pdf') || item.label.endsWith('.xlsx') || item.label.endsWith('.docx')
                        ? item.label
                        : item.label.includes('Brand_Style') ? '01_Brand_Guidelines.pdf'
                        : item.label.includes('Company_Profile') ? '02_Company_Profile.pdf'
                        : item.label.includes('Marketing_Policy') ? '03_Marketing_and_Communication_Policy.pdf'
                        : item.label.includes('Catalogue') ? '05_Product_Catalogue_and_Campaigns.xlsx'
                        : null;

                      return (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                        >
                          <div>
                            <div className="text-[11px] font-bold text-slate-800 break-words flex items-center justify-between gap-1">
                              <span>{item.label}</span>
                              {isDocsStage && filename && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const ext = filename.split('.').pop()?.toLowerCase();
                                    setPreviewDoc({
                                      id: `STAGE-DOC-${idx}`,
                                      filename: filename,
                                      title: filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                                      fileType: ext === 'xlsx' ? 'Excel Spreadsheet' : ext === 'docx' ? 'Word Document' : 'PDF Document',
                                      path: `/sample-docs/${filename}`,
                                    });
                                  }}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Preview</span>
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 leading-relaxed">
                              {item.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Direct Action Callout */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-indigo-50/50 to-transparent p-4 rounded-xl">
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Experience this stage in the live workspace
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {currentStageObj.actionButtonDesc}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenModule(currentStageObj.targetPage)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer shrink-0"
                    >
                      <span>{currentStageObj.actionButtonText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Navigation Controls (Previous / Next / Step Selector) */}
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (canonicalStageIndex === 0) {
                    onStageChange('sector');
                  } else if (canonicalStageIndex > 0) {
                    onStageChange(CANONICAL_WORKFLOW_STAGES[canonicalStageIndex - 1].id);
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  {canonicalStageIndex === 0
                    ? 'Previous: Business Sector Selection'
                    : `Previous: ${CANONICAL_WORKFLOW_STAGES[canonicalStageIndex - 1].shortTitle}`}
                </span>
              </button>

              <div className="flex items-center gap-1.5">
                {CANONICAL_WORKFLOW_STAGES.map((stg, i) => (
                  <button
                    type="button"
                    key={stg.id}
                    onClick={() => onStageChange(stg.id)}
                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      i === canonicalStageIndex
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title={`Go to Stage ${stg.stageNumber}: ${stg.title}`}
                  >
                    {stg.stageNumber}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  if (canonicalStageIndex < CANONICAL_WORKFLOW_STAGES.length - 1) {
                    onStageChange(CANONICAL_WORKFLOW_STAGES[canonicalStageIndex + 1].id);
                  } else {
                    onStageChange('org');
                  }
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
              >
                <span>
                  {canonicalStageIndex < CANONICAL_WORKFLOW_STAGES.length - 1
                    ? `Next: ${CANONICAL_WORKFLOW_STAGES[canonicalStageIndex + 1].shortTitle}`
                    : 'Restart from Onboarding'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};

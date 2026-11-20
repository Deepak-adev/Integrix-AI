import React, { useState } from 'react';
import {
  Eye,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Maximize2,
  Tag,
  Crosshair,
  Layers,
  FileCheck,
  FileX,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  UserCheck,
  ThumbsUp,
  ThumbsDown,
  Info,
} from 'lucide-react';
import {
  VisualAuditAnalysis,
  BoundingBox,
  HumanReviewDecision,
  Finding,
} from '../types';

interface VisualAuditViewProps {
  visualAnalysis: VisualAuditAnalysis;
  imageUrl?: string | null;
  creativeFilename?: string;
  findings: Finding[];
  onReviewDecisionChange?: (decision: HumanReviewDecision) => void;
}

export const VisualAuditView: React.FC<VisualAuditViewProps> = ({
  visualAnalysis,
  imageUrl,
  creativeFilename,
  findings,
  onReviewDecisionChange,
}) => {
  const [selectedBox, setSelectedBox] = useState<BoundingBox | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'LOGO' | 'PRODUCT' | 'CLAIMS'>('OVERVIEW');
  const [decisions, setDecisions] = useState<Record<string, HumanReviewDecision>>({});

  const {
    detectedObjects = [],
    logoAnalysis,
    productVisualMatch,
    contextualClaims = [],
    multimodalSummary,
  } = visualAnalysis;

  const handleDecision = (findingId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const dec: HumanReviewDecision = {
      findingId,
      status,
      reviewedBy: 'Compliance Lead (Administrator)',
      reviewedAt: new Date().toISOString(),
      notes: status === 'ACCEPTED' ? 'Violation confirmed by administrator review.' : 'Flag dismissed after review of approved commercial exceptions.',
    };
    setDecisions((prev) => ({ ...prev, [findingId]: dec }));
    if (onReviewDecisionChange) {
      onReviewDecisionChange(dec);
    }
  };

  const getSeverityBadge = (sev?: string) => {
    switch (sev) {
      case 'RED':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-rose-100 text-rose-800 border border-rose-200">VIOLATION</span>;
      case 'AMBER':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">WARNING</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">VERIFIED</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-2 w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Eye className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  AI Computer Vision & Contextual Intelligence Engine
                </h3>
                <span className="text-[10px] font-mono uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded whitespace-nowrap">
                  v2.1 Multimodal
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                Simultaneous visual feature extraction, brand asset comparison, and contextual claim verification.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center justify-between sm:justify-start space-x-3 bg-slate-800/90 px-3 py-2 rounded-lg border border-slate-700/60 text-xs shrink-0 self-start xl:self-auto w-full xl:w-auto">
            <div className="text-center pr-3 border-r border-slate-700 flex-1 xl:flex-initial">
              <span className="block text-[10px] uppercase text-slate-400 font-semibold whitespace-nowrap">Visual Score</span>
              <span className={`text-sm sm:text-base font-black ${multimodalSummary.visualComplianceScore >= 80 ? 'text-emerald-400' : multimodalSummary.visualComplianceScore >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                {multimodalSummary.visualComplianceScore}%
              </span>
            </div>
            <div className="text-center pr-3 border-r border-slate-700 flex-1 xl:flex-initial">
              <span className="block text-[10px] uppercase text-slate-400 font-semibold whitespace-nowrap">Logo Integrity</span>
              <span className={`text-xs font-bold whitespace-nowrap ${logoAnalysis.brandMatch === 'APPROVED_MATCH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {logoAnalysis.brandMatch === 'APPROVED_MATCH' ? 'Compliant' : 'Altered'}
              </span>
            </div>
            <div className="text-center flex-1 xl:flex-initial">
              <span className="block text-[10px] uppercase text-slate-400 font-semibold whitespace-nowrap">Product Match</span>
              <span className={`text-xs font-bold whitespace-nowrap ${productVisualMatch.mismatchType === 'NONE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {productVisualMatch.mismatchType === 'NONE' ? 'Aligned' : 'Mismatch'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-4 border-t border-slate-800/80 pt-3 text-xs font-medium">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'OVERVIEW' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
          >
            Visual Workspace & Detection
          </button>
          <button
            onClick={() => setActiveTab('LOGO')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'LOGO' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
          >
            Logo Consistency Analysis
          </button>
          <button
            onClick={() => setActiveTab('PRODUCT')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'PRODUCT' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
          >
            Product Reference Comparison
          </button>
          <button
            onClick={() => setActiveTab('CLAIMS')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'CLAIMS' ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}`}
          >
            Contextual Claim Verification ({contextualClaims.length})
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5">
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-5">
            {/* Full-Width Visual Workspace & Creative View with Visual Overlays */}
            <div className="bg-slate-900 rounded-xl p-4 flex flex-col items-center justify-center relative min-h-[460px] border border-slate-800">
              <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-mono text-slate-300">{creativeFilename || 'Creative Asset'}</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">Click a detection zone to inspect</span>
              </div>

              <div className="relative mt-4 max-w-md w-full mx-auto rounded-lg overflow-hidden border border-slate-700 shadow-xl bg-slate-950">
                {imageUrl ? (
                  <img src={imageUrl} alt="Creative Advertisement" className="w-full h-auto max-h-[500px] object-contain block mx-auto" />
                ) : (
                  <div className="w-full h-80 flex flex-col items-center justify-center text-slate-500">
                    <Layers className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs">Creative image asset active</p>
                  </div>
                )}

                {/* Bounding Box Overlays */}
                {detectedObjects.map((box, idx) => {
                  const isSelected = selectedBox?.label === box.label;
                  const borderCol =
                    box.severity === 'RED'
                      ? 'border-rose-500 bg-rose-500/20 text-rose-200'
                      : box.severity === 'AMBER'
                      ? 'border-amber-500 bg-amber-500/20 text-amber-200'
                      : 'border-emerald-500 bg-emerald-500/15 text-emerald-200';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedBox(box)}
                      style={{
                        position: 'absolute',
                        left: `${box.x}%`,
                        top: `${box.y}%`,
                        width: `${box.width}%`,
                        height: `${box.height}%`,
                      }}
                      className={`border-2 cursor-pointer transition-all ${borderCol} ${isSelected ? 'ring-2 ring-white ring-offset-1 z-20' : 'hover:opacity-100 z-10'}`}
                    >
                      <span className="absolute -top-5 left-0 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-slate-950/90 border border-slate-700 whitespace-nowrap shadow-sm">
                        {box.label} ({Math.round(box.confidence * 100)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="w-full flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Approved Asset</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Warning / Review</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Visual Policy Violation</span>
                </span>
              </div>
            </div>

            {/* Inspection & Traceability Section (Side-by-Side or Stacked on Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Selected Visual Feature Inspector</span>
                  </h4>
                  {selectedBox && getSeverityBadge(selectedBox.severity)}
                </div>

                {selectedBox ? (
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 font-medium">Feature Tag:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedBox.label}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Feature Type</span>
                        <p className="font-semibold text-slate-800 mt-0.5">{selectedBox.type}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Model Confidence</span>
                        <p className="font-mono font-bold text-indigo-700 mt-0.5">{Math.round(selectedBox.confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    <Crosshair className="w-6 h-6 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p>Select any highlighted bounding box on the advertisement image to inspect visual evidence.</p>
                  </div>
                )}
              </div>

              {/* Multimodal Violations & Traceability List */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Visual & Multimodal Findings ({findings.length})</span>
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">Human Gate Active</span>
                </div>

                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {findings.map((f) => {
                    const dec = decisions[f.id];
                    return (
                      <div
                        key={f.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          f.severity === 'RED' ? 'bg-rose-50/60 border-rose-200' : f.severity === 'AMBER' ? 'bg-amber-50/60 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-mono font-bold text-[11px] text-slate-800">{f.ruleId}</span>
                              <span className="text-slate-400">•</span>
                              <span className="font-semibold text-slate-900">{f.policyName}</span>
                            </div>
                            <p className="text-slate-600 text-[11px] mt-1">{f.explanation}</p>
                          </div>
                          {getSeverityBadge(f.severity)}
                        </div>

                        {/* Evidence Citation */}
                        <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 truncate max-w-[240px]">
                            Source: <strong className="text-slate-700">{f.sourceFilename}</strong>
                          </span>

                          {/* Admin Review Action Buttons */}
                          <div className="flex items-center space-x-1 shrink-0">
                            {dec ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${dec.status === 'ACCEPTED' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'}`}>
                                {dec.status === 'ACCEPTED' ? 'Admin Confirmed' : 'Admin Dismissed'}
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleDecision(f.id, 'ACCEPTED')}
                                  title="Confirm violation and mandate correction"
                                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 text-[10px] flex items-center space-x-1"
                                >
                                  <ThumbsUp className="w-2.5 h-2.5" />
                                  <span>Accept</span>
                                </button>
                                <button
                                  onClick={() => handleDecision(f.id, 'REJECTED')}
                                  title="Dismiss flag after administrative review"
                                  className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 text-[10px] flex items-center space-x-1"
                                >
                                  <ThumbsDown className="w-2.5 h-2.5" />
                                  <span>Dismiss</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Logo Consistency Analysis */}
        {activeTab === 'LOGO' && (() => {
          const isDabur = logoAnalysis.logoName?.toLowerCase().includes('dabur') || logoAnalysis.approvedAssetUrl?.includes('dabur');
          return (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-indigo-600" />
                  <span>{isDabur ? 'Dabur Brand Asset & Master Brandmark Evaluation' : 'Brand Asset & Vector Logo Match Evaluation'}</span>
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  {isDabur ? (
                    <>Detected brand logo is compared with the official brandmark in the Dabur identity repository (<code className="bg-slate-200 px-1 py-0.5 rounded">dabur-logo.png</code>).</>
                  ) : (
                    <>Detected logo region is compared with the official vector assets in the organisation repository (<code className="bg-slate-200 px-1 py-0.5 rounded">NOVAWEAR_Logo_Navy.svg</code>).</>
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Approved Master Asset */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Approved Master Brand Asset</span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">SOURCE OF TRUTH</span>
                      </div>
                      <div className="h-28 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-3">
                        <img
                          src={isDabur ? '/logos/dabur-logo.png' : '/sample-docs/NOVAWEAR_Logo_Navy.svg'}
                          alt={isDabur ? 'Dabur Approved Logo' : 'NOVAWEAR Approved Logo'}
                          className="max-h-16 w-auto object-contain"
                        />
                      </div>
                      <div className="mt-3 text-xs text-slate-600 space-y-1">
                        <div>
                          <strong className="text-slate-700">Official Asset:</strong> {isDabur ? 'Dabur_Logo_Official.png' : 'NOVAWEAR_Logo_Navy.svg'}
                        </div>
                        <div>
                          <strong className="text-slate-700">Approved Primary Color:</strong> {isDabur ? 'Dabur Forest Green (#006837) & Red' : 'NOVA Navy (#172B4D)'}
                        </div>
                        <div>
                          <strong className="text-slate-700">{isDabur ? 'Heritage Lockup:' : 'Mandatory Tagline:'}</strong> {isDabur ? 'Banyan Tree Emblem (Est. 1884)' : '"EVERYDAY ESSENTIALS" (Slate Blue #315B7D)'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detected Logo Inspection */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Detected Logo in Creative</span>
                        {logoAnalysis.brandMatch === 'APPROVED_MATCH' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">APPROVED MATCH</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">ALTERED / UNAPPROVED</span>
                        )}
                      </div>
                      <div className={`p-4 rounded-lg border text-xs space-y-2 ${logoAnalysis.brandMatch === 'APPROVED_MATCH' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'}`}>
                        <div>
                          <span className="text-slate-500 font-medium">Observed Representation:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{logoAnalysis.observedDetails}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Integrity Assessment:</span>
                          <p className="text-slate-700 mt-0.5">{logoAnalysis.explanation}</p>
                        </div>
                        <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-200/80">
                          <span>Confidence: {Math.round(logoAnalysis.confidence * 100)}%</span>
                          <span>Policy: {isDabur ? '01_Dabur_Ayurvedic_Master_Brand_Guidelines_2026.pdf §1.2' : '01_Brand_Guidelines.pdf §1.3'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 3: Product Reference Comparison */}
        {activeTab === 'PRODUCT' && (() => {
          const isDabur = productVisualMatch.catalogueSku?.startsWith('DAB-') || productVisualMatch.detectedGarmentType?.toLowerCase().includes('bottle') || productVisualMatch.detectedGarmentType?.toLowerCase().includes('packaging') || productVisualMatch.detectedGarmentType?.toLowerCase().includes('tub') || productVisualMatch.detectedGarmentType?.toLowerCase().includes('vaporiser') || productVisualMatch.detectedGarmentType?.toLowerCase().includes('fmcg');
          return (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>{isDabur ? 'Product Packaging Characteristics vs Master Catalogue' : 'Product Visual Characteristics vs Catalogue Master'}</span>
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  {isDabur ? (
                    <>Visual FMCG packaging silhouette, label palette, bottle/tub format, and product claims are compared against the active organisation catalogue (<code className="bg-slate-200 px-1 py-0.5 rounded">Dabur Master Product Catalogue</code>).</>
                  ) : (
                    <>Visual garment silhouette, primary dye color hex, and styling features are compared against the active organisation catalogue (<code className="bg-slate-200 px-1 py-0.5 rounded">05_Product_Catalogue_and_Campaigns.xlsx</code>).</>
                  )}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Catalogue Target */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Approved Catalogue Specification</span>
                      <span className="font-mono text-xs font-bold text-indigo-700">{productVisualMatch.catalogueSku || (isDabur ? 'DAB-AML-001' : 'NW-CS-001')}</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Expected Category</span>
                        <span className="font-semibold text-slate-900">{productVisualMatch.catalogueExpectedCategory || (isDabur ? 'Hair Care' : 'Shirts')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Approved Colourway</span>
                        <span className="font-semibold text-slate-900">{productVisualMatch.catalogueExpectedColor || (isDabur ? 'Emerald Green (#006837)' : 'Navy (#172B4D)')}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">{isDabur ? 'Formulation Active' : 'Fabric Composition'}</span>
                        <span className="font-semibold text-slate-900">{isDabur ? (productVisualMatch.catalogueSku === 'DAB-GUL-002' ? '100% Pure Rose Water' : productVisualMatch.catalogueSku === 'DAB-ODM-003' ? 'Transfluthrin 0.88%' : 'Pure Amla Oil & Antioxidants') : '100% cotton'}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500">{isDabur ? 'Packaging Unit SLA' : 'Approved Fit'}</span>
                        <span className="font-semibold text-slate-900">{isDabur ? (productVisualMatch.catalogueSku === 'DAB-GUL-002' ? '50g Tub / 400ml Lotion' : productVisualMatch.catalogueSku === 'DAB-ODM-003' ? '45 ml Refill (Fits All)' : '275 ml Bottle') : 'Regular fit'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Detected Characteristics */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Detected Visual Characteristics</span>
                      {productVisualMatch.mismatchType === 'NONE' ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800">MATCH VERIFIED</span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800">PRODUCT MISMATCH</span>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">{isDabur ? 'Detected Packaging Type' : 'Detected Silhouette'}</span>
                        <span className="font-bold text-slate-900">{productVisualMatch.detectedGarmentType}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100 items-center">
                        <span className="text-slate-500">Detected Palette</span>
                        <span className="flex items-center space-x-1.5 font-semibold text-slate-900">
                          {productVisualMatch.detectedColorHex && (
                            <span
                              className="w-3.5 h-3.5 rounded border border-slate-300 inline-block"
                              style={{ backgroundColor: productVisualMatch.detectedColorHex }}
                            ></span>
                          )}
                          <span>{productVisualMatch.detectedColor}</span>
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-500">Feature Similarity Score</span>
                        <span className="font-mono font-bold text-indigo-700">{Math.round(productVisualMatch.similarityScore * 100)}%</span>
                      </div>
                      <div className="py-1">
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-200">
                          {productVisualMatch.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Tab 4: Contextual Claim Verification */}
        {activeTab === 'CLAIMS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Contextual Claim Verification Matrix</h4>
                <p className="text-xs text-slate-500">
                  Every promotional, pricing, composition, and performance claim verified against approved repository facts.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {contextualClaims.map((claim) => (
                <div
                  key={claim.id}
                  className={`p-4 rounded-xl border text-xs ${
                    claim.substantiated ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{claim.claimText}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700 font-bold">
                        {claim.claimType}
                      </span>
                    </div>
                    {claim.substantiated ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-emerald-100 text-emerald-800">
                        SUBSTANTIATED CLAIM
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-bold rounded bg-rose-100 text-rose-800">
                        {claim.substantiationStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Visual Presentation</span>
                      <p className="text-slate-700 mt-0.5">{claim.visualRepresentation}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Repository Evidence Source</span>
                      <p className="text-slate-800 font-medium mt-0.5">{claim.evidenceSource}</p>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-200/80 text-[11px] text-slate-600">
                    <strong className="text-slate-800">Compliance Reason:</strong> {claim.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

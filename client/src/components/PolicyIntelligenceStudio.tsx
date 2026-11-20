import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  FileQuestion,
  Copy,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  FileText,
  Edit3,
  Check,
  X,
  History,
  Building2,
  HelpCircle,
  Scale,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import {
  PolicyIntelligenceFinding,
  PolicyAnalysisRun,
  runPolicyAnalysis,
  getPolicyFindings,
  getPolicyRuns,
  getPolicyRunById,
  submitFindingReview,
  ReviewFindingPayload,
} from '../services/policyIntelligenceService';
import { Organisation } from '../types';
import { DocumentPreviewModal, DocumentPreviewItem } from './DocumentPreviewModal';

interface PolicyIntelligenceStudioProps {
  activeOrg: Organisation;
  onNavigateLifecycle?: (stageId: number) => void;
}

export const PolicyIntelligenceStudio: React.FC<PolicyIntelligenceStudioProps> = ({
  activeOrg,
  onNavigateLifecycle,
}) => {
  // State for metrics & findings
  const [loading, setLoading] = useState<boolean>(true);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [scope, setScope] = useState<'ALL' | 'ACTIVE_RULES' | 'SOURCES' | 'DRAFTS'>('ALL');
  const [latestRun, setLatestRun] = useState<PolicyAnalysisRun | null>(null);
  const [allFindings, setAllFindings] = useState<PolicyIntelligenceFinding[]>([]);
  const [runs, setRuns] = useState<PolicyAnalysisRun[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<PolicyIntelligenceFinding | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewTab, setViewTab] = useState<'findings' | 'history'>('findings');

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState<boolean>(false);
  const [reviewAction, setReviewAction] = useState<'ACCEPT' | 'REJECT' | 'EDIT' | 'DEFER'>('ACCEPT');
  const [modifiedWording, setModifiedWording] = useState<string>('');
  const [adminComments, setAdminComments] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewItem | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load initial data (always loads complete repository findings so metrics remain invariant)
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch runs history
      const runsData = await getPolicyRuns(1, 10);
      setRuns(runsData.runs || []);
      if (runsData.runs && runsData.runs.length > 0) {
        setLatestRun(runsData.runs[0]);
      }

      // 2. Fetch all findings across organization without filtering to preserve global counts
      const findingsData = await getPolicyFindings({
        limit: 200,
      });
      const loadedFindings = findingsData.findings || [];
      setAllFindings(loadedFindings);
      if (loadedFindings.length > 0 && !selectedFinding) {
        setSelectedFinding(loadedFindings[0]);
      }
    } catch (err: any) {
      console.warn('[PolicyIntelligenceStudio] Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Execute Analysis
  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    setReviewFeedback(null);
    try {
      const runResult = await runPolicyAnalysis(scope);
      setLatestRun(runResult);
      // Reload all findings
      const findingsData = await getPolicyFindings({ limit: 200 });
      const reloadedFindings = findingsData.findings || [];
      setAllFindings(reloadedFindings);
      if (reloadedFindings.length > 0) {
        setSelectedFinding(reloadedFindings[0]);
      }
      // Reload runs
      const runsData = await getPolicyRuns(1, 10);
      setRuns(runsData.runs || []);
      setReviewFeedback({
        type: 'success',
        message: `Latest analysis run completed (${runResult.runId}): ${runResult.totalFindings} findings identified (${runResult.conflictsCount} conflicts, ${runResult.ambiguitiesCount} ambiguities, ${runResult.missingCount} missing requirements).`,
      });
    } catch (err: any) {
      setReviewFeedback({
        type: 'error',
        message: `Analysis failed: ${err.message}`,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Review Dialog
  const openReviewDialog = (action: 'ACCEPT' | 'REJECT' | 'EDIT' | 'DEFER', finding: PolicyIntelligenceFinding) => {
    setSelectedFinding(finding);
    setReviewAction(action);
    setModifiedWording(finding.recommendedWording || finding.existingWording || '');
    setAdminComments('');
    setRejectionReason('');
    setReviewModalOpen(true);
    setReviewFeedback(null);
  };

  // Submit Review Action
  const handleSubmitReview = async () => {
    if (!selectedFinding) return;

    if (reviewAction === 'REJECT' && !rejectionReason.trim() && !adminComments.trim()) {
      alert('Please provide a reason or comment explaining why this recommendation is being rejected.');
      return;
    }
    if (reviewAction === 'EDIT' && !modifiedWording.trim()) {
      alert('Modified policy wording cannot be empty.');
      return;
    }

    setReviewSubmitting(true);
    try {
      const payload: ReviewFindingPayload = {
        action: reviewAction,
        reviewerName: 'Lead Policy Administrator',
        reviewerRole: 'COMPLIANCE_DIRECTOR',
        adminComments: adminComments.trim() || undefined,
        rejectionReason: reviewAction === 'REJECT' ? (rejectionReason.trim() || adminComments.trim()) : undefined,
        modifiedWording: reviewAction === 'EDIT' ? modifiedWording.trim() : undefined,
      };

      const result = await submitFindingReview(selectedFinding.findingId, payload);

      // Update state locally
      setSelectedFinding(prev => prev ? { ...prev, status: result.status as any, recommendedWording: result.finding.recommendedWording } : null);
      setAllFindings(prev =>
        prev.map(f => (f.findingId === selectedFinding.findingId ? { ...f, status: result.status as any, recommendedWording: result.finding.recommendedWording } : f))
      );

      setReviewModalOpen(false);
      setReviewFeedback({
        type: 'success',
        message: `Finding ${selectedFinding.findingId} marked as ${result.status}. ${result.isStagedForApproval ? 'Wording staged for formal administrator sign-off.' : ''}`,
      });
    } catch (err: any) {
      alert(`Review action failed: ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Filtered findings by category, severity, status, and search query
  const displayedFindings = allFindings.filter(f => {
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && f.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.title.toLowerCase().includes(q) ||
      f.explanation.toLowerCase().includes(q) ||
      f.affectedPolicyOrDoc.toLowerCase().includes(q) ||
      f.sourceDocumentName.toLowerCase().includes(q)
    );
  });

  // Calculate global invariant metric counts from all findings across the organisation
  const totalFindingsCount = allFindings.length;
  const conflictsCount = allFindings.filter(f => f.category === 'CONFLICT').length;
  const ambiguitiesCount = allFindings.filter(f => f.category === 'AMBIGUITY').length;
  const missingCount = allFindings.filter(f => f.category === 'MISSING_REQUIREMENT').length;
  const duplicatesCount = allFindings.filter(f => f.category === 'DUPLICATION').length;
  const pendingReviewCount = allFindings.filter(f => f.status === 'PENDING').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* ── TOP HERO BANNER & CONTROL BAR ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Policy Intelligence & Conflict Resolution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Policy Intelligence Studio
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Autonomous reasoning agent that cross-examines brand guidelines, logistics SLAs, customer commitments and commercial rules to eliminate contradictions, ambiguities and governance voids.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Organisation: <strong className="text-white">{activeOrg.name}</strong></span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span>Engine Mode: <strong className="text-emerald-300">{latestRun?.isAiEnhanced ? 'AI-Enhanced Neural Audit' : 'Deterministic Rule Analysis'}</strong></span>
              </span>
            </div>
          </div>

          {/* Trigger Analysis Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Analysis Scope:</span>
              <select
                value={scope}
                onChange={e => setScope(e.target.value as any)}
                disabled={analyzing}
                className="bg-slate-800 text-white text-xs rounded-lg px-2.5 py-1 border border-white/20 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="ALL">Entire Brand Repository</option>
                <option value="ACTIVE_RULES">Active Rules Only</option>
                <option value="SOURCES">Source Documents</option>
                <option value="DRAFTS">Staged Policy Drafts</option>
              </select>
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Cross-Examining Policies...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run Policy Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {reviewFeedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            reviewFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {reviewFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{reviewFeedback.message}</span>
          </div>
          <button
            onClick={() => setReviewFeedback(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STATS CARDS BAR ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Repository-Wide Policy Metrics</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {latestRun ? `Latest Run: ${latestRun.runId} (${latestRun.totalFindings} findings)` : 'No analysis runs yet'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Findings */}
          <div
            onClick={() => {
              setCategoryFilter('ALL');
              setStatusFilter('ALL');
            }}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              categoryFilter === 'ALL' && statusFilter === 'ALL'
                ? 'border-indigo-600 ring-2 ring-indigo-500/10'
                : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Findings</span>
              <Layers className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalFindingsCount}</div>
            <span className="text-[10px] text-slate-500 font-medium">Scanned corpus</span>
          </div>

          {/* Conflicts */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'CONFLICT' ? 'ALL' : 'CONFLICT')}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              categoryFilter === 'CONFLICT' ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Conflicts</span>
              <ShieldAlert className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-600">{conflictsCount}</div>
            <span className="text-[10px] text-rose-600/80 font-medium">Contradictory rules</span>
          </div>

          {/* Ambiguities */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'AMBIGUITY' ? 'ALL' : 'AMBIGUITY')}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              categoryFilter === 'AMBIGUITY' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Ambiguities</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600">{ambiguitiesCount}</div>
            <span className="text-[10px] text-amber-600/80 font-medium">Open to interpretation</span>
          </div>

          {/* Missing Requirements */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'MISSING_REQUIREMENT' ? 'ALL' : 'MISSING_REQUIREMENT')}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              categoryFilter === 'MISSING_REQUIREMENT' ? 'border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Missing</span>
              <FileQuestion className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-2xl font-black text-sky-600">{missingCount}</div>
            <span className="text-[10px] text-sky-600/80 font-medium">Regulatory voids</span>
          </div>

          {/* Duplications */}
          <div
            onClick={() => setCategoryFilter(categoryFilter === 'DUPLICATION' ? 'ALL' : 'DUPLICATION')}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              categoryFilter === 'DUPLICATION' ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/20' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Duplicates</span>
              <Copy className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-purple-600">{duplicatesCount}</div>
            <span className="text-[10px] text-purple-600/80 font-medium">Redundant clauses</span>
          </div>

          {/* Pending Review */}
          <div
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`bg-white p-4 rounded-2xl border transition-all cursor-pointer hover:shadow ${
              statusFilter === 'PENDING' ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20' : 'border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Pending Review</span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600">{pendingReviewCount}</div>
            <span className="text-[10px] text-indigo-600/80 font-medium">Awaiting decision</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA WITH 2 TABS (FINDINGS vs HISTORY) ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation & Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewTab('findings')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                viewTab === 'findings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>
                Policy Findings ({displayedFindings.length}
                {displayedFindings.length !== totalFindingsCount ? ` of ${totalFindingsCount}` : ''})
              </span>
            </button>
            <button
              onClick={() => setViewTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                viewTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Analysis History ({runs.length})</span>
            </button>
          </div>

          {viewTab === 'findings' && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="CONFLICT">Conflicts</option>
                  <option value="AMBIGUITY">Ambiguities</option>
                  <option value="MISSING_REQUIREMENT">Missing Requirements</option>
                  <option value="DUPLICATION">Duplications</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="ACCEPTED">Accepted (Staged)</option>
                  <option value="EDITED">Edited (Staged)</option>
                  <option value="DEFERRED">Deferred</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search finding details..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* ── TAB 1: FINDINGS MASTER-DETAIL WORKBENCH ── */}
        {viewTab === 'findings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
            {/* Left Column: Finding Cards List */}
            <div className="lg:col-span-5 border-r border-slate-200 overflow-y-auto max-h-[800px] p-4 space-y-3 bg-slate-50/30">
              {loading ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
                  <span>Loading policy findings...</span>
                </div>
              ) : displayedFindings.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700">No findings matching active filters</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try resetting category or search criteria.</p>
                </div>
              ) : (
                displayedFindings.map(finding => {
                  const isSelected = selectedFinding?.findingId === finding.findingId;

                  const categoryColors = {
                    CONFLICT: 'bg-rose-50 text-rose-700 border-rose-200',
                    AMBIGUITY: 'bg-amber-50 text-amber-700 border-amber-200',
                    MISSING_REQUIREMENT: 'bg-sky-50 text-sky-700 border-sky-200',
                    DUPLICATION: 'bg-purple-50 text-purple-700 border-purple-200',
                  };

                  const statusColors = {
                    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
                    ACCEPTED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    EDITED: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    DEFERRED: 'bg-slate-100 text-slate-700 border-slate-200',
                    REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
                  };

                  return (
                    <div
                      key={finding.findingId}
                      onClick={() => setSelectedFinding(finding)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            categoryColors[finding.category] || 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {finding.category.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {finding.isNeedsVerification && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white uppercase tracking-wider">
                              Needs Verification
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              statusColors[finding.status] || 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {finding.status}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{finding.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {finding.explanation}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[200px] font-medium">{finding.affectedPolicyOrDoc}</span>
                        <span className="font-mono">Conf: {(finding.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Finding Details Inspector */}
            <div className="lg:col-span-7 p-6 overflow-y-auto max-h-[800px] space-y-6">
              {selectedFinding ? (
                <>
                  {/* Header & Badges */}
                  <div className="space-y-2 pb-4 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">{selectedFinding.findingId}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Severity: {selectedFinding.severity}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          AI Confidence: {(selectedFinding.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white">
                          {selectedFinding.status}
                        </span>
                      </div>
                    </div>

                    <h2 className="text-lg font-extrabold text-slate-900 leading-snug">
                      {selectedFinding.title}
                    </h2>

                    {selectedFinding.isNeedsVerification && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold">Insufficient Supporting Ground-Truth: </strong>
                          This finding contains citations that require human verification before being converted into enforceable rules.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section A: Issue Overview */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Issue Overview & Risk
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      {selectedFinding.explanation}
                    </p>
                  </div>

                  {/* Section B: Supporting Evidence */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Supporting Evidence Citations
                      </h3>
                      {selectedFinding.sourceDocumentName && (
                        <button
                          type="button"
                          onClick={() => {
                            const filename = selectedFinding.sourceDocumentName || '';
                            const ext = filename.split('.').pop()?.toLowerCase();
                            setPreviewDoc({
                              id: `SRC-${filename}`,
                              filename: filename,
                              title: filename.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
                              fileType: ext === 'xlsx' ? 'Excel Spreadsheet' : ext === 'docx' ? 'Word Document' : 'PDF Document',
                              path: `/sample-docs/${filename}`,
                              pageRef: selectedFinding.sourceLocator,
                              highlightText: selectedFinding.evidenceExcerpts?.[0],
                            });
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>View Source Document</span>
                          <ExternalLink className="w-3 h-3 text-indigo-500" />
                        </button>
                      )}
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Locator: {selectedFinding.sourceLocator}</span>
                        </div>
                        {selectedFinding.sourceDocumentName && (
                          <span className="text-slate-400">
                            Source File: {selectedFinding.sourceDocumentName}
                          </span>
                        )}
                      </div>
                      {selectedFinding.evidenceExcerpts && selectedFinding.evidenceExcerpts.length > 0 ? (
                        <div className="space-y-1.5 pt-1">
                          {selectedFinding.evidenceExcerpts.map((ex, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-slate-800/80 rounded border border-slate-700/60 font-mono text-[11px] text-slate-200"
                            >
                              "{ex}"
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-400 italic text-[11px]">No exact excerpts extracted.</div>
                      )}
                    </div>
                  </div>

                  {/* Section C: Policy Comparison */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Side-by-Side Policy Comparison
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Existing */}
                      <div className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-rose-700 tracking-wider">
                          Current Contradictory / Ambiguous Statement
                        </div>
                        <p className="text-rose-950 font-medium leading-relaxed">
                          {selectedFinding.existingWording || 'No explicit existing wording provided.'}
                        </p>
                      </div>

                      {/* Recommended */}
                      <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                        <div className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                          Agent Recommended Harmonized Modification
                        </div>
                        <p className="text-emerald-950 font-medium leading-relaxed">
                          {selectedFinding.recommendedWording || 'No amendment wording proposed.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section D: Rationale */}
                  {selectedFinding.rationale && (
                    <div className="space-y-1.5 bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100 text-xs">
                      <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                        Recommendation Rationale
                      </span>
                      <p className="text-indigo-950 leading-relaxed font-medium">
                        {selectedFinding.rationale}
                      </p>
                    </div>
                  )}

                  {/* Section E: Administrator Action Controls */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">Administrator Review Actions:</span>
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                        Staged Review (Does not mutate live rules)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <button
                        onClick={() => openReviewDialog('ACCEPT', selectedFinding)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Recommendation</span>
                      </button>

                      <button
                        onClick={() => openReviewDialog('EDIT', selectedFinding)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Suggested Wording</span>
                      </button>

                      <button
                        onClick={() => openReviewDialog('DEFER', selectedFinding)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300 transition-all cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Defer for Review</span>
                      </button>

                      <button
                        onClick={() => openReviewDialog('REJECT', selectedFinding)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject Recommendation</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400">
                  Select a finding from the left panel to inspect issues, evidence and recommended amendments.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: ANALYSIS HISTORY ── */}
        {viewTab === 'history' && (
          <div className="p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Autonomous Policy Analysis Runs ({runs.length})
            </h3>
            {runs.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
                No previous analysis runs on record for this organisation.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {runs.map(r => (
                  <div
                    key={r.runId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono text-slate-900">{r.runId}</strong>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {r.status}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Scope: <strong>{r.scope}</strong>
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-1">{r.summary}</p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-3">
                        <span>Provider: {r.aiProvider} ({r.aiModel})</span>
                        {r.completedAt && (
                          <span>Executed: {new Date(r.completedAt).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">{r.totalFindings}</span>
                        <span className="text-[10px] text-slate-400 block">Findings</span>
                      </div>
                      <button
                        onClick={async () => {
                          const detailed = await getPolicyRunById(r.runId);
                          if (detailed && detailed.findings) {
                            setAllFindings(detailed.findings);
                            setLatestRun(detailed);
                            setCategoryFilter('ALL');
                            setStatusFilter('ALL');
                            if (detailed.findings.length > 0) {
                              setSelectedFinding(detailed.findings[0]);
                            }
                            setViewTab('findings');
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Inspect Run</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── ADMINISTRATOR REVIEW MODAL ── */}
      {reviewModalOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Administrator Review: {reviewAction} Recommendation
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Target: {selectedFinding.findingId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Editable Wording if EDIT */}
            {reviewAction === 'EDIT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Modified Harmonized Policy Statement:
                </label>
                <textarea
                  rows={4}
                  value={modifiedWording}
                  onChange={e => setModifiedWording(e.target.value)}
                  placeholder="Enter customized policy amendment wording..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                />
              </div>
            )}

            {/* Rejection Reason if REJECT */}
            {reviewAction === 'REJECT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-700">
                  Rejection Justification (Required):
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="State operational reason or commercial exemption why this finding is dismissed..."
                  className="w-full text-xs p-3 border border-rose-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 bg-rose-50/20"
                />
              </div>
            )}

            {/* General Administrative Comments */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Administrator Sign-off Note / Audit Log Remark:
              </label>
              <textarea
                rows={2}
                value={adminComments}
                onChange={e => setAdminComments(e.target.value)}
                placeholder="Optional audit log remark for traceability..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500">
              <strong>Audit Safety Note:</strong> Submitting this decision updates the review stage and saves an immutable audit record. It stages the policy wording for formal approval in Phase 6 without prematurely altering active brand rules.
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={reviewSubmitting}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                {reviewSubmitting ? 'Recording Decision...' : 'Confirm Decision'}
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

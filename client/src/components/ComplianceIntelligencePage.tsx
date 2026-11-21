import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Sliders,
  History,
  FolderKanban,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  Layers,
  Filter,
  FileText,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
  Tag,
  Check,
  ChevronRight,
  Building2,
  ExternalLink,
} from 'lucide-react';
import {
  getOrganisationRiskSummary,
  executeProactiveRevalidation,
  simulatePolicyChange,
  resetComplianceIntelToBaseline,
  OrganisationRiskSummary,
  AuditedAdRecord,
  RiskVector,
  RecurringViolation,
  CampaignAnalytics,
  PolicyChangeEvent,
} from '../services/complianceIntelligenceService';
import { Organisation } from '../types';
import { Page } from '../App';

interface ComplianceIntelligencePageProps {
  activeOrg: Organisation;
  onNavigate: (page: Page) => void;
  onLaunchAuditForAd?: (adCode: string) => void;
}

export const ComplianceIntelligencePage: React.FC<ComplianceIntelligencePageProps> = ({
  activeOrg,
  onNavigate,
  onLaunchAuditForAd,
}) => {
  const [summary, setSummary] = useState<OrganisationRiskSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'risk' | 'recurring' | 'campaigns' | 'revalidation'>('risk');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'RED' | 'AMBER'>('ALL');
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState<string>('ALL');

  // Interactive Revalidation state
  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [revalidationToast, setRevalidationToast] = useState<string | null>(null);

  // Policy Simulator Modal
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [simTitle, setSimTitle] = useState<string>('Revised Pincode Delivery Tier Guardrail');
  const [simEntity, setSimEntity] = useState<string>('NW-RULE-004 (Delivery SLA)');
  const [simPrev, setSimPrev] = useState<string>('Advisory footnote recommended');
  const [simNew, setSimNew] = useState<string>('Mandatory strict rejection without 14:00 cutoff and pincode token');
  const [simSource, setSimSource] = useState<string>('Consumer Protection Rules & ASCI Operational Code 2026');

  // Load summary whenever active organisation changes
  const loadSummary = () => {
    const res = getOrganisationRiskSummary(activeOrg.id);
    setSummary(res);
  };

  useEffect(() => {
    loadSummary();
  }, [activeOrg.id]);

  if (!summary) return null;

  // Handle proactive batch revalidation
  const handleBatchRevalidation = () => {
    setIsRevalidating(true);
    setTimeout(() => {
      const res = executeProactiveRevalidation(activeOrg.id);
      loadSummary();
      setIsRevalidating(false);
      setRevalidationToast(`Proactive revalidation completed: ${res.revalidatedCount} advertisements verified against active rulebook. New risk score: ${res.newRiskScore}/100.`);
      setTimeout(() => setRevalidationToast(null), 6000);
    }, 750);
  };

  // Handle single ad revalidation
  const handleSingleRevalidation = (adCode: string) => {
    const res = executeProactiveRevalidation(activeOrg.id, [adCode]);
    loadSummary();
    setRevalidationToast(`Creative ${adCode} successfully revalidated. Verdict updated.`);
    setTimeout(() => setRevalidationToast(null), 5000);
  };

  // Handle policy simulation submit
  const handleSimulatePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = simulatePolicyChange(activeOrg.id, {
      title: simTitle,
      targetEntity: simEntity,
      previousValue: simPrev,
      newValue: simNew,
      regulatorySource: simSource,
    });
    loadSummary();
    setShowSimModal(false);
    setActiveTab('revalidation');
    setRevalidationToast(
      `Policy amendment logged! Stale detection engine flagged ${res.newlyFlaggedAds.length} creative(s) [${res.newlyFlaggedAds.join(', ')}] requiring revalidation.`
    );
    setTimeout(() => setRevalidationToast(null), 7000);
  };

  // Handle reset to baseline
  const handleResetBaseline = () => {
    resetComplianceIntelToBaseline(activeOrg.id);
    loadSummary();
    setRevalidationToast('Compliance intelligence data reset to verified ground-truth baseline.');
    setTimeout(() => setRevalidationToast(null), 4000);
  };

  // Color mappings
  const getRiskColor = (score: number) => {
    if (score >= 70) return { text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', ring: '#e11d48' };
    if (score >= 45) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: '#d97706' };
    if (score >= 25) return { text: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', ring: '#4f46e5' };
    return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: '#059669' };
  };

  const riskTheme = getRiskColor(summary.compositeRiskScore);

  const filteredRecurring = summary.recurringViolations.filter((r) => {
    if (filterSeverity === 'ALL') return true;
    return r.severity === filterSeverity;
  });

  const filteredAudits = summary.auditedCreatives.filter((a) => {
    if (selectedCampaignFilter === 'ALL') return true;
    return a.campaignId === selectedCampaignFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* ── TOAST NOTIFICATION ── */}
      {revalidationToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/50 flex items-start gap-3 animate-slideUp">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs space-y-1">
            <strong className="font-bold text-white block">Intelligence Engine Event</strong>
            <p className="text-slate-300 leading-relaxed">{revalidationToast}</p>
          </div>
        </div>
      )}

      {/* ── TOP EXECUTIVE BANNER ── */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-indigo-500/20">
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-60 h-60 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5 shadow-xs">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Organisation Compliance Intelligence
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                {summary.orgName}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PROACTIVE MODE ACTIVE
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Enterprise Risk Scoring & Proactive Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Continuous compliance telemetry across all audited collateral. Moving from reactive single-ad checks to proactive risk management: recurring breach detection, campaign analytics, and automated stale-audit revalidation when rulebooks or catalogue specs change.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={handleBatchRevalidation}
              disabled={isRevalidating || summary.revalidationRequiredCount === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                summary.revalidationRequiredCount > 0
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-indigo-500/30 active:scale-95'
                  : 'bg-white/10 text-slate-400 cursor-not-allowed border border-white/10'
              }`}
              title="Revalidate all previously audited ads whose underlying rules or prices changed"
            >
              <RefreshCw className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`} />
              <span>{isRevalidating ? 'Revalidating Adverts…' : `Revalidate Stale Ads (${summary.revalidationRequiredCount})`}</span>
            </button>

            <button
              onClick={() => setShowSimModal(true)}
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Simulate a policy or price change to test automated stale detection"
            >
              <Sliders className="w-4 h-4 text-indigo-300" />
              <span>Simulate Policy Change</span>
            </button>

            <button
              onClick={handleResetBaseline}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 cursor-pointer"
              title="Reset data to default baseline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── HIGH-LEVEL TELEMETRY METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Composite Risk Index */}
        <div className={`p-5 rounded-2xl border ${riskTheme.border} ${riskTheme.bg} relative overflow-hidden transition-all shadow-xs`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Organisation Risk Index
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${riskTheme.text} bg-white shadow-2xs border border-slate-200`}>
              {summary.riskLevel} RISK
            </span>
          </div>

          <div className="flex items-baseline gap-3 mt-3">
            <span className={`text-4xl font-black ${riskTheme.text} font-mono tracking-tight`}>
              {summary.compositeRiskScore}
            </span>
            <span className="text-xs text-slate-400 font-bold">/ 100</span>
            <div className="ml-auto flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-100/80 px-2 py-0.5 rounded-md">
              <TrendingDown className="w-3 h-3" />
              <span>{summary.riskTrendDelta}% (30d)</span>
            </div>
          </div>

          <div className="mt-3 w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${summary.compositeRiskScore}%`,
                backgroundColor: riskTheme.ring,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium">
            Composite exposure based on high-severity violations and revalidation backlogs.
          </p>
        </div>

        {/* Card 2: Recurring Violation Patterns */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white relative overflow-hidden shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Recurring Breach Patterns
            </span>
            <span className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {summary.recurringPatternsCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Active Signatures</span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Cross-campaign pattern clustering active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Identifies systemic creative-agency templates generating repeated findings.
          </p>
        </div>

        {/* Card 3: Stale Ads Requiring Revalidation */}
        <div className={`p-5 rounded-2xl border ${summary.revalidationRequiredCount > 0 ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'} relative overflow-hidden shadow-xs transition-all`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Revalidation Backlog
            </span>
            <span className={`w-6 h-6 rounded-lg ${summary.revalidationRequiredCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center font-bold text-xs`}>
              <RefreshCw className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className={`text-3xl font-black font-mono tracking-tight ${summary.revalidationRequiredCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
              {summary.revalidationRequiredCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              {summary.revalidationRequiredCount === 1 ? 'Ad Needing Re-Check' : 'Ads Needing Re-Check'}
            </span>
          </div>

          <div className={`mt-3 flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
            summary.revalidationRequiredCount > 0
              ? 'bg-amber-100/80 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${summary.revalidationRequiredCount > 0 ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>{summary.revalidationRequiredCount > 0 ? 'Rule / Price Change Impact' : 'All Adverts Up to Date'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Previously passed collateral rendered stale by subsequent policy revisions.
          </p>
        </div>

        {/* Card 4: Monitored Campaigns */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white relative overflow-hidden shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Campaigns Tracked
            </span>
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
              <FolderKanban className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {summary.campaigns.length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">Active Flights</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-indigo-900 bg-indigo-50/70 px-2.5 py-1 rounded-lg border border-indigo-100">
            <span>Avg Clearance Rate:</span>
            <span className="font-mono text-indigo-700">
              {Math.round(summary.campaigns.reduce((acc, c) => acc + c.complianceRate, 0) / (summary.campaigns.length || 1))}%
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Aggregated audit pass/fail ratios grouped by promotional flight.
          </p>
        </div>
      </div>

      {/* ── MAIN TABBED SECTION ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tab Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 pt-3 bg-slate-50/60 overflow-x-auto">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('risk')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'risk'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-indigo-600" />
              <span>Risk Vectors & Trajectory</span>
            </button>

            <button
              onClick={() => setActiveTab('recurring')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'recurring'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Recurring Violation Detection</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                {summary.recurringViolations.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'campaigns'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>Campaign-Wise Analytics</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {summary.campaigns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('revalidation')}
              className={`px-4 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'revalidation'
                  ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-xl shadow-2xs font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-4 h-4 text-amber-500" />
              <span>Policy Tracking & Revalidation</span>
              {summary.revalidationRequiredCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                  {summary.revalidationRequiredCount} Stale
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono hidden md:block">
            Auto-Sync: Connected to Rulebook & Catalogue ERP
          </div>
        </div>

        {/* ── TAB 1: RISK VECTORS & TRAJECTORY ── */}
        {activeTab === 'risk' && (
          <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Organisation Compliance Risk Vectors
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Weighted risk exposure categorized across 5 regulatory compliance pillars for {summary.orgName}.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.riskVectors.map((vec) => {
                const vecTheme = getRiskColor(vec.score);
                return (
                  <div
                    key={vec.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          {vec.category} · WEIGHT {vec.weight}%
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-0.5">
                          {vec.name}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${vecTheme.text} ${vecTheme.bg} border ${vecTheme.border} shrink-0`}>
                        Score: {vec.score}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${vec.score}%`,
                          backgroundColor: vecTheme.ring,
                        }}
                      />
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {vec.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Top Sensitive Rule:</span>
                        <span className="font-mono font-bold text-slate-800">{vec.topOffendingRule}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium">Active Findings / Stale Ads:</span>
                        <span className="font-bold text-slate-800">
                          {vec.activeViolations} Findings · {vec.staleAdsCount} Stale Ads
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-start gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <span>
                          <strong className="text-slate-900">Proactive Mitigation: </strong>
                          {vec.mitigationGuidance}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 30-Day Risk Trajectory Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                    Historic Telemetry
                  </span>
                  <h4 className="text-base font-black text-white">
                    30-Day Proactive Risk Reduction Trajectory
                  </h4>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>14% Overall Exposure Decrease</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                By running deterministic pre-flight checks and automated revalidation on catalogue shifts, the organisation has successfully reduced critical regulatory exposure across advertising channels from 52/100 to {summary.compositeRiskScore}/100.
              </p>

              {/* Progress Milestones */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Day 30 (Baseline)</div>
                  <div className="text-lg font-black text-slate-200 mt-1 font-mono">52 / 100 Risk</div>
                  <div className="text-[10px] text-slate-400">Unchecked delivery promises</div>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Day 15 (Policy Sync)</div>
                  <div className="text-lg font-black text-indigo-300 mt-1 font-mono">41 / 100 Risk</div>
                  <div className="text-[10px] text-slate-400">Rule NW-004 tightened</div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
                  <div className="text-[10px] uppercase font-bold text-indigo-300">Today (Proactive)</div>
                  <div className="text-lg font-black text-white mt-1 font-mono">{summary.compositeRiskScore} / 100 Risk</div>
                  <div className="text-[10px] text-emerald-300 font-bold">Automated Revalidation Enabled</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: RECURRING VIOLATION DETECTION ── */}
        {activeTab === 'recurring' && (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Systemic & Recurring Violation Detection
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Pattern analysis identifying repeated non-compliance across multiple campaigns and creative variations.
                </p>
              </div>

              {/* Severity Filter Toggle */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <button
                  onClick={() => setFilterSeverity('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterSeverity === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({summary.recurringViolations.length})
                </button>
                <button
                  onClick={() => setFilterSeverity('RED')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterSeverity === 'RED' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  Red Severity ({summary.recurringViolations.filter((r) => r.severity === 'RED').length})
                </button>
                <button
                  onClick={() => setFilterSeverity('AMBER')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    filterSeverity === 'AMBER' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-amber-600'
                  }`}
                >
                  Amber ({summary.recurringViolations.filter((r) => r.severity === 'AMBER').length})
                </button>
              </div>
            </div>

            {/* Pattern Cards List */}
            <div className="space-y-4">
              {filteredRecurring.map((pat) => (
                <div
                  key={pat.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono ${
                        pat.severity === 'RED' ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {pat.patternCode}
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        {pat.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                        {pat.recurrenceCount} Detected Occurrences
                      </span>
                    </div>
                  </div>

                  {/* Impacted Campaigns & Creatives Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold text-[11px]">Affected Campaigns:</span>
                    {pat.affectedCampaigns.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-100">
                        {c}
                      </span>
                    ))}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-400 font-bold text-[11px]">Creatives:</span>
                    {pat.affectedCreatives.map((cr) => (
                      <button
                        key={cr}
                        onClick={() => onLaunchAuditForAd ? onLaunchAuditForAd(cr) : onNavigate('audit')}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-100 hover:text-indigo-800 text-slate-700 font-mono font-bold text-[11px] border border-slate-200 transition-colors cursor-pointer"
                        title="Click to inspect this creative in Audit Studio"
                      >
                        {cr} ↗
                      </button>
                    ))}
                  </div>

                  {/* Root Cause & Remediation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Root Cause Diagnosis</span>
                      <p className="text-slate-700 leading-relaxed">{pat.rootCause}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-950 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Remediation Protocol
                      </span>
                      <p className="text-slate-800 leading-relaxed">{pat.remediationAdvice}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      <strong className="text-slate-600">Statutory Basis:</strong> {pat.statutoryBasis}
                    </span>
                    <span>Last detected: {new Date(pat.lastDetected).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: CAMPAIGN-WISE ANALYTICS ── */}
        {activeTab === 'campaigns' && (
          <div className="p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Campaign-Wise Compliance Analytics
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Evaluation of compliance clearance rates, risk grades, and active findings across active promotional flights.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.campaigns.map((camp) => (
                <div
                  key={camp.campaignId}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {camp.campaignId}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 mt-1.5 leading-snug">
                          {camp.title}
                        </h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        camp.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        camp.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {camp.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Target SKU: <strong className="text-slate-700 font-mono">{camp.sku}</strong></span>
                      <span>Channel: <strong className="text-slate-700">{camp.channel}</strong></span>
                    </div>

                    {/* Compliance Clearance Meter */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">Compliance Rate:</span>
                        <span className={`font-mono ${camp.complianceRate >= 80 ? 'text-emerald-600' : camp.complianceRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {camp.complianceRate}% Passed
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            camp.complianceRate >= 80 ? 'bg-emerald-500' : camp.complianceRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${camp.complianceRate}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{camp.passedAds} Passing</span>
                        <span>{camp.violatingAds} In Violation</span>
                        <span>Total: {camp.totalAds} Ads</span>
                      </div>
                    </div>

                    {/* Active Warnings */}
                    {camp.activeWarnings.length > 0 && (
                      <div className="space-y-1">
                        {camp.activeWarnings.map((w, idx) => (
                          <div key={idx} className="p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-800 flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                            <span>{w}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setSelectedCampaignFilter(camp.campaignId);
                        setActiveTab('revalidation');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Filter Audits for {camp.campaignId}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: POLICY TRACKING & REVALIDATION ENGINE (CORE FEATURE) ── */}
        {activeTab === 'revalidation' && (
          <div className="p-6 sm:p-8 space-y-8 animate-fadeIn">
            {/* Header & Explanatory Banner */}
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '6s' }} />
                  Automated Stale-Audit Revalidation Engine
                </span>
                <h4 className="text-sm font-black text-indigo-950">
                  Detecting Previously Audited Ads Impacted by Ground-Truth Changes
                </h4>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  When a policy rule is tightened or an ERP catalogue price changes, previously passed advertisements become stale and may violate current standards. Integrix AI automatically flags impacted creatives and re-evaluates them with 1 click.
                </p>
              </div>

              <button
                onClick={handleBatchRevalidation}
                disabled={isRevalidating || summary.revalidationRequiredCount === 0}
                className={`px-4 py-2.5 rounded-xl text-xs font-black shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                  summary.revalidationRequiredCount > 0
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <RefreshCw className={`w-4 h-4 ${isRevalidating ? 'animate-spin' : ''}`} />
                <span>Execute Batch Revalidation</span>
              </button>
            </div>

            {/* Campaign Filter Notice if active */}
            {selectedCampaignFilter !== 'ALL' && (
              <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs">
                <span>Filtering audits for campaign: <strong className="font-mono text-indigo-700">{selectedCampaignFilter}</strong></span>
                <button
                  onClick={() => setSelectedCampaignFilter('ALL')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {/* Stale Ads Revalidation Queue Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-slate-900">
                  Audited Advertisements Freshness Registry ({filteredAudits.length})
                </h4>
                <span className="text-xs text-slate-400">
                  {filteredAudits.filter((a) => a.revalidationNeeded).length} flagged as stale
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Ad Code & Title</th>
                        <th className="py-3 px-3">Campaign / SKU</th>
                        <th className="py-3 px-3">Original Audit</th>
                        <th className="py-3 px-3">Revalidation Status</th>
                        <th className="py-3 px-4">Policy Impact Diagnostics</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredAudits.map((ad) => (
                        <tr key={ad.id} className={`hover:bg-slate-50/80 transition-colors ${ad.revalidationNeeded ? 'bg-amber-50/30' : ''}`}>
                          {/* Creative */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {ad.image && (
                                <img
                                  src={ad.image}
                                  alt={ad.adCode}
                                  className="w-10 h-10 object-contain rounded-lg border border-slate-200 bg-slate-50 shrink-0"
                                />
                              )}
                              <div>
                                <div className="font-mono font-bold text-indigo-600 text-[11px]">{ad.adCode}</div>
                                <div className="font-bold text-slate-900 truncate max-w-[200px]">{ad.title}</div>
                              </div>
                            </div>
                          </td>

                          {/* Campaign & SKU */}
                          <td className="py-3 px-3 font-mono">
                            <div className="text-slate-800 font-bold">{ad.campaignId}</div>
                            <div className="text-[10px] text-slate-400">{ad.sku || 'General Brand'}</div>
                          </td>

                          {/* Original Audit Verdict */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                ad.originalVerdict === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                                ad.originalVerdict === 'FAIL' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {ad.originalVerdict}
                              </span>
                              <span className="mono text-[10px] text-slate-400">{ad.originalScore}/100</span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(ad.originalAuditDate).toLocaleDateString()}
                            </div>
                          </td>

                          {/* Revalidation Status */}
                          <td className="py-3 px-3">
                            {ad.revalidationNeeded ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                Revalidation Required
                              </span>
                            ) : ad.status === 'REVALIDATED' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-900 border border-indigo-200">
                                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                                Revalidated
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Policy Current
                              </span>
                            )}
                          </td>

                          {/* Policy Impact Diagnostics */}
                          <td className="py-3 px-4 max-w-xs">
                            {ad.revalidationReason ? (
                              <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                                {ad.revalidationReason}
                              </p>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">No underlying policy shifts detected</span>
                            )}
                          </td>

                          {/* Action Button */}
                          <td className="py-3 px-4 text-right">
                            {ad.revalidationNeeded ? (
                              <button
                                onClick={() => handleSingleRevalidation(ad.adCode)}
                                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
                              >
                                Re-Audit
                              </button>
                            ) : (
                              <button
                                onClick={() => onLaunchAuditForAd ? onLaunchAuditForAd(ad.adCode) : onNavigate('audit')}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                View
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Policy Change History Ledger */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Policy & Catalogue Revision Ledger
                  </h4>
                  <p className="text-xs text-slate-500">
                    Audit log of approved rulebook amendments and catalogue adjustments driving revalidation events.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {summary.policyChanges.map((chg) => (
                  <div
                    key={chg.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[10px] font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                          {chg.changeType}
                        </span>
                        <h5 className="font-black text-slate-900">{chg.title}</h5>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(chg.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-slate-600 text-[11px] space-y-0.5">
                        <div>
                          <strong className="text-slate-700">Target Entity:</strong> {chg.targetEntity}
                        </div>
                        <div>
                          <span className="line-through text-slate-400">{chg.previousValue}</span>
                          <span className="mx-2 text-indigo-600 font-bold">&rarr;</span>
                          <span className="font-bold text-slate-900">{chg.newValue}</span>
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          <strong>Authority:</strong> {chg.regulatorySource}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        chg.revalidationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {chg.revalidationStatus === 'PENDING' ? `${chg.impactedCreativesCount} Stale Ads` : 'Resolved'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── POLICY SIMULATOR MODAL ── */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Policy Change Simulator
                </h3>
              </div>
              <button
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Test how the Compliance Intelligence Engine proactively flags previously audited advertisements when rule thresholds or catalogue prices are modified.
            </p>

            <form onSubmit={handleSimulatePolicySubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Policy Amendment Title</label>
                <input
                  type="text"
                  value={simTitle}
                  onChange={(e) => setSimTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Entity / Rule Code</label>
                <input
                  type="text"
                  value={simEntity}
                  onChange={(e) => setSimEntity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Previous Rule Condition</label>
                  <input
                    type="text"
                    value={simPrev}
                    onChange={(e) => setSimPrev(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">New Mandate / Price</label>
                  <input
                    type="text"
                    value={simNew}
                    onChange={(e) => setSimNew(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Regulatory Authority / Document</label>
                <input
                  type="text"
                  value={simSource}
                  onChange={(e) => setSimSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSimModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Apply & Trigger Stale Detection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

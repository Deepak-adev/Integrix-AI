import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  Database,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { AuditResult, Finding, FindingStatus, FindingSeverity } from '../types';

interface AuditResultViewProps {
  result: AuditResult;
  onNewAudit?: () => void;
}

export const AuditResultView: React.FC<AuditResultViewProps> = ({ result, onNewAudit }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [expandedFindings, setExpandedFindings] = useState<Record<string, boolean>>({});

  const {
    overallStatus,
    summary,
    metadata,
    submissionId,
    filename,
    findings = [],
    executedRules = [],
    policyRulesExecuted,
    persisted,
    idempotentReplay,
    analysisEngine,
  } = result;

  const toggleExpand = (id: string) => {
    setExpandedFindings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    findings.forEach((f) => {
      all[f.id] = true;
    });
    setExpandedFindings(all);
  };

  const collapseAll = () => {
    setExpandedFindings({});
  };

  // Status configuration
  let statusBadge = {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    chip: 'bg-emerald-600 text-white',
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />,
    title: 'AUDIT PASSED',
    description:
      'Advertising creative content strictly adheres to active catalogue facts and brand policies.',
  };

  if (overallStatus === 'FAIL') {
    statusBadge = {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      chip: 'bg-rose-600 text-white',
      icon: <XCircle className="w-6 h-6 text-rose-600 shrink-0" />,
      title: 'AUDIT FAILED (POLICY VIOLATION)',
      description:
        'Material discrepancies or policy violations detected. Content cannot be published without correction.',
    };
  } else if (overallStatus === 'NEEDS_VERIFICATION') {
    statusBadge = {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      chip: 'bg-amber-600 text-white',
      icon: <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />,
      title: 'NEEDS VERIFICATION / HUMAN REVIEW',
      description:
        'One or more performance or service claims require additional substantiation before public publication.',
    };
  }

  // Filter findings
  const filteredFindings = findings.filter((f) => {
    if (filterSeverity === 'ALL') return true;
    return f.severity === filterSeverity;
  });

  const getSeverityBadge = (sev: FindingSeverity) => {
    switch (sev) {
      case 'RED':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
            High Severity (RED)
          </span>
        );
      case 'AMBER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
            Medium Severity (AMBER)
          </span>
        );
      case 'GREEN':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
            Substantiated (GREEN)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500 text-white">
            {sev}
          </span>
        );
    }
  };

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASS</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAIL</span>
          </span>
        );
      case 'NEEDS_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>NEEDS VERIFICATION</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Result Header Banner ── */}
      <div className={`rounded-xl border p-5 ${statusBadge.bg} shadow-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {statusBadge.icon}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${statusBadge.chip}`}>
                  {overallStatus}
                </span>
                <span className="text-base font-bold tracking-tight text-slate-900">
                  {statusBadge.title}
                </span>
                {persisted && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    <Database className="w-3 h-3" />
                    <span>Persisted</span>
                  </span>
                )}
                {idempotentReplay && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                    Idempotent Replay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
                {statusBadge.description}
              </p>
            </div>
          </div>

          {onNewAudit && (
            <button
              onClick={onNewAudit}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors shrink-0 self-start sm:self-center"
            >
              Start New Audit
            </button>
          )}
        </div>
      </div>

      {/* ── Summary Statistics Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-slate-500">Total Findings</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary?.total ?? findings.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary?.pass ?? 0}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-rose-700 flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Violations</span>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary?.fail ?? 0}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm text-center">
          <div className="text-xs font-semibold text-amber-700 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Need Review</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary?.needsVerification ?? 0}</div>
        </div>
      </div>

      {/* ── Metadata & Engine Banner ── */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-slate-400">Submission ID:</span>{' '}
            <strong className="font-mono text-slate-800">{submissionId}</strong>
          </div>
          {filename && (
            <div>
              <span className="text-slate-400">File:</span>{' '}
              <strong className="font-mono text-slate-800">{filename}</strong>
            </div>
          )}
          {metadata?.sku && (
            <div>
              <span className="text-slate-400">Target SKU:</span>{' '}
              <strong className="font-mono text-slate-800">{metadata.sku}</strong>
            </div>
          )}
          {metadata?.publicationChannel && (
            <div>
              <span className="text-slate-400">Channel:</span>{' '}
              <span className="text-slate-800 font-medium">{metadata.publicationChannel}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          {analysisEngine && (
            <span className="font-mono text-[11px] text-slate-500">Engine: {analysisEngine}</span>
          )}
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {metadata?.auditTimestamp ? new Date(metadata.auditTimestamp).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Notice when only Base Verification ran (no active draft policy rules) ── */}
      {(!policyRulesExecuted && (!executedRules || executedRules.length === 0)) && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-900 leading-relaxed">
            <strong className="font-semibold block mb-0.5">Policy Execution Notice:</strong>
            Base verification completed. No active organisation policy rules were executed. (All configured rulebook rules are currently in DRAFT status and fail-closed isolation is active).
          </div>
        </div>
      )}

      {/* ── Executed Rules Header if any ran ── */}
      {executedRules && executedRules.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Executed Policy Rules ({executedRules.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {executedRules.map((ruleId) => (
              <span
                key={ruleId}
                className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs font-medium border border-slate-200"
              >
                {ruleId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Findings Section ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Compliance Findings ({findings.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific claims, pricing checks, and composition verifications.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-500 mr-1">Filter:</span>
              {(['ALL', 'RED', 'AMBER', 'GREEN'] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    filterSeverity === sev
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-slate-300 mx-1" />

            <button
              onClick={expandAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Expand All
            </button>
            <span className="text-slate-300">|</span>
            <button
              onClick={collapseAll}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Collapse
            </button>
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No findings matching the selected filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFindings.map((finding) => {
              const isExpanded = !!expandedFindings[finding.id];
              return (
                <div key={finding.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div
                    onClick={() => toggleExpand(finding.id)}
                    className="flex flex-wrap items-start justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-[280px]">
                      <div className="mt-0.5">{getStatusBadge(finding.status)}</div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-slate-700">
                            {finding.ruleId || 'BASE-VERIFY'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-sm font-semibold text-slate-900">
                            {finding.policyName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">
                          {finding.explanation}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {getSeverityBadge(finding.severity)}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs text-slate-700 bg-slate-50/80 -mx-5 -mb-5 p-5 rounded-b-xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Observed in Ad:
                          </span>
                          <p className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                            {finding.observedValue || '(none)'}
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Expected per Policy / Catalogue:
                          </span>
                          <p className="font-mono text-xs text-slate-800 bg-slate-50 p-2 rounded border border-slate-100">
                            {finding.expectedValue || '(none)'}
                          </p>
                        </div>
                      </div>

                      {finding.evidenceExcerpt && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                            Evidence Excerpt:
                          </span>
                          <blockquote className="italic text-xs text-slate-700 bg-amber-50/50 border-l-2 border-amber-400 p-2 rounded-r">
                            "{finding.evidenceExcerpt}"
                          </blockquote>
                        </div>
                      )}

                      {finding.suggestedCorrection && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-1.5 text-indigo-700 font-semibold mb-1">
                            <Lightbulb className="w-4 h-4" />
                            <span>Recommended Correction:</span>
                          </div>
                          <p className="text-xs text-slate-800">
                            {finding.suggestedCorrection}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                        <div>
                          <span>Source Document: </span>
                          <strong className="text-slate-700 font-medium">{finding.sourceFilename}</strong>
                          {finding.sourceLocator && (
                            <span className="text-slate-400 ml-1">({finding.sourceLocator})</span>
                          )}
                        </div>
                        {finding.confidence !== undefined && (
                          <div>Confidence: {(finding.confidence * 100).toFixed(0)}%</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  Lightbulb,
  ArrowRight,
  Shield,
  ExternalLink,
} from 'lucide-react';
import { Finding, FindingStatus, FindingSeverity } from '../types';

interface FindingsListProps {
  findings: Finding[];
}

export const FindingsList: React.FC<FindingsListProps> = ({ findings }) => {
  if (findings.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center text-slate-500">
        No policy findings generated for this submission.
      </div>
    );
  }

  const getStatusBadge = (status: FindingStatus) => {
    switch (status) {
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PASS</span>
          </span>
        );
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>FAIL</span>
          </span>
        );
      case 'NEEDS_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>NEEDS VERIFICATION</span>
          </span>
        );
      case 'NOT_FOUND':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>NOT FOUND</span>
          </span>
        );
      case 'CONFLICTING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>CONFLICTING</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

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
            Compliant (GREEN)
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-brand-navy">Detailed Policy & Fact Findings ({findings.length})</h3>
        <span className="text-xs text-slate-500">Every finding includes source-backed repository provenance</span>
      </div>

      <div className="space-y-4">
        {findings.map((f, idx) => {
          const isFail = f.status === 'FAIL';
          const isReview = f.status === 'NEEDS_VERIFICATION' || f.status === 'NOT_FOUND';

          const cardBorder = isFail
            ? 'border-rose-200 bg-white hover:border-rose-300'
            : isReview
            ? 'border-amber-200 bg-white hover:border-amber-300'
            : 'border-emerald-200 bg-white hover:border-emerald-300';

          return (
            <div
              key={f.id || idx}
              className={`rounded-2xl border p-5 shadow-sm transition-all ${cardBorder}`}
            >
              {/* Finding Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  {getStatusBadge(f.status)}
                  {getSeverityBadge(f.severity)}
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    {f.ruleId}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-600 font-sans">
                  {f.policyName}
                </div>
              </div>

              {/* Observed vs Expected Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Observed in Advertisement
                  </div>
                  <div className="font-semibold text-xs text-slate-900 break-words">
                    {f.observedValue}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Expected Approved Value (Repository)
                  </div>
                  <div className="font-semibold text-xs text-slate-900 break-words">
                    {f.expectedValue}
                  </div>
                </div>
              </div>

              {/* Explanation */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-slate-700 mb-1">Explanation & Reasoning:</div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {f.explanation}
                </p>
              </div>

              {/* Evidence Excerpt & Source Reference */}
              <div className="mb-4 p-3.5 rounded-xl bg-sky-50/50 border border-sky-100 text-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="font-bold text-sky-950 flex items-center gap-1.5">
                    {f.sourceFilename.endsWith('.xlsx') ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-sky-600" />
                    )}
                    <span>Source Evidence Provenance</span>
                  </div>
                  <span className="font-mono text-[11px] text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    {f.sourceLocator}
                  </span>
                </div>

                <div className="text-slate-500 text-[11px] mb-1 font-mono">
                  File: <strong className="text-slate-800">{f.sourceFilename}</strong>
                </div>

                <blockquote className="mt-2 pl-3 border-l-2 border-sky-400 text-sky-900 italic font-mono text-[11px] bg-white/70 p-2 rounded-r">
                  "{f.evidenceExcerpt}"
                </blockquote>
              </div>

              {/* Suggested Correction */}
              <div className="pt-3 border-t border-slate-100 flex items-start gap-2.5">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-800">Suggested Action / Correction:</div>
                  <div className="text-slate-600 mt-0.5 leading-relaxed font-medium">
                    {f.suggestedCorrection}
                  </div>
                </div>
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 self-center">
                  <span>Confidence:</span>
                  <span className="font-mono text-slate-700">{(f.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


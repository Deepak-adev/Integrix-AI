import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, ShieldAlert, Clock, Layers } from 'lucide-react';
import { AuditResult } from '../types';

interface AuditSummaryCardProps {
  result: AuditResult;
}

export const AuditSummaryCard: React.FC<AuditSummaryCardProps> = ({ result }) => {
  const { overallStatus, summary, metadata, submissionId, filename } = result;

  let statusConfig = {
    bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    badgeColor: 'bg-emerald-600 text-white',
    icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />,
    title: 'AUDIT PASSED',
    description: 'All advertising content complies with NOVAWEAR brand guidelines, active catalogue facts, and approved campaign policies.',
  };

  if (overallStatus === 'FAIL') {
    statusConfig = {
      bgColor: 'bg-rose-50 border-rose-200 text-rose-900',
      badgeColor: 'bg-rose-600 text-white',
      icon: <XCircle className="w-7 h-7 text-rose-600 flex-shrink-0" />,
      title: 'AUDIT FAILED (POLICY VIOLATION)',
      description: 'Material discrepancies or policy violations detected. Content cannot be published without correcting the identified findings.',
    };
  } else if (overallStatus === 'NEEDS_VERIFICATION') {
    statusConfig = {
      bgColor: 'bg-amber-50 border-amber-200 text-amber-900',
      badgeColor: 'bg-amber-600 text-white',
      icon: <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />,
      title: 'NEEDS VERIFICATION / HUMAN REVIEW',
      description: 'One or more claims lack product-specific substantiation in the repository. Routed to compliance reviewer before publication.',
    };
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6">
      {/* Banner */}
      <div className={`rounded-xl border p-5 mb-6 flex items-start gap-4 ${statusConfig.bgColor}`}>
        {statusConfig.icon}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide ${statusConfig.badgeColor}`}>
              {overallStatus}
            </span>
            <span className="text-sm font-bold tracking-tight">{statusConfig.title}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{statusConfig.description}</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
          <div className="text-xs font-semibold text-slate-500">Total Findings</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">{summary.total}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
          <div className="text-xs font-semibold text-emerald-700 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Passed</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{summary.pass}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-center">
          <div className="text-xs font-semibold text-rose-700 flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Violations</span>
          </div>
          <div className="text-2xl font-bold text-rose-700 mt-1">{summary.fail}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
          <div className="text-xs font-semibold text-amber-700 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Need Review</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{summary.needsVerification}</div>
        </div>
      </div>

      {/* Audit Provenance Metadata */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-y-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className="text-slate-400">File:</span>{' '}
            <strong className="text-slate-700 font-mono">{filename}</strong>
          </div>
          <div>
            <span className="text-slate-400">Submission ID:</span>{' '}
            <strong className="text-slate-700 font-mono">{submissionId}</strong>
          </div>
          <div>
            <span className="text-slate-400">Channel:</span>{' '}
            <strong className="text-slate-700">{metadata.publicationChannel || 'General'}</strong>
          </div>
          <div>
            <span className="text-slate-400">Target Date:</span>{' '}
            <strong className="text-slate-700 font-mono">{metadata.publicationDate || '2026-11-13'}</strong>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>{new Date(metadata.auditTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
};


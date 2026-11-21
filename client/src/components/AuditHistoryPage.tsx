import React from 'react';
import { History, Clock, FileText, Database, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { Page } from '../App';

interface AuditHistoryPageProps {
  onNavigate: (section: Page) => void;
}

export const AuditHistoryPage: React.FC<AuditHistoryPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit History</h2>
        <p className="text-xs text-slate-500 mt-1">
          Historical log of advertisement submissions, compliance findings, and immutable snapshots.
        </p>
      </div>

      {/* ── Guidance / Architectural State Banner ── */}
      <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-5 flex items-start gap-4">
        <Database className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-950 space-y-1">
          <strong className="font-bold text-indigo-900 block">
            Persistence Storage Connected
          </strong>
          <p>
            All text audits and uploaded creatives submitted in database mode are persisted directly in PostgreSQL with immutable SHA-256 snapshots and organisation-scoped file storage.
          </p>
          <p className="text-slate-500 text-[11px] pt-1">
            Note: Dedicated multi-tenant listing and pagination API endpoints are scheduled for Phase 3B. No simulated historical numbers are fabricated here.
          </p>
        </div>
      </div>

      {/* ── Organisation Compliance Intelligence Proactive Gateway ── */}
      <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-indigo-50 to-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900">Organisation Compliance Intelligence</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white">PROACTIVE</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Move beyond reactive single-ad logs: view aggregate risk scoring, recurring violation signatures, campaign-wise clearance rates, and stale-audit revalidation.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('compliance-intelligence')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-900 text-white text-xs font-black shrink-0 transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-slate-900/10"
        >
          <span>Open Intelligence Module</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Empty State / Call to Action ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 mx-auto flex items-center justify-center mb-4">
          <History className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          Ready for Auditing
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          Submit advertisement creatives or marketing text to execute deterministic verification and view real-time findings.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => onNavigate('creative-audit')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            Audit a Creative
          </button>
          <button
            onClick={() => onNavigate('text-audit')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Verify Text Copy
          </button>
        </div>
      </div>
    </div>
  );
};

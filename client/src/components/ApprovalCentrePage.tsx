import React from 'react';
import { CheckSquare, Shield, Clock, AlertCircle } from 'lucide-react';

export const ApprovalCentrePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Approval Centre</h2>
        <p className="text-xs text-slate-500 mt-1">
          Review, approve, or reject marketing advertisements flagged with policy warnings or unverified claims.
        </p>
      </div>

      {/* ── Status Banner ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs text-slate-700">
            <strong className="font-semibold text-slate-900 block">
              Governance & Review Queue:
            </strong>
            <p>
              Submissions flagged as <span className="font-bold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">NEEDS VERIFICATION</span> require authorized commercial signoff (e.g. Merchandising Lead review of unapproved performance claims) before authorization.
            </p>
          </div>
        </div>
      </div>

      {/* ── Queue Overview ── */}
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <CheckSquare className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">Review Queue Empty</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          There are no pending human-in-the-loop review tickets assigned to your compliance group.
        </p>
      </div>
    </div>
  );
};

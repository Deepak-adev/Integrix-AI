import React from 'react';
import { Settings, Shield, Database, Lock, Server, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Settings</h2>
        <p className="text-xs text-slate-500 mt-1">
          Configuration parameters, data-source mode, and organisation settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Organisation Context */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Organisation Scope</span>
          </div>

          <div className="space-y-3 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Organisation Name:</span>
              <strong className="text-slate-900 font-semibold">NOVAWEAR Retail Private Limited</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Tenant Slug:</span>
              <span className="font-mono text-slate-800">novawear</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Isolation Level:</span>
              <span className="font-semibold text-emerald-700">Strict Tenant Scoping Active</span>
            </div>
          </div>
        </div>

        {/* Engine Configuration */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Audit Engine Configuration</span>
          </div>

          <div className="space-y-3 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Active Mode:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <strong className="text-slate-900 font-semibold">Database Persistence (PostgreSQL)</strong>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rulebook Version:</span>
              <span className="font-mono text-slate-800">NW-RB-0.1 (DRAFT, Fail-Closed)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">AI Fallback:</span>
              <span className="font-semibold text-slate-800">Deterministic Fallback Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

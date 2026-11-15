import React from 'react';
import {
  Settings,
  Shield,
  Database,
  Lock,
  Server,
  CheckCircle2,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  Globe,
  Coins,
  Sparkles,
} from 'lucide-react';
import { Organisation } from '../types';

interface SettingsPageProps {
  organisations: Organisation[];
  activeOrg: Organisation;
  onSwitchOrg: (orgId: string) => void;
  onOpenAddOrg: () => void;
  onOpenEditOrg: (org: Organisation) => void;
  onDeleteOrg: (orgId: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  organisations,
  activeOrg,
  onSwitchOrg,
  onOpenAddOrg,
  onOpenEditOrg,
  onDeleteOrg,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Governance Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure multi-tenant organizations, brand profile constraints, and audit engine parameters
          </p>
        </div>

        <button
          onClick={onOpenAddOrg}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Organisation</span>
        </button>
      </div>

      {/* ── Section 1: Organisation Management ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Multi-Tenant Organisations ({organisations.length})</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Select an active brand entity or create and customize legal scopes for distinct portfolios
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {organisations.map((org) => {
            const isActive = org.id === activeOrg.id;
            return (
              <div
                key={org.id}
                className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                  isActive
                    ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-extrabold text-xs shadow-xs"
                        style={{ backgroundColor: org.color || '#4F46E5' }}
                      >
                        {org.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900 leading-tight">{org.name}</h3>
                        <span className="mono text-[10px] text-slate-400 font-semibold">{org.slug}</span>
                      </div>
                    </div>

                    {isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => onSwitchOrg(org.id)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/70 hover:bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200/80 cursor-pointer"
                      >
                        Switch
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Legal Entity:</span>
                      <span className="font-semibold text-slate-800">{org.legalName}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Industry & Sector:</span>
                      <span className="text-slate-700">{org.industry}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] font-medium">Brand Tone:</span>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{org.brandTone}</p>
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3 text-slate-400" />
                        {org.currency}
                      </span>
                      <span className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {org.region}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenEditOrg(org)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                      <span>Edit</span>
                    </button>
                    {!org.isDefault && (
                      <button
                        onClick={() => onDeleteOrg(org.id)}
                        className="p-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 text-[11px] cursor-pointer transition-colors"
                        title="Delete organisation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => onSwitchOrg(org.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Set Active →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Engine Configuration & Isolation ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Active Context Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Active Tenant Isolation</span>
          </div>

          <div className="space-y-3 text-slate-600">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Scope
                </span>
                <span className="font-extrabold text-slate-900 text-sm">{activeOrg.name}</span>
              </div>
              <span className="mono text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-bold">
                {activeOrg.slug}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[11px]">Enforcement Tolerance:</span>
              <span className="font-semibold text-slate-800">{activeOrg.complianceTolerance} (Zero-Tolerance Gate)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Storage Isolation:</span>
              <span className="font-semibold text-emerald-700">Multi-tenant SHA-256 Scoped Directories</span>
            </div>
          </div>
        </div>

        {/* Engine Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Audit Engine Configuration</span>
          </div>

          <div className="space-y-3 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[11px]">Active Mode:</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <strong className="text-slate-900 font-semibold">Live OCR & AI Hybrid Verification</strong>
              </div>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Rulebook Version:</span>
              <span className="font-mono text-slate-800">NW-RB-0.1 (Executable Deterministic Rulebook)</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Fallback Strategy:</span>
              <span className="font-semibold text-slate-800">Local Deterministic Reasoning Always Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

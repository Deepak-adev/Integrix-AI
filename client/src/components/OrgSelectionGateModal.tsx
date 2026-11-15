import React from 'react';
import {
  Shield,
  Building2,
  CheckCircle2,
  ArrowRight,
  X,
  Sparkles,
  ShoppingBag,
  Leaf,
  Layers,
  FileCheck2,
  FlaskConical,
} from 'lucide-react';
import { Organisation } from '../types';

interface OrgSelectionGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrg: (orgId: string, targetPage?: string) => void;
  organisations: Organisation[];
  activeOrgId: string;
  targetPage?: string | null;
}

export const OrgSelectionGateModal: React.FC<OrgSelectionGateModalProps> = ({
  isOpen,
  onClose,
  onSelectOrg,
  organisations,
  activeOrgId,
  targetPage = 'audit',
}) => {
  if (!isOpen) return null;

  const daburOrg = organisations.find((o) => o.slug === 'dabur' || o.id === 'org-dabur');
  const novawearOrg = organisations.find((o) => o.slug === 'novawear' || o.id === 'org-novawear');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-3">
            <Shield className="w-3.5 h-3.5 text-indigo-600" />
            <span>{targetPage === 'demo-gallery' ? 'Creative Visuals & Demo Selection' : 'Multi-Tenant Enterprise Gateway'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {targetPage === 'demo-gallery' ? 'Select Organisation Creative Collection' : 'Select Compliance Organisation'}
          </h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
            {targetPage === 'demo-gallery'
              ? 'Choose an enterprise brand to view, inspect, and test its verified creative advertising collection and compliance audit suite.'
              : 'Please choose the enterprise brand workspace you want to enter. Each organisation maintains completely isolated product catalogues, deterministic rule engines, active campaigns, and verified test suites.'}
          </p>
        </div>

        {/* 2 Organisation Cards */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50">
          {/* ── CARD 1: NOVAWEAR RETAIL (FIRST) ── */}
          <div
            onClick={() => onSelectOrg('org-novawear', targetPage || 'audit')}
            className={`group rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white ${
              activeOrgId === 'org-novawear'
                ? 'border-indigo-500 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5'
            }`}
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 to-violet-600" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-50 via-white to-violet-50 border border-indigo-200/90 p-2 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <img
                    src="/logos/novawear-logo.svg"
                    alt="NOVAWEAR Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Apparel & Lifestyle Fashion
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-700 transition-colors">
                    NOVAWEAR
                  </h3>
                  {activeOrgId === 'org-novawear' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">NOVAWEAR Retail Private Limited</div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Specialized audit workspace for apparel e-commerce and retail marketing. Enforces fabric composition
                  honesty, discount approval gates, and SLA disclaimers.
                </p>
              </div>

              {/* Badges / Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Approved SKUs</div>
                  <div className="text-sm font-black text-slate-900 mono">8 Products</div>
                  <div className="text-[10px] text-slate-500">Cotton Shirts, Chinos, Polos</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rule Engines</div>
                  <div className="text-sm font-black text-slate-900 mono">4 Rules</div>
                  <div className="text-[10px] text-slate-500">Fabric, Pricing, SLA, Tone</div>
                </div>
              </div>

              {/* Sample Rules Tested */}
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Fabric blend verification (100% vs 60/40 blend)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Promotional campaign gates (₹999 vs ₹1,299)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>Next-day delivery SLA disclaimer audit</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md shadow-indigo-600/20 group-hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{targetPage === 'demo-gallery' ? 'View NOVAWEAR Creative Collection' : 'Enter NOVAWEAR Workspace'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* ── CARD 2: DABUR INDIA LIMITED (REAL COMPANY • REAL-TIME BENCHMARK) ── */}
          <div
            onClick={() => onSelectOrg('org-dabur', targetPage || 'audit')}
            className={`group rounded-2xl border-2 p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden bg-white ${
              activeOrgId === 'org-dabur'
                ? 'border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                : 'border-slate-200 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-0.5'
            }`}
          >
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-600" />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 p-1 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform shrink-0 overflow-hidden">
                  <img
                    src="/logos/dabur-logo.png"
                    alt="Dabur Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    Real Company • Live FMCG Data
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Dabur
                  </h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Real Enterprise
                  </span>
                  {activeOrgId === 'org-dabur' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  Dabur India Limited (Real FMCG Enterprise, Est. 1884)
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Real company dataset with live FMCG brand governance. Real-time audit of authentic advertisements,
                  clinical claims, ASCI regulatory compliance, and Central Insecticide Board norms.
                </p>
              </div>

              {/* Badges / Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Approved SKUs</div>
                  <div className="text-sm font-black text-slate-900 mono">6 Products</div>
                  <div className="text-[10px] text-slate-500">Amla, Gulabari, Odomos...</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Rule Engines</div>
                  <div className="text-sm font-black text-slate-900 mono">5 Rules</div>
                  <div className="text-[10px] text-slate-500">Real-Time ASCI & CIB Norms</div>
                </div>
              </div>

              {/* Sample Rules Tested */}
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time clinical multiplier check (10X vs 50X breach)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real company hydration ceiling validation (72hr limit)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Govt & CIB certified mosquito repellent claims (80% vs 100%)</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="button"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 group-hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{targetPage === 'demo-gallery' ? 'View Dabur Real Creative Collection' : 'Enter Dabur Workspace'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer info note */}
        <div className="p-4 sm:px-8 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>You can switch between NOVAWEAR and Dabur anytime using the header selector.</span>
          </div>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

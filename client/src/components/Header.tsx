import React from 'react';
import { ShieldCheck, Database, Award, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onOpenRepo: () => void;
  onRunAllTests: () => void;
  isRunningAll: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRepo, onRunAllTests, isRunningAll }) => {
  return (
    <header className="bg-brand-navy text-white shadow-md border-b border-slate-700/50 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-2.5 bg-brand-slate/40 rounded-xl border border-white/10 shadow-inner flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">INTEGRIX AI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                Phase 1 MVP
              </span>
            </div>
            <p className="text-xs text-slate-300 tracking-normal font-medium">
              Intelligent Brand Governance & Content Integrity Platform
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300">
            <Award className="w-4 h-4 text-amber-400" />
            <span>CodeNova India 2026 Round 2</span>
          </div>

          <button
            onClick={onOpenRepo}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-slate-100 border border-white/15 transition-all shadow-sm hover:shadow"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>Master Repository</span>
          </button>

          <button
            onClick={onRunAllTests}
            disabled={isRunningAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRunningAll ? 'Running 7 Tests...' : 'Verify All 7 Ads'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};


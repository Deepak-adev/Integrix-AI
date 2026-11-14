import React from 'react';
import { Play, CheckCircle2, XCircle, AlertCircle, FileSearch } from 'lucide-react';
import { AcceptanceScenario } from '../types';

interface AcceptanceScenariosBarProps {
  scenarios: AcceptanceScenario[];
  selectedScenarioId?: string;
  onSelectScenario: (scenario: AcceptanceScenario) => void;
  resultsMap: Record<string, { matchesExpected: boolean; actualStatus: string }>;
  loadingId?: string;
}

export const AcceptanceScenariosBar: React.FC<AcceptanceScenariosBarProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  resultsMap,
  loadingId,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 gap-2">
        <div>
          <h2 className="text-sm font-bold text-brand-navy flex items-center gap-2">
            <FileSearch className="w-4 h-4 text-sky-600" />
            <span>7 Official NOVAWEAR Test Pack Creatives</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pre-loaded acceptance scenarios from CodeNova India 2026. Click any scenario to run content extraction and policy audit.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
          Reference Date: 13 Nov 2026
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {scenarios.map((sc, idx) => {
          const isSelected = selectedScenarioId === sc.id;
          const result = resultsMap[sc.id];
          const isLoading = loadingId === sc.id;

          let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
          if (sc.expectedOutcome === 'PASS') badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          else if (sc.expectedOutcome === 'FAIL') badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
          else if (sc.expectedOutcome === 'NEEDS_VERIFICATION') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc)}
              disabled={isLoading}
              className={`text-left p-3 rounded-xl border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/40 ring-2 ring-sky-500/20 shadow-sm'
                  : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50/70 bg-white'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-brand-navy bg-slate-100 px-1.5 py-0.5 rounded">
                    #{idx + 1} {sc.testPackId}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${badgeColor}`}>
                    {sc.expectedOutcome}
                  </span>
                </div>

                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {sc.title.split('(')[0]}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {sc.sku ? `SKU: ${sc.sku}` : 'General Service'} | {sc.primaryRule}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-sans">{sc.channel.split(' ')[0]}</span>

                {isLoading ? (
                  <span className="text-sky-600 font-semibold animate-pulse text-[11px]">Auditing...</span>
                ) : result ? (
                  <span
                    className={`inline-flex items-center gap-1 font-semibold text-[11px] ${
                      result.matchesExpected ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {result.matchesExpected ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    {result.actualStatus}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium">
                    <Play className="w-3 h-3 fill-sky-600" />
                    <span>Audit</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


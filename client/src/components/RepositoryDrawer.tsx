import React, { useState } from 'react';
import { X, Database, Tag, Megaphone, ShieldCheck, FileText, ChevronRight } from 'lucide-react';
import { RepositoryStats } from '../types';

interface RepositoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stats: RepositoryStats | null;
}

export const RepositoryDrawer: React.FC<RepositoryDrawerProps> = ({ isOpen, onClose, stats }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'campaigns' | 'rules' | 'docs'>('products');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-brand-navy text-white">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-bold">NOVAWEAR Master Brand Repository</h3>
              <p className="text-xs text-slate-300">Authoritative reference dataset for CodeNova India 2026</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'products'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Products ({stats?.products.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'campaigns'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Campaigns ({stats?.campaigns.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rulebook ({stats?.rules.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`py-2.5 px-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'border-brand-navy text-brand-navy'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Policy PDFs ({stats?.indexedPolicies.length || 0})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'products' && (
            <div className="space-y-3">
              {stats?.products.map((p: any) => (
                <div key={p.sku} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs">
                  <div className="flex items-center justify-between font-mono mb-1">
                    <span className="font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded">{p.sku}</span>
                    <span className="font-bold text-emerald-700">Selling Price: ₹{p.sellingPriceInr}</span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">{p.productName}</div>
                  <div className="text-slate-600 mt-1">
                    <strong>Composition:</strong> {p.composition} | <strong>Fit:</strong> {p.fit}
                  </div>
                  <div className="text-slate-500 mt-1">
                    <strong>Care:</strong> {p.careInstructions}
                  </div>
                  {p.claimsNotApproved && p.claimsNotApproved.length > 0 && (
                    <div className="text-rose-700 mt-1.5 text-[11px] bg-rose-50 p-1.5 rounded border border-rose-100">
                      <strong>Claims Not Approved:</strong> {p.claimsNotApproved.join('; ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-3">
              {stats?.campaigns.map((c: any) => (
                <div key={c.campaignId} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between font-mono mb-1">
                    <span className="font-bold text-brand-navy bg-slate-200 px-2 py-0.5 rounded">{c.campaignId}</span>
                    <span className={`font-bold px-2 py-0.5 rounded ${
                      c.approvalStatus.toLowerCase() === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {c.approvalStatus}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">{c.campaignName}</div>
                  <div className="text-slate-600 mt-1">
                    Target SKU: <strong className="font-mono">{c.sku}</strong> | Campaign Price: <strong className="text-emerald-700">₹{c.campaignPriceInr}</strong>
                  </div>
                  <div className="text-slate-500 mt-1">
                    Dates: {c.startDate} to {c.endDate} | Channels: {c.eligibleChannels.join(', ')}
                  </div>
                  <div className="text-slate-600 mt-1.5 p-2 rounded bg-white border border-slate-200 font-mono text-[11px]">
                    Conditions: "{c.conditions}"
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              {stats?.rules.map((r: any) => (
                <div key={r.ruleId} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-sky-900 bg-sky-100 px-2 py-0.5 rounded">{r.ruleId}</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      r.severity === 'RED' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {r.severity}
                    </span>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">{r.ruleName}</div>
                  <p className="text-slate-600 mt-1.5 leading-relaxed bg-white p-2.5 rounded border border-slate-200">
                    {r.policyStatement}
                  </p>
                  <div className="text-slate-500 text-[11px] mt-2">
                    Source: <strong className="font-mono text-slate-700">{r.authoritySourceId}</strong> ({r.sourceLocator})
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-3">
              {stats?.indexedPolicies.map((d: any) => (
                <div key={d.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-sky-600" />
                    <div>
                      <div className="font-bold text-slate-800">{d.name}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{d.id}</div>
                    </div>
                  </div>
                  <span className="font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px]">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


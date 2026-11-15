import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Package,
  Megaphone,
  FileText,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
} from 'lucide-react';
import { getRepositoryStats } from '../services/api';
import { RepositoryStats } from '../types';

export const PolicyRepositoryPage: React.FC = () => {
  const [stats, setStats] = useState<RepositoryStats | null>(null);
  const [activeTab, setActiveTab] = useState<'products' | 'campaigns' | 'rules' | 'policies'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getRepositoryStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('[PolicyRepository] Failed to fetch stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const products = stats?.products || [];
  const campaigns = stats?.campaigns || [];
  const rules = stats?.rules || [];
  const policies = stats?.indexedPolicies || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Policy Repository</h2>
        <p className="text-xs text-slate-500 mt-1">
          Explore approved NOVAWEAR products, commercial campaigns, policy guidelines, and brand rulebook rules.
        </p>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'campaigns'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Rulebook ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 flex items-center gap-1.5 transition-colors border-b-2 ${
            activeTab === 'policies'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Sources ({policies.length})</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Product Name</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Approved Composition</th>
                <th className="p-3.5">Base Price</th>
                <th className="p-3.5">Unapproved Claims</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-normal">
              {products.map((p: any) => (
                <tr key={p.sku} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-indigo-600">{p.sku}</td>
                  <td className="p-3.5 font-semibold text-slate-900">{p.productName || p.name}</td>
                  <td className="p-3.5">{p.category}</td>
                  <td className="p-3.5 font-medium">{p.composition || p.fabric}</td>
                  <td className="p-3.5 font-bold">{p.sellingPriceInr ? `₹${p.sellingPriceInr}` : p.basePrice}</td>
                  <td className="p-3.5 text-rose-600 text-[11px]">
                    {Array.isArray(p.claimsNotApproved)
                      ? p.claimsNotApproved.join(', ')
                      : Array.isArray(p.unapprovedClaims)
                      ? p.unapprovedClaims.join(', ')
                      : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="p-3.5">Campaign ID</th>
                <th className="p-3.5">Target SKU</th>
                <th className="p-3.5">Campaign Price</th>
                <th className="p-3.5">Validity Dates</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Mandatory Conditions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {campaigns.map((c: any) => {
                const status = c.approvalStatus || 'Approved';
                const isApproved = status.toLowerCase() === 'approved';
                const isPending = status.toLowerCase() === 'pending';
                return (
                  <tr key={c.campaignId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900">{c.campaignId}</td>
                    <td className="p-3.5 font-mono text-indigo-600 font-semibold">{c.sku}</td>
                    <td className="p-3.5 font-bold">₹{c.campaignPriceInr}</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {c.startDate} to {c.endDate}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-800'
                            : isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-600 text-[11px] max-w-xs">{c.conditions || 'None'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((r: any) => (
            <div key={r.id || r.ruleId} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {r.id || r.ruleId}
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  DRAFT
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{r.title || r.name}</h4>
              <p className="text-xs text-slate-600">{r.desc || r.description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {policies.map((p: any) => (
            <div key={p.id} className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 truncate">{p.name}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <span className="font-mono">{p.id}</span>
                <span className="text-emerald-700 font-semibold">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

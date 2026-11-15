import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Megaphone,
  FileText,
  Shield,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  ExternalLink,
  Building2,
  Sparkles,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';
import { getRepositoryStats } from '../services/api';
import {
  getCampaignsForOrg,
  getPoliciesForOrg,
  getStoredProductsForOrg,
  getStoredRulesForOrg,
  getStoredActiveOrgId,
  CampaignItem,
  PolicyDocumentItem,
} from '../services/governanceStorage';
import { Organisation, PolicyRuleItem, ProductItem, RepositoryStats } from '../types';

interface PolicyRepositoryPageProps {
  activeOrg?: Organisation;
  products?: ProductItem[];
  rules?: PolicyRuleItem[];
  onSwitchOrg?: (orgId: string) => void;
}

export const PolicyRepositoryPage: React.FC<PolicyRepositoryPageProps> = ({
  activeOrg,
  products: propProducts,
  rules: propRules,
}) => {
  const currentOrgId = activeOrg?.id || getStoredActiveOrgId();
  const orgName = activeOrg?.name || (currentOrgId === 'org-dabur' ? 'Dabur' : 'NOVAWEAR');
  const legalName = activeOrg?.legalName || (currentOrgId === 'org-dabur' ? 'Dabur India Limited' : 'NOVAWEAR Retail Private Limited');
  const orgColor = activeOrg?.color || (currentOrgId === 'org-dabur' ? '#059669' : '#4F46E5');
  const orgIndustry = activeOrg?.industry || (currentOrgId === 'org-dabur' ? 'Ayurvedic Healthcare, Personal Care & FMCG' : 'Apparel & Lifestyle Fashion');

  const [activeTab, setActiveTab] = useState<'products' | 'campaigns' | 'rules' | 'policies'>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dynamic datasets scoped to the active organisation
  const products: ProductItem[] = useMemo(() => {
    if (propProducts && propProducts.length > 0) return propProducts;
    return getStoredProductsForOrg(currentOrgId);
  }, [propProducts, currentOrgId]);

  const rules: PolicyRuleItem[] = useMemo(() => {
    if (propRules && propRules.length > 0) return propRules;
    return getStoredRulesForOrg(currentOrgId);
  }, [propRules, currentOrgId]);

  const campaigns: CampaignItem[] = useMemo(() => {
    return getCampaignsForOrg(currentOrgId);
  }, [currentOrgId]);

  const policies: PolicyDocumentItem[] = useMemo(() => {
    return getPoliciesForOrg(currentOrgId);
  }, [currentOrgId]);

  // Filtering
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.fabric && p.fabric.toLowerCase().includes(q))
    );
  }, [products, searchTerm]);

  const filteredCampaigns = useMemo(() => {
    if (!searchTerm.trim()) return campaigns;
    const q = searchTerm.toLowerCase();
    return campaigns.filter(
      (c) =>
        c.campaignId.toLowerCase().includes(q) ||
        c.sku.toLowerCase().includes(q) ||
        c.conditions.toLowerCase().includes(q) ||
        c.approvalStatus.toLowerCase().includes(q)
    );
  }, [campaigns, searchTerm]);

  const filteredRules = useMemo(() => {
    if (!searchTerm.trim()) return rules;
    const q = searchTerm.toLowerCase();
    return rules.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.cat.toLowerCase().includes(q)
    );
  }, [rules, searchTerm]);

  const filteredPolicies = useMemo(() => {
    if (!searchTerm.trim()) return policies;
    const q = searchTerm.toLowerCase();
    return policies.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [policies, searchTerm]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header with Active Org Badge ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Policy & Catalogue Repository</h2>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold text-white shadow-xs"
              style={{ backgroundColor: orgColor }}
            >
              <Building2 className="w-3.5 h-3.5" />
              {orgName}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Indexed brand guidelines, commercial campaign offers, and product catalogue records for{' '}
            <strong className="text-slate-700 font-semibold">{legalName}</strong> ({orgIndustry}).
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${orgName} records...`}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'products'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Approved Products ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Active Campaigns ({campaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'rules'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Rulebook Standards ({rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('policies')}
          className={`pb-3 flex items-center gap-2 transition-colors border-b-2 cursor-pointer ${
            activeTab === 'policies'
              ? 'border-indigo-600 text-indigo-600 font-black'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Indexed Sources ({policies.length})</span>
        </button>
      </div>

      {/* ── Tab Content ── */}
      {/* 1. PRODUCTS */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Approved {orgName} Catalogue SKUs ({filteredProducts.length} items)
            </span>
            <span className="text-[11px] text-slate-400">Deterministic ground-truth specifications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Approved Composition / Actives</th>
                  <th className="p-3.5">Base Price</th>
                  <th className="p-3.5">Unapproved / Prohibited Claims</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-normal">
                {filteredProducts.map((p) => (
                  <tr key={p.sku} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-indigo-600">{p.sku}</td>
                    <td className="p-3.5 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
                        {p.category}
                      </span>
                    </td>
                    <td className="p-3.5 font-medium text-slate-700">{p.fabric || 'Certified natural formulation'}</td>
                    <td className="p-3.5 font-bold text-slate-900 mono">{p.basePrice}</td>
                    <td className="p-3.5">
                      {p.unapprovedClaims && p.unapprovedClaims.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.unapprovedClaims.map((claim, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                            >
                              ✕ {claim}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">None recorded</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Commercial Promotional Campaigns ({filteredCampaigns.length} offers)
            </span>
            <span className="text-[11px] text-slate-400">Commercial pricing sign-offs & validity dates</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Campaign ID</th>
                  <th className="p-3.5">Target SKU</th>
                  <th className="p-3.5">Campaign Offer Price</th>
                  <th className="p-3.5">Validity Dates</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Mandatory Conditions & Disclaimers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredCampaigns.map((c) => {
                  const isApproved = c.approvalStatus === 'Approved';
                  const isPending = c.approvalStatus === 'Pending';
                  return (
                    <tr key={c.campaignId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900">{c.campaignId}</td>
                      <td className="p-3.5 font-mono text-indigo-600 font-bold">{c.sku}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 mono">₹{c.campaignPriceInr}</td>
                      <td className="p-3.5 font-mono text-slate-600 text-[11px]">
                        {c.startDate} to {c.endDate}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {c.approvalStatus}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-600 text-[11px] max-w-sm">{c.conditions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. RULEBOOK */}
      {activeTab === 'rules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRules.map((r) => {
            const isCrit = r.severity === 'CRITICAL';
            const isWarn = r.severity === 'WARNING';
            return (
              <div
                key={r.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {r.id}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {r.cat}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border ${
                      isCrit
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : isWarn
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    {r.severity}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{r.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex items-start gap-2 bg-rose-50/60 p-2 rounded-lg text-rose-800 text-[11px]">
                    <span className="font-bold shrink-0">Prohibited:</span>
                    <span>{r.bad}</span>
                  </div>
                  <div className="flex items-start gap-2 bg-emerald-50/60 p-2 rounded-lg text-emerald-800 text-[11px]">
                    <span className="font-bold shrink-0">Required:</span>
                    <span>{r.good}</span>
                  </div>
                </div>

                {r.sourceLocator && (
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pt-1">
                    <Info className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>Citation: {r.sourceLocator}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. SOURCES */}
      {activeTab === 'policies' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredPolicies.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {p.status}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 leading-snug">{p.name}</h4>
                {p.description && <p className="text-[11px] text-slate-500 leading-relaxed">{p.description}</p>}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100 font-mono">
                <span>{p.id}</span>
                <span className="text-[10px] uppercase font-bold text-indigo-600">{p.category || 'Policy PDF'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

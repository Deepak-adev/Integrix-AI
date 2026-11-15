import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Shield,
  Package,
  Plus,
  Check,
  AlertTriangle,
  Info,
  Sparkles,
  Tag,
  FileText,
} from 'lucide-react';
import { Organisation, PolicyRuleItem, ProductItem } from '../types';

/* ─────────────────────────────────────────────────────────────
   ORGANISATION MODAL (ADD / EDIT)
───────────────────────────────────────────────────────────── */
interface OrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (org: Organisation) => void;
  initialData?: Organisation | null;
}

export const OrgModal: React.FC<OrgModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [slug, setSlug] = useState('');
  const [industry, setIndustry] = useState('Apparel & Lifestyle');
  const [brandTone, setBrandTone] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [region, setRegion] = useState('India / South Asia');
  const [color, setColor] = useState('#4F46E5');
  const [complianceTolerance, setComplianceTolerance] = useState<'Strict' | 'Standard' | 'Permissive'>('Strict');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setLegalName(initialData.legalName);
      setSlug(initialData.slug);
      setIndustry(initialData.industry);
      setBrandTone(initialData.brandTone);
      setCurrency(initialData.currency);
      setRegion(initialData.region);
      setColor(initialData.color);
      setComplianceTolerance(initialData.complianceTolerance);
    } else {
      setName('');
      setLegalName('');
      setSlug('');
      setIndustry('Apparel & Lifestyle');
      setBrandTone('Straightforward, authentic, clear, understated luxury');
      setCurrency('INR (₹)');
      setRegion('India / South Asia');
      setColor('#4F46E5');
      setComplianceTolerance('Strict');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const computedSlug = slug.trim()
      ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const updated: Organisation = {
      id: initialData?.id || `org-${Date.now()}`,
      name: name.trim(),
      legalName: legalName.trim() || `${name.trim()} Private Limited`,
      slug: computedSlug,
      industry: industry.trim(),
      brandTone: brandTone.trim(),
      currency: currency.trim(),
      region: region.trim(),
      color,
      complianceTolerance,
      isDefault: initialData?.isDefault || false,
    };

    onSave(updated);
    onClose();
  };

  const PRESET_COLORS = ['#4F46E5', '#059669', '#D97706', '#E11D48', '#7C3AED', '#0284C7'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {initialData ? 'Edit Organisation Profile' : 'Add New Organisation'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Multi-tenant boundary for governance rules, brand catalogs, and audit logs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Brand Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!initialData && !slug) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                  }
                }}
                placeholder="e.g. NOVAWEAR, AURA"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Tenant Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. novawear"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white mono text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Registered Legal Entity Name
            </label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="e.g. NOVAWEAR Retail Private Limited"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Industry Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Apparel & Lifestyle, Cosmetics"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Primary Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="e.g. INR (₹), USD ($)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Brand Voice & Tone Guidelines
            </label>
            <textarea
              rows={2}
              value={brandTone}
              onChange={(e) => setBrandTone(e.target.value)}
              placeholder="e.g. Straightforward, authentic, minimal, zero exaggeration"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
                Brand Accent Color
              </label>
              <div className="flex items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                      color === c ? 'scale-115 border-slate-900 shadow-sm' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Compliance Gate
              </label>
              <select
                value={complianceTolerance}
                onChange={(e: any) => setComplianceTolerance(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Strict">Strict (Zero-Tolerance)</option>
                <option value="Standard">Standard (Enterprise)</option>
                <option value="Permissive">Permissive (Advisory)</option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              {initialData ? 'Update Organisation' : 'Save Organisation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   POLICY RULE MODAL (ADD / EDIT)
───────────────────────────────────────────────────────────── */
interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: PolicyRuleItem) => void;
  initialData?: PolicyRuleItem | null;
}

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('Product');
  const [desc, setDesc] = useState('');
  const [bad, setBad] = useState('');
  const [good, setGood] = useState('');
  const [severity, setSeverity] = useState<'CRITICAL' | 'WARNING' | 'TIP'>('CRITICAL');
  const [isActive, setIsActive] = useState(true);
  const [authoritySourceId, setAuthoritySourceId] = useState('SRC-NW-005');

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setTitle(initialData.title);
      setCat(initialData.cat);
      setDesc(initialData.desc);
      setBad(initialData.bad);
      setGood(initialData.good);
      setSeverity(initialData.severity || 'CRITICAL');
      setIsActive(initialData.isActive !== false);
      setAuthoritySourceId(initialData.authoritySourceId || 'SRC-NW-005');
    } else {
      setId(`NW-RULE-00${Math.floor(Math.random() * 90 + 10)}`);
      setTitle('');
      setCat('Product');
      setDesc('');
      setBad('');
      setGood('');
      setSeverity('CRITICAL');
      setIsActive(true);
      setAuthoritySourceId('SRC-NW-005');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !desc.trim()) return;

    const item: PolicyRuleItem = {
      id: id.trim() || `RULE-${Date.now()}`,
      title: title.trim(),
      cat: cat.trim(),
      desc: desc.trim(),
      bad: bad.trim() || 'Non-compliant advertisement copy',
      good: good.trim() || 'Approved brand guidelines specification',
      severity,
      isActive,
      authoritySourceId: authoritySourceId.trim(),
    };

    onSave(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {initialData ? 'Edit Governance Policy Rule' : 'Create New Policy Rule'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Deterministic rule enforced across advertisement visual copy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Rule ID *
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. NW-RULE-006"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={cat}
                onChange={(e) => setCat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Product">Product Information</option>
                <option value="Commercial">Commercial / Pricing</option>
                <option value="Consumer">Consumer Claims & Substantiation</option>
                <option value="Operations">Operations & Delivery</option>
                <option value="Editorial">Editorial & Tone</option>
                <option value="Legal">Legal & Regulatory</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Rule Title / Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Next-Day Delivery Cutoff Disclosure"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Policy Constraint Statement *
            </label>
            <textarea
              required
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Any mention of delivery timelines must state dispatch estimate and exclude guaranteed arrival promises."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-rose-700 mb-1">
                Non-Compliant Example Copy
              </label>
              <input
                type="text"
                value={bad}
                onChange={(e) => setBad(e.target.value)}
                placeholder='e.g. "Guaranteed delivery tomorrow"'
                className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 mono text-rose-950 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-700 mb-1">
                Approved Standard Copy
              </label>
              <input
                type="text"
                value={good}
                onChange={(e) => setGood(e.target.value)}
                placeholder='e.g. "Estimated delivery 2–4 days"'
                className="w-full px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 mono text-emerald-950 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Severity Level
              </label>
              <select
                value={severity}
                onChange={(e: any) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="CRITICAL">CRITICAL (Red Violation)</option>
                <option value="WARNING">WARNING (Amber Concern)</option>
                <option value="TIP">TIP (Blue Optimization)</option>
              </select>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-[11px] font-bold text-slate-800">
                  Enforce in Live Audits
                </span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              {initialData ? 'Update Policy Rule' : 'Save Policy Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   PRODUCT MODAL (ADD / EDIT)
───────────────────────────────────────────────────────────── */
interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prod: ProductItem) => void;
  initialData?: ProductItem | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Shirts');
  const [basePrice, setBasePrice] = useState('₹1,299');
  const [fabric, setFabric] = useState('100% Cotton');
  const [fit, setFit] = useState('Regular fit');
  const [unapprovedClaimsText, setUnapprovedClaimsText] = useState('Wrinkle-proof, Stain-resistant');
  const [hasCampaign, setHasCampaign] = useState(false);
  const [campaignCode, setCampaignCode] = useState('CMP-26-025');
  const [campaignPrice, setCampaignPrice] = useState('₹999');
  const [campaignDates, setCampaignDates] = useState('15–30 Nov 2026');
  const [campaignConditions, setCampaignConditions] = useState('While stocks last');

  useEffect(() => {
    if (initialData) {
      setSku(initialData.sku);
      setName(initialData.name);
      setCategory(initialData.category);
      setBasePrice(initialData.basePrice);
      setFabric(initialData.fabric);
      setFit(initialData.fit);
      setUnapprovedClaimsText((initialData.unapprovedClaims || []).join(', '));
      if (initialData.activeCampaign) {
        setHasCampaign(true);
        setCampaignCode(initialData.activeCampaign.code);
        setCampaignPrice(initialData.activeCampaign.price);
        setCampaignDates(initialData.activeCampaign.dates);
        setCampaignConditions(initialData.activeCampaign.conditions);
      } else {
        setHasCampaign(false);
      }
    } else {
      setSku(`NW-CS-00${Math.floor(Math.random() * 90 + 10)}`);
      setName('');
      setCategory('Shirts');
      setBasePrice('₹1,299');
      setFabric('100% Cotton');
      setFit('Regular fit');
      setUnapprovedClaimsText('Wrinkle-proof, Shrink-proof');
      setHasCampaign(false);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) return;

    const unapprovedClaims = unapprovedClaimsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const prod: ProductItem = {
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category: category.trim(),
      basePrice: basePrice.trim(),
      fabric: fabric.trim(),
      fit: fit.trim(),
      unapprovedClaims,
      activeCampaign: hasCampaign
        ? {
            code: campaignCode.trim(),
            price: campaignPrice.trim(),
            dates: campaignDates.trim(),
            conditions: campaignConditions.trim(),
          }
        : undefined,
    };

    onSave(prod);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {initialData ? 'Edit Product Catalogue Item' : 'Add New Product SKU'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Approved product specifications for real-time audit verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Target SKU Code *
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. NW-CS-009"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                <option value="Shirts">Shirts</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Trousers">Trousers</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Product Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Classic Cotton Kurta / Shirt"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Base Selling Price *
              </label>
              <input
                type="text"
                required
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="e.g. ₹1,299"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Fit Specification
              </label>
              <input
                type="text"
                value={fit}
                onChange={(e) => setFit(e.target.value)}
                placeholder="e.g. Regular fit, Slim fit"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Approved Fabric Composition *
            </label>
            <input
              type="text"
              required
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              placeholder="e.g. 100% Cotton or 60% Cotton, 40% Polyester"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-900 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Prohibited / Unapproved Claims (comma separated)
            </label>
            <input
              type="text"
              value={unapprovedClaimsText}
              onChange={(e) => setUnapprovedClaimsText(e.target.value)}
              placeholder="e.g. Wrinkle-proof, Stain-resistant, 100% Cotton"
              className="w-full px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/30 text-rose-900 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Active Promotional Campaign Toggle */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasCampaign}
                onChange={(e) => setHasCampaign(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-[11px] font-bold text-slate-900">
                Attach Active Promotional Campaign
              </span>
            </label>

            {hasCampaign && (
              <div className="grid grid-cols-2 gap-2.5 pt-1 animate-fadeIn">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Campaign Code</label>
                  <input
                    type="text"
                    value={campaignCode}
                    onChange={(e) => setCampaignCode(e.target.value)}
                    placeholder="e.g. CMP-26-018"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white mono text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Campaign Price</label>
                  <input
                    type="text"
                    value={campaignPrice}
                    onChange={(e) => setCampaignPrice(e.target.value)}
                    placeholder="e.g. ₹599"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold text-emerald-600 text-xs"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Campaign Dates</label>
                  <input
                    type="text"
                    value={campaignDates}
                    onChange={(e) => setCampaignDates(e.target.value)}
                    placeholder="e.g. 1–15 Nov 2026"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold shadow-md shadow-indigo-500/20 transition-all cursor-pointer active:scale-95"
            >
              {initialData ? 'Update SKU' : 'Save SKU to Catalogue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   TOAST BANNER NOTIFICATION
───────────────────────────────────────────────────────────── */
interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed top-24 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-slate-800 animate-scaleIn">
      <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
        <Check className="w-3.5 h-3.5 stroke-[3]" />
      </div>
      <span className="pr-2">{message}</span>
      <button
        onClick={onDismiss}
        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

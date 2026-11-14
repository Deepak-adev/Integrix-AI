import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Upload,
  Sparkles, Copy, Check, RotateCcw, FileText, Share2,
  FileCheck2, ChevronDown, Zap, Search, Maximize2, X,
  CornerDownRight, ArrowRight, LayoutDashboard,
  FlaskConical, Package, Shield, RefreshCw, Eye,
  SlidersHorizontal, CheckCircle, AlertOctagon, ScanLine,
  Layers, Cpu, ArrowUpRight
} from 'lucide-react';
import {
  extractTextFromImage,
  auditAdWithAI,
  AdAuditResponse,
  AuditMetadata
} from './services/groqAuditService';

/* ─────────────────────────────────────────────────────────────
   TYPES & DATA
───────────────────────────────────────────────────────────── */
interface Product {
  sku: string; name: string; category: string; basePrice: string;
  fabric: string; fit: string; unapprovedClaims: string[];
  activeCampaign?: { code: string; price: string; dates: string; conditions: string; };
}
interface TestItem {
  id: string; adCode: string; title: string; sku: string; image: string;
  expectedStatus: 'FAIL' | 'PASS'; expectedIssue: string; primaryRule: string;
}
type Page = 'home' | 'audit' | 'dashboard' | 'catalogue' | 'rules' | 'testpack';

const PRODUCTS: Product[] = [
  { sku:'NW-CS-001', name:'Classic Cotton Shirt', category:'Shirts',   basePrice:'₹1,299', fabric:'100% Cotton',              fit:'Regular fit',   unapprovedClaims:['Wrinkle-proof','Shrink-proof','Hypoallergenic'] },
  { sku:'NW-CS-002', name:'Everyday Oxford Shirt',category:'Shirts',   basePrice:'₹1,199', fabric:'60% Cotton, 40% Polyester',fit:'Slim / Regular', unapprovedClaims:['100% Cotton','Pure Cotton','Stain-proof'] },
  { sku:'NW-TS-003', name:'Core Crew T-Shirt',    category:'T-Shirts', basePrice:'₹649',   fabric:'95% Cotton, 5% Elastane', fit:'Regular fit',   unapprovedClaims:['100% Cotton','Sweat-proof','Odour-proof'], activeCampaign:{code:'CMP-26-018',price:'₹599',dates:'1–15 Nov 2026',conditions:'Selected sizes S–XL'} },
  { sku:'NW-TS-004', name:'Relaxed Weekend Tee',  category:'T-Shirts', basePrice:'₹749',   fabric:'100% Cotton',              fit:'Relaxed fit',   unapprovedClaims:['Non-shrink','Stain-resistant'] },
  { sku:'NW-TR-005', name:'Everyday Chino',        category:'Trousers', basePrice:'₹1,499', fabric:'98% Cotton, 2% Elastane', fit:'Slim-straight', unapprovedClaims:['100% Cotton','Waterproof'] },
  { sku:'NW-OS-006', name:'Lightweight Overshirt', category:'Outerwear',basePrice:'₹1,899', fabric:'70% Cotton, 30% Linen',   fit:'Relaxed fit',   unapprovedClaims:['Pure Linen','Wrinkle-free'] },
  { sku:'NW-CS-007', name:'Textured Office Shirt', category:'Shirts',   basePrice:'₹1,399', fabric:'55% Cotton, 45% Viscose', fit:'Tailored fit',  unapprovedClaims:['100% Cotton','Iron-free'] },
  { sku:'NW-TS-008', name:'Graphic Line T-Shirt',  category:'T-Shirts', basePrice:'₹849',   fabric:'100% Cotton',              fit:'Regular fit',   unapprovedClaims:['Fadeproof'] },
];

const TESTS: TestItem[] = [
  { id:'1', adCode:'AD-NW-001', title:'Classic Cotton Kurta',  sku:'NW-CS-001', image:'/ads/AD-NW-001.png', expectedStatus:'FAIL', expectedIssue:'Mislabels shirt as "Kurta" & displays unauthorized ₹999 price (Base: ₹1,299)', primaryRule:'NW-RULE-002' },
  { id:'2', adCode:'AD-NW-002', title:'Essential Polo Tee',    sku:'NW-CS-002', image:'/ads/AD-NW-002.png', expectedStatus:'FAIL', expectedIssue:'Claims 100% Polyester & unauthorized ₹899 price without campaign signoff', primaryRule:'NW-RULE-001' },
  { id:'3', adCode:'AD-NW-003', title:'Festive Edit (20% OFF)',sku:'NW-CS-001', image:'/ads/AD-NW-003.png', expectedStatus:'FAIL', expectedIssue:'Unapproved promotional campaign with missing base price in INR', primaryRule:'NW-RULE-002' },
  { id:'4', adCode:'AD-NW-004', title:'Winter Sale (30% OFF)', sku:'NW-OS-006', image:'/ads/AD-NW-004.png', expectedStatus:'FAIL', expectedIssue:'Future promotional claim without SKU identification or required conditions', primaryRule:'NW-RULE-002' },
  { id:'5', adCode:'AD-NW-005', title:'Wrinkle-Proof Shirts',  sku:'NW-CS-001', image:'/ads/AD-NW-005.png', expectedStatus:'FAIL', expectedIssue:'Unsupported performance claim "Wrinkle-Proof" & ₹1,499 price mismatch', primaryRule:'NW-RULE-003' },
  { id:'6', adCode:'AD-NW-006', title:'Next-Day Delivery',     sku:'NW-CS-001', image:'/ads/AD-NW-006.png', expectedStatus:'FAIL', expectedIssue:'Guaranteed delivery promise without required cutoff & pin code disclaimers', primaryRule:'NW-RULE-004' },
  { id:'7', adCode:'AD-NW-007', title:'Essential T-Shirt',     sku:'NW-TS-003', image:'/ads/AD-NW-007.png', expectedStatus:'FAIL', expectedIssue:'Unauthorized price ₹699 (Approved catalogue price is ₹649 for Core Crew)', primaryRule:'NW-RULE-002' },
];

const RULES = [
  { id:'NW-RULE-001', title:'Fabric Composition', cat:'Product', desc:'Fabric claims must exactly match catalogue specifications. No 100% claim on blends.', bad:'100% Cotton on 60/40 blend', good:'State certified blend (e.g. 60% Cotton, 40% Polyester)' },
  { id:'NW-RULE-002', title:'Campaign Pricing', cat:'Commercial', desc:'Promotional prices require active approved campaign sign-off. Indian Rupees (₹) only.', bad:'₹999 when expired or unapproved', good:'Show approved base price ₹1,299 or active campaign' },
  { id:'NW-RULE-003', title:'Performance Claims', cat:'Consumer', desc:'Functional benefits (wrinkle-proof, waterproof) must be backed by accredited lab test data.', bad:'"Wrinkle-Proof" or "Stain-proof"', good:'"Easy-care fabric" or accredited test statement' },
  { id:'NW-RULE-004', title:'Delivery SLAs', cat:'Operations', desc:'Next-day delivery guarantees require pincode and order cutoff disclaimers.', bad:'"Delivered tomorrow. Guaranteed."', good:'"Delivery in 2–4 business days (terms apply)"' },
  { id:'NW-RULE-005', title:'Brand Tone of Voice', cat:'Editorial', desc:'Keep messaging straightforward, premium, and authentic. Avoid hyperbolic superlatives.', bad:'"World\'s most revolutionary shirt"', good:'"Clean design, engineered for daily comfort"' },
];

/* ─────────────────────────────────────────────────────────────
   MICRO COMPONENTS
───────────────────────────────────────────────────────────── */
const PillBadge = ({ children, color = 'slate' }: { children: React.ReactNode; color?: 'slate' | 'emerald' | 'rose' | 'amber' | 'indigo' | 'sky' }) => {
  const styles = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${styles[color]}`}>
      {children}
    </span>
  );
};

const AnimatedScoreRing = ({ score }: { score: number }) => {
  const r = 30, circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const isPass = score >= 80;
  const isWarn = score >= 50 && score < 80;
  const strokeColor = isPass ? '#10B981' : isWarn ? '#F59E0B' : '#F43F5E';
  
  return (
    <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke={strokeColor} strokeWidth="6"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        <span className="mono text-[17px] font-black text-slate-900">{score}</span>
        <span className="mono text-[8px] text-slate-400 block mt-0.5 font-bold">/100</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────── */
export const App: React.FC = () => {
  const [page, setPage] = useState<Page>('home');
  const [sku, setSku] = useState('NW-CS-001');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [adText, setAdText] = useState('');
  const [isDrag, setIsDrag] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<AdAuditResponse | null>(null);
  const [tab, setTab] = useState<'faults' | 'autofix' | 'sim'>('faults');
  const [copied, setCopied] = useState<string | null>(null);
  const [simText, setSimText] = useState('');
  const [showRaw, setShowRaw] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [catFilter, setCatFilter] = useState('ALL');
  const [ruleQ, setRuleQ] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const product = PRODUCTS.find(p => p.sku === sku) || PRODUCTS[0];

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace('#/', '') as Page;
      if (['home','audit','dashboard','catalogue','rules','testpack'].includes(h)) setPage(h);
    };
    if (window.location.hash) onHash();
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const nav = (p: Page) => { setPage(p); window.location.hash = `#/${p}`; window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const cp = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 2000); };

  const upload = async (file: File) => {
    setFileName(file.name);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onload = e => setPreview(e.target?.result as string);
      r.readAsDataURL(file);
    }
    setResult(null);
    setTab('faults');
    setAuditing(true); setStep('Scanning visual creative (OCR)…');
    try {
      const text = await extractTextFromImage(file, m => setStep(m));
      setAdText(text); setSimText(text);
      await runAudit(text, product);
    } catch (e) { console.error(e); setAuditing(false); }
  };

  const runAudit = async (text: string, prod: Product) => {
    setAuditing(true); setStep('Evaluating policy against catalogue specs…');
    const meta: AuditMetadata = {
      brand: 'NOVAWEAR', sku: prod.sku, productName: prod.name,
      basePrice: prod.basePrice, fabric: prod.fabric, fit: prod.fit,
      unapprovedClaims: prod.unapprovedClaims, activeCampaign: prod.activeCampaign,
      channel: 'Website & Social Ad',
    };
    try {
      const r = await auditAdWithAI(text, meta, m => setStep(m));
      setResult(r); setTab('faults');
      if (!simText) setSimText(text);
    } finally { setAuditing(false); setStep(''); }
  };

  const reset = () => { setResult(null); setFileName(null); setFileSize(null); setPreview(null); setAdText(''); setSimText(''); };

  const launchTest = async (item: TestItem) => {
    setSku(item.sku); setFileName(`${item.adCode}.png`); setFileSize('~288 KB'); setPreview(item.image);
    nav('audit'); setResult(null); setTab('faults'); setAuditing(true); setStep('Loading creative…');
    try {
      const text = await extractTextFromImage(item.adCode);
      setAdText(text); setSimText(text);
      const prod = PRODUCTS.find(p => p.sku === item.sku) || PRODUCTS[0];
      await runAudit(text, prod);
    } catch (e) { console.error(e); setAuditing(false); }
  };

  const NAV_ITEMS = [
    { p: 'home' as Page,      label: 'Home',         icon: Sparkles },
    { p: 'audit' as Page,     label: 'Audit Studio', icon: Zap },
    { p: 'dashboard' as Page, label: 'Dashboard',    icon: LayoutDashboard },
    { p: 'catalogue' as Page, label: 'Catalogue',    icon: Package },
    { p: 'rules' as Page,     label: 'Policy Rules', icon: Shield },
    { p: 'testpack' as Page,  label: 'Test Pack',    icon: FlaskConical },
  ];

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased relative overflow-x-hidden"
      onPaste={e => { const f = e.clipboardData.files[0]; if (f?.type.startsWith('image/')) upload(f); }}
    >
      {/* Hidden file input */}
      <input ref={fileRef} type="file" className="hidden" accept="image/png,image/jpeg,image/webp" onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); }} />

      {/* Ambient background glow orbs */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10 anim-float" />
      <div className="absolute top-32 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ════════════════════════════════════════════════════════
          FLOATING FROSTED HEADER NAVBAR
          ════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 glass-header transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Brand Logo (Enlarged & Crisp) */}
          <div className="flex items-center gap-8">
            <button onClick={() => nav('home')} className="flex items-center group cursor-pointer focus:outline-none">
              <img
                src="/logo.png"
                alt="Integrix AI"
                className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
              />
            </button>

            {/* Segmented Navigation Menu */}
            <nav className="hidden md:flex items-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/60 shadow-inner">
              {NAV_ITEMS.map(({ p, label, icon: Icon }) => {
                const active = page === p;
                return (
                  <button
                    key={p}
                    onClick={() => nav(p)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-sm font-extrabold scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{label}</span>
                    {p === 'testpack' && (
                      <span className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${active ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>7</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Quick Header Controls */}
          <div className="flex items-center gap-3">
            {/* Live Model Badge */}
           

            {/* Primary Upload CTA Button */}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all duration-200 cursor-pointer active:scale-95"
            >
              <Upload className="w-4 h-4" />
              Upload Creative
            </button>

            {/* Export Report CTA */}
            {result && page === 'audit' && (
              <button
                onClick={() => setExportOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-100 gap-2 bg-white">
          {NAV_ITEMS.map(({ p, label, icon: Icon }) => (
            <button
              key={p}
              onClick={() => nav(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer ${
                page === p ? 'bg-slate-900 text-white' : 'text-slate-600 bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════
          MAIN CONTENT VIEWPORT
          ════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">

        {/* ────────────────────────────────────────────────────────
            PAGE 0: HOME LANDING PAGE
        ──────────────────────────────────────────────────────── */}
        {page === 'home' && (
          <div className="space-y-12 py-2">
            
            {/* HERO SECTION */}
            <div className="text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/90 border border-indigo-200/80 text-indigo-700 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                AI-Powered Content Governance & Brand Safety
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.12]">
                Automated Advertising Compliance{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
                  at Enterprise Scale
                </span>
              </h1>

              <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
                Integrix AI audits advertisements, social banners, and commercial claims against approved catalogue specifications and brand policy — detecting breaches and generating evidence-backed "Do This Instead" solutions in seconds.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => nav('audit')}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Launch Audit Studio
                </button>
                <button
                  onClick={() => nav('dashboard')}
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  View Dashboard
                </button>
                <button
                  onClick={() => nav('catalogue')}
                  className="px-5 py-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-400" />
                  Approved Catalogue
                </button>
              </div>
            </div>

            {/* QUICK METRICS TICKER */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-4">
              {[
                { label: 'Policy Precision', val: '100%', sub: 'Ground-truth catalogue checking' },
                { label: 'Inference Speed', val: '< 2.0s', sub: 'Real-time OCR & policy reasoning' },
                { label: 'Product Inventory', val: '8 SKUs', sub: 'Certified specifications database' },
                { label: 'Active Rule Engines', val: '5 Rules', sub: 'Pricing, fabric, claims, SLAs & tone' },
              ].map((m, idx) => (
                <div key={idx} className="creative-card p-5 text-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                  <div className="text-2xl font-black text-slate-900 mono">{m.val}</div>
                  <p className="text-[11px] text-slate-500">{m.sub}</p>
                </div>
              ))}
            </div>

            {/* CORE MODULES REDIRECTION HUB */}
            <div className="space-y-6 pt-6">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  System Architecture
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Explore Platform Capabilities</h2>
                <p className="text-xs text-slate-500">Jump directly into any governance module with full interactive capability</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Module 1: Audit Studio */}
                <div className="creative-card p-6 flex flex-col justify-between hover:border-indigo-400 hover:shadow-lg transition-all group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-1">Live Evaluation</span>
                      <h3 className="text-base font-bold text-slate-900">Creative Audit Studio</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Upload any banner, poster, or ad copy. Extracts claims via OCR and audits directly against ground-truth catalogue facts.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => nav('audit')}
                    className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Launch Studio →
                  </button>
                </div>

                {/* Module 2: Dashboard */}
                <div className="creative-card p-6 flex flex-col justify-between hover:border-violet-400 hover:shadow-lg transition-all group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 block mb-1">Analytics</span>
                      <h3 className="text-base font-bold text-slate-900">Governance Dashboard</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        High-level compliance overview, inspection metrics, active promotional campaigns, and brand safety ratings.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => nav('dashboard')}
                    className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    View Dashboard →
                  </button>
                </div>

                {/* Module 3: Catalogue */}
                <div className="creative-card p-6 flex flex-col justify-between hover:border-emerald-400 hover:shadow-lg transition-all group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-1">Ground Truth</span>
                      <h3 className="text-base font-bold text-slate-900">Approved Catalogue</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Verified database of 8 garments with certified fabric blends, authorized base prices, fits, and active campaign dates.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => nav('catalogue')}
                    className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Explore Catalogue →
                  </button>
                </div>

                {/* Module 4: Policy Rulebook */}
                <div className="creative-card p-6 flex flex-col justify-between hover:border-amber-400 hover:shadow-lg transition-all group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">Regulatory</span>
                      <h3 className="text-base font-bold text-slate-900">Policy Rulebook</h3>
                      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                        5 enforceable rule engines covering fabric composition, campaign pricing, unsubstantiated claims, SLAs, and editorial voice.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => nav('rules')}
                    className="mt-6 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Inspect Rules →
                  </button>
                </div>
              </div>
            </div>

            {/* 3-STEP AUDITING WORKFLOW */}
            <div className="creative-card p-8 sm:p-12 space-y-8 bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/30">
              <div className="text-center max-w-xl mx-auto space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Execution Process</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">How Integrix AI Audits Content</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    step: '01',
                    title: 'Upload Creative',
                    desc: 'Drop any banner, social ad poster, or product creative in PNG, JPG, or WebP. Instant text recognition extracts all copy.',
                  },
                  {
                    step: '02',
                    title: 'Automated AI Verification',
                    desc: 'Cross-checks every visible price, fiber claim, performance promise, and date against authorized catalogue specifications.',
                  },
                  {
                    step: '03',
                    title: 'Actionable Resolution',
                    desc: 'Produces a compliance score, highlights exact discrepancies, and generates pre-approved "Do This Instead" copy ready to deploy.',
                  },
                ].map((s) => (
                  <div key={s.step} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <span className="mono text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                      STEP {s.step}
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">{s.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* BOTTOM ACCEPTANCE TEST SUITE BANNER */}
            <div className="creative-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-900 text-white">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Verification Fixtures</span>
                <h3 className="text-lg font-black text-white">Standard Compliance Test Suite (7 Creatives)</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Explore official test cases with predetermined pricing, fabric, and performance claim violations.
                </p>
              </div>
              <button
                onClick={() => nav('testpack')}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                Launch Test Suite →
              </button>
            </div>

          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            PAGE 1: AUDIT STUDIO
        ──────────────────────────────────────────────────────── */}
        {page === 'audit' && (
          <div className="space-y-6">

            {/* Top Bar: Target SKU Selector & Certified Specifications */}
            <div className="creative-card p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Target Product:</span>
                <select
                  value={sku}
                  onChange={e => {
                    const next = e.target.value;
                    setSku(next);
                    const p = PRODUCTS.find(x => x.sku === next);
                    if (p && adText) runAudit(adText, p);
                  }}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-xl px-3.5 py-2 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer transition-all shadow-2xs"
                >
                  {PRODUCTS.map(p => (
                    <option key={p.sku} value={p.sku}>{p.sku} — {p.name} ({p.basePrice})</option>
                  ))}
                </select>

                <div className="hidden sm:flex items-center gap-2">
                  <PillBadge color="emerald">{product.basePrice}</PillBadge>
                  <PillBadge color="sky">{product.fabric}</PillBadge>
                  <PillBadge color="slate">{product.fit}</PillBadge>
                </div>
              </div>

              {preview && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                  New Audit
                </button>
              )}
            </div>

            {/* Scanning In-Progress Notification */}
            {auditing && (
              <div className="creative-card p-4 border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3 text-xs font-bold text-indigo-950 glow-indigo">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span className="text-sm">{step}</span>
                </div>
                <span className="mono text-[10px] text-indigo-600 font-extrabold uppercase tracking-widest bg-white px-2.5 py-1 rounded-md border border-indigo-200">
                  Scanning
                </span>
              </div>
            )}

            {/* CREATIVE INNOVATIVE LANDING: Interactive AI Scanning Stage */}
            {!preview && !adText && !auditing && (
              <div className="creative-card p-8 sm:p-14 scanner-stage border-slate-200/80 relative overflow-hidden text-center">
                
                {/* Holographic Target Frame Elements */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-indigo-400/60 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-indigo-400/60 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-indigo-400/60 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-indigo-400/60 rounded-br-lg pointer-events-none" />

                <div className="max-w-xl mx-auto space-y-6">
                  
                  {/* Visual Scanning Icon with Radial Glow */}
                  <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-sky-500/20 blur-xl animate-pulse" />
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="relative w-20 h-20 rounded-3xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-500/10 hover:scale-105 hover:border-indigo-400 transition-all cursor-pointer group"
                    >
                      <ScanLine className="w-9 h-9 group-hover:scale-110 transition-transform text-indigo-600" />
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      Drop Ad Creative to Verify Compliance
                    </h2>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Instant evaluation of pricing, certified fabric composition, and unapproved claims against catalogue standards.
                    </p>
                  </div>

                  {/* Action Triggers */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-lg shadow-slate-950/10 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Select Image File
                    </button>
                    
                    <button
                      onClick={() => nav('testpack')}
                      className="px-5 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs hover:border-slate-300 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <FlaskConical className="w-4 h-4 text-indigo-500" />
                      Try with Test Creative
                    </button>
                  </div>

                  {/* Keyboard / Format Hint */}
                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-2 font-medium">
                    <span>Supports PNG, JPG, WebP</span>
                    <span>·</span>
                    <span>Paste with <kbd className="mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Ctrl + V</kbd></span>
                  </div>

                </div>
              </div>
            )}

            {/* SPLIT SCREEN STUDIO (When creative is uploaded/loaded) */}
            {(preview || adText) && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* LEFT: Ad Creative Viewer (5 cols) */}
                <div className="lg:col-span-5 creative-card overflow-hidden">
                  <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs bg-slate-50/60">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck2 className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800 truncate">{fileName || 'Ad Creative'}</span>
                      {fileSize && <span className="mono text-[10px] text-slate-400 font-semibold">({fileSize})</span>}
                    </div>
                    {preview && (
                      <button
                        onClick={() => setZoomed(true)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        title="Enlarge Image"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {preview && (
                    <div
                      onClick={() => setZoomed(true)}
                      className="bg-slate-50/80 p-5 flex items-center justify-center min-h-[380px] max-h-[520px] overflow-hidden cursor-zoom-in group"
                    >
                      <img
                        src={preview}
                        alt="Creative poster"
                        className="max-h-[480px] w-auto object-contain group-hover:scale-[1.01] transition-transform duration-300 rounded-lg shadow-sm"
                      />
                    </div>
                  )}

                  {/* Collapsible OCR Drawer */}
                  <div className="border-t border-slate-100">
                    <button
                      onClick={() => setShowRaw(!showRaw)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <span className="flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-slate-400" /> Extracted Text (OCR)</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
                    </button>
                    {showRaw && (
                      <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <pre className="mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                          {adText || 'No text recognized.'}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT: Audit Findings & Fix Recommendations (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  {result && (
                    <>
                      {/* Overall Compliance Verdict Card */}
                      <div className="creative-card p-6 flex items-start justify-between gap-5 glow-indigo">
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <PillBadge color={result.status === 'PASS' ? 'emerald' : 'rose'}>
                              {result.status === 'PASS' ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Approved · Ready to Publish</>
                              ) : (
                                <><ShieldAlert className="w-3.5 h-3.5" /> {result.faults.length} Fault{result.faults.length > 1 ? 's' : ''} Detected</>
                              )}
                            </PillBadge>
                            <span className="mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">Catalogue Verified</span>
                          </div>
                          <h2 className="text-base font-extrabold text-slate-900 leading-snug">{result.headlineVerdict}</h2>
                          <p className="text-xs text-slate-500 leading-relaxed">{result.summary}</p>
                        </div>
                        <AnimatedScoreRing score={result.complianceScore} />
                      </div>

                      {/* Tool Tabs: Faults & Solutions | AI Rewriter | Simulator */}
                      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl w-fit border border-slate-200/60">
                        {[
                          { id: 'faults', label: `Faults & Solutions (${result.faults.length})` },
                          { id: 'autofix', label: 'AI Auto-Fix Rewriter' },
                          { id: 'sim', label: 'Live Copy Simulator' },
                        ].map(t => (
                          <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              tab === t.id
                                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/50'
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>

                      {/* TAB 1: FAULTS & ACTIONABLE RESOLUTIONS */}
                      {tab === 'faults' && (
                        <div className="space-y-3.5">
                          {result.faults.length === 0 ? (
                            <div className="creative-card p-12 text-center space-y-2">
                              <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
                              <h4 className="text-sm font-extrabold text-slate-900">Zero Compliance Faults</h4>
                              <p className="text-xs text-slate-500 max-w-sm mx-auto">This ad conforms 100% with pricing, fabric composition, and advertising regulations.</p>
                            </div>
                          ) : (
                            result.faults.map((f, i) => (
                              <div key={f.id || i} className="creative-card overflow-hidden">
                                
                                {/* Fault Header */}
                                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-white">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="mono text-xs font-black text-slate-400">#{i + 1}</span>
                                      <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                                    </div>
                                    <p className="mono text-[10px] text-slate-400 font-semibold">{f.sourceReference}</p>
                                  </div>
                                  <PillBadge color={f.severity === 'CRITICAL' ? 'rose' : f.severity === 'WARNING' ? 'amber' : 'slate'}>
                                    {f.severity}
                                  </PillBadge>
                                </div>

                                {/* Comparison: Observed vs Approved */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs bg-slate-50/50">
                                  <div className="p-4 space-y-1.5">
                                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">Observed in Ad</span>
                                    <code className="inline-block px-2.5 py-1 bg-rose-100/80 text-rose-800 rounded-md font-bold mono text-[11px]">
                                      "{f.observedText}"
                                    </code>
                                    <p className="text-slate-500 leading-relaxed mt-1">{f.violationReason}</p>
                                  </div>

                                  <div className="p-4 space-y-1.5">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved Standard</span>
                                    <p className="text-slate-800 font-semibold leading-relaxed">{f.approvedStandard}</p>
                                  </div>
                                </div>

                                {/* HIGH-IMPACT "DO THIS INSTEAD" RESOLUTION */}
                                <div className="p-4 bg-emerald-50/70 border-t border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                  <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-[11px] uppercase tracking-wider">
                                      <CornerDownRight className="w-3.5 h-3.5 text-emerald-600" />
                                      Do This Instead:
                                    </div>
                                    <p className="mono text-xs font-bold text-emerald-950 leading-relaxed">
                                      {f.doThisInstead}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => {
                                        setSimText(adText.replace(f.observedText, f.doThisInstead) || f.doThisInstead);
                                        setTab('sim');
                                      }}
                                      className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-[11px] font-bold text-emerald-700 transition-colors cursor-pointer shadow-2xs"
                                    >
                                      Send to Editor
                                    </button>
                                    <button
                                      onClick={() => cp(f.doThisInstead, `fix-${i}`)}
                                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                                    >
                                      {copied === `fix-${i}` ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Fix</>}
                                    </button>
                                  </div>
                                </div>

                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* TAB 2: AI AUTO-FIX GENERATOR */}
                      {tab === 'autofix' && (
                        <div className="creative-card p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">Pre-Approved Compliant Copy</h3>
                              <p className="text-xs text-slate-500">Auto-generated rewrites conforming with catalogue policies</p>
                            </div>
                            <button
                              onClick={() => cp(`${result.autoFixSuggestions.suggestedHeadline}\n\n${result.autoFixSuggestions.suggestedBodyCopy}\n\n${result.autoFixSuggestions.suggestedDisclaimer}`, 'all-copy')}
                              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              {copied === 'all-copy' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy All</>}
                            </button>
                          </div>

                          <div className="space-y-3">
                            {[
                              { label: 'Recommended Headline', val: result.autoFixSuggestions.suggestedHeadline },
                              { label: 'Approved Body Copy', val: result.autoFixSuggestions.suggestedBodyCopy },
                              { label: 'Mandatory Disclaimers', val: result.autoFixSuggestions.suggestedDisclaimer },
                            ].map((s, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{s.label}</span>
                                  <button
                                    onClick={() => cp(s.val, `sec-${idx}`)}
                                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                                  >
                                    {copied === `sec-${idx}` ? 'Copied' : 'Copy'}
                                  </button>
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-semibold">{s.val}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: LIVE SIMULATOR */}
                      {tab === 'sim' && (
                        <div className="creative-card p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <button
                                  onClick={() => setTab('faults')}
                                  className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  ← Back to Faults
                                </button>
                              </div>
                              <h3 className="text-sm font-bold text-slate-900">Live Copy Simulator</h3>
                              <p className="text-xs text-slate-500">Edit copy and simulate compliance verification in real time</p>
                            </div>
                            <button
                              disabled={auditing || !simText}
                              onClick={() => { setAdText(simText); runAudit(simText, product); }}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              Re-Analyze
                            </button>
                          </div>

                          <textarea
                            rows={8}
                            value={simText}
                            onChange={e => setSimText(e.target.value)}
                            placeholder="Type or paste revised copy..."
                            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 mono text-xs text-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed"
                          />
                          <div className="flex justify-between text-[11px] text-slate-400 mono">
                            <span>Words: {simText.trim().split(/\s+/).filter(Boolean).length}</span>
                            <span>Characters: {simText.length}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            PAGE 2: DASHBOARD
        ──────────────────────────────────────────────────────── */}
        {page === 'dashboard' && (
          <div className="space-y-6">
            <div className="creative-card p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 max-w-xl">
                <PillBadge color="indigo">Enterprise Brand Safety</PillBadge>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Governance Intelligence Hub</h1>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Real-time policy enforcement and compliance guardrails for digital & retail advertisements against catalogue facts and active promotional campaigns.
                </p>
              </div>
              <button
                onClick={() => nav('audit')}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer shrink-0"
              >
                Open Audit Studio →
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Validation Suite', val: '7 Creatives', sub: 'Pre-configured tests' },
                { label: 'Policy Rules', val: '5 Active Rules', sub: 'Fabric, price, SLAs & tone' },
                { label: 'Approved SKUs', val: '8 Products', sub: 'NOVAWEAR catalog' },
                { label: 'Audit Speed', val: '< 2.0s', sub: 'Automated verification' },
              ].map((m, idx) => (
                <div key={idx} className="creative-card p-5 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{m.label}</span>
                  <div className="text-xl font-black text-slate-900">{m.val}</div>
                  <p className="text-[11px] text-slate-500">{m.sub}</p>
                </div>
              ))}
            </div>

            <div className="creative-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validation Creatives</h3>
                  <p className="text-xs text-slate-500">Click any card to load and audit instantly</p>
                </div>
                <button onClick={() => nav('testpack')} className="text-xs font-bold text-indigo-600 hover:underline">
                  View All 7 →
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {TESTS.slice(0, 4).map(t => (
                  <div
                    key={t.id}
                    onClick={() => launchTest(t)}
                    className="border border-slate-200 rounded-2xl p-3 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group bg-slate-50/50"
                  >
                    <div className="h-32 bg-white rounded-xl flex items-center justify-center overflow-hidden mb-3">
                      <img src={t.image} alt={t.title} className="h-full object-contain group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="mono text-[11px] font-bold text-indigo-600">{t.adCode}</span>
                      <PillBadge color={t.expectedStatus === 'PASS' ? 'emerald' : 'rose'}>{t.expectedStatus}</PillBadge>
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate">{t.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            PAGE 3: CATALOGUE
        ──────────────────────────────────────────────────────── */}
        {page === 'catalogue' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Approved Product Catalogue</h1>
                <p className="text-xs text-slate-500">Official NOVAWEAR database for ground-truth compliance checks</p>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60">
                {['ALL', 'Shirts', 'T-Shirts', 'Trousers', 'Outerwear'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      catFilter === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PRODUCTS.filter(p => catFilter === 'ALL' || p.category === catFilter).map(p => (
                <div key={p.sku} className="creative-card p-5 flex flex-col justify-between hover:border-slate-300 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">{p.sku}</span>
                      <span className="text-[10px] font-semibold text-slate-400">{p.category}</span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                      <div className="text-base font-black text-emerald-600 mt-0.5">{p.basePrice}</div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div><span className="text-slate-400 font-medium">Fabric:</span> {p.fabric}</div>
                      <div><span className="text-slate-400 font-medium">Fit:</span> {p.fit}</div>
                      <div className="text-rose-500 text-[11px]">
                        <span className="text-slate-400">Prohibited:</span> {p.unapprovedClaims.join(', ')}
                      </div>
                    </div>

                    {p.activeCampaign && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-0.5">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">Active Campaign</span>
                        <div className="font-bold text-emerald-950">{p.activeCampaign.code} ({p.activeCampaign.price})</div>
                        <div className="text-[10px] text-emerald-700">{p.activeCampaign.dates}</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => { setSku(p.sku); nav('audit'); }}
                    className="mt-4 w-full py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-900 hover:text-white text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Audit for this SKU →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            PAGE 4: POLICY RULES
        ──────────────────────────────────────────────────────── */}
        {page === 'rules' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Governance Policy Rulebook</h1>
                <p className="text-xs text-slate-500">Legal, commercial, and operational constraints enforced by Integrix AI</p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter rules..."
                  value={ruleQ}
                  onChange={e => setRuleQ(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-3.5">
              {RULES.filter(r => !ruleQ || r.title.toLowerCase().includes(ruleQ.toLowerCase()) || r.id.toLowerCase().includes(ruleQ.toLowerCase())).map(r => (
                <div key={r.id} className="creative-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-md">{r.id}</span>
                      <h3 className="text-sm font-bold text-slate-900">{r.title}</h3>
                    </div>
                    <PillBadge>{r.cat}</PillBadge>
                  </div>
                  <p className="text-xs text-slate-600">{r.desc}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-600 uppercase block mb-1">Non-Compliant Example</span>
                      <p className="mono font-semibold text-rose-950">{r.bad}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase block mb-1">Approved Standard</span>
                      <p className="mono font-semibold text-emerald-950">{r.good}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            PAGE 5: TEST PACK
        ──────────────────────────────────────────────────────── */}
        {page === 'testpack' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Compliance Validation Suite (7 Creatives)</h1>
              <p className="text-xs text-slate-500">Standardized verification creatives — select any ad to run a compliance audit</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {TESTS.map(t => (
                <div key={t.id} className="creative-card p-4 flex flex-col justify-between hover:border-indigo-300 hover:shadow-md transition-all">
                  <div className="space-y-3">
                    <div className="h-44 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-100">
                      <img src={t.image} alt={t.title} className="h-full object-contain" />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="mono text-xs font-bold text-indigo-600">{t.adCode}</span>
                      <PillBadge color={t.expectedStatus === 'PASS' ? 'emerald' : 'rose'}>Expected: {t.expectedStatus}</PillBadge>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{t.title}</h3>
                      <p className="mono text-[10px] text-slate-400">{t.sku}</p>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{t.expectedIssue}</p>
                  </div>

                  <button
                    onClick={() => launchTest(t)}
                    className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    Run Live Audit →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* ════════════════════════════════════════════════════════
          IMAGE ZOOM MODAL
          ════════════════════════════════════════════════════════ */}
      {zoomed && preview && (
        <div
          onClick={() => setZoomed(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setZoomed(false)}
              className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center shadow-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={preview} alt="Enlarged creative" className="max-h-[85vh] w-auto rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          EXPORT REPORT MODAL
          ════════════════════════════════════════════════════════ */}
      {exportOpen && result && (
        <div
          onClick={() => setExportOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Audit Compliance Report</h3>
                <p className="text-xs text-slate-400">Signed evaluation for SKU {product.sku}</p>
              </div>
              <button onClick={() => setExportOpen(false)} className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              rows={12}
              value={`# INTEGRIX AI COMPLIANCE AUDIT
Product SKU: ${product.sku} (${product.name})
Audit Date: ${new Date().toLocaleDateString('en-IN')}
Status: ${result.status} | Score: ${result.complianceScore}/100

## Verdict
${result.headlineVerdict}
${result.summary}

## Identified Breaches (${result.faults.length})
${result.faults.map((f, i) => `### #${i + 1} ${f.title} [${f.severity}]
- Observed: "${f.observedText}"
- Standard: ${f.approvedStandard}
- Fix Recommendation: ${f.doThisInstead}`).join('\n\n')}

## Approved Auto-Fix Copy
- Headline: ${result.autoFixSuggestions.suggestedHeadline}
- Body: ${result.autoFixSuggestions.suggestedBodyCopy}
- Disclaimer: ${result.autoFixSuggestions.suggestedDisclaimer}
`}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl mono text-xs text-slate-700 resize-none outline-none leading-relaxed"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setExportOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const el = document.querySelector('textarea[readonly]') as HTMLTextAreaElement;
                  if (el) cp(el.value, 'export-btn');
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                {copied === 'export-btn' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy Markdown</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;

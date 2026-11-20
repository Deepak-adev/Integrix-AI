import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  AlertCircle,
  Tag,
  Hash,
  Send,
  RotateCcw,
  Info,
} from 'lucide-react';
import { analyzeText, ApiError } from '../services/api';
import { AuditResult } from '../types';
import { AuditResultView } from './AuditResultView';

const DABUR_SAMPLES = [
  {
    label: 'Compliant Ad (Dabur Amla Hair Oil)',
    text: 'Dabur Amla Hair Oil (DAB-AML-001)\n10X Stronger Hair with Pure Amla extract.\nClinically tested natural nourishment for healthy roots.\n₹180 for 275 ml\n*Based on accredited lab study vs non-conditioning oil.',
    sku: 'DAB-AML-001',
  },
  {
    label: 'Exaggerated Multiplier Violation (50X Claim)',
    text: 'Dabur Amla Hair Oil (DAB-AML-001)\nRevolutionary New Ayurvedic Formula!\nMakes hair 50X stronger and stops 100% hair fall in 7 days!\nOnly ₹180\nOrder online now.',
    sku: 'DAB-AML-001',
  },
  {
    label: 'Misleading Hydration Duration (120-Hour Claim)',
    text: 'Dabur Gulabari Moisturising Cream (DAB-GUL-002)\n120 Hours of continuous deep hydration!\nEnriched with 100% pure rose water\nPrice: ₹49',
    sku: 'DAB-GUL-002',
  },
  {
    label: 'Absolute Pest Eradication Violation (100% Kill)',
    text: 'Odomos Liquid Vaporiser (DAB-ODM-003)\n100% KILLS MOSQUITOES ALL NIGHT!\nZero bites guaranteed for the entire family.\nPrice: ₹85',
    sku: 'DAB-ODM-003',
  },
];

const NOVAWEAR_SAMPLES = [
  {
    label: 'Compliant Ad (Classic Cotton Shirt)',
    text: 'NOVAWEAR\nEveryday, made easy.\nClassic Cotton Shirt (NW-CS-001)\n100% cotton\nRegular fit with a single chest pocket.\n₹1,299\nShop online now.',
    sku: 'NW-CS-001',
  },
  {
    label: 'Price Mismatch (Deliberate Violation)',
    text: 'NOVAWEAR Exclusive Promotion\nClassic Cotton Shirt (NW-CS-001)\n100% cotton\nWas ₹1,299, Now ₹999 on 2026-11-13\nLimited time discount.',
    sku: 'NW-CS-001',
  },
  {
    label: 'Composition Mismatch (Blend to 100% claim)',
    text: 'Everyday Oxford Shirt (NW-CS-002)\n100% COTTON luxury finish\nPrice: ₹1,199\nOrder yours today.',
    sku: 'NW-CS-002',
  },
  {
    label: 'Delivery Promise Guarantee',
    text: 'NOVAWEAR EXPRESS\nShop premium apparel today.\nDELIVERED TOMORROW. GUARANTEED.\nValid nationwide.',
    sku: '',
  },
];

interface TextAuditPageProps {
  organisation?: string;
  activeOrg?: any;
}

export const TextAuditPage: React.FC<TextAuditPageProps> = ({
  organisation: propOrg,
  activeOrg,
}) => {
  const organisation = propOrg || activeOrg?.name || 'Dabur';
  const isDabur = organisation.toLowerCase().includes('dabur');
  const presetSamples = isDabur ? DABUR_SAMPLES : NOVAWEAR_SAMPLES;
  const defaultSku = isDabur ? 'DAB-AML-001' : 'NW-CS-001';

  const [text, setText] = useState('');
  const [sku, setSku] = useState(defaultSku);
  const [submissionId, setSubmissionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  const charCount = text.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setErrorMessage('Please enter advertisement text content to verify.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAuditResult(null);

    const metadata: any = {
      organisation,
      sku: sku.trim() || undefined,
      publicationChannel: `${organisation} website`,
      publicationDate: '2026-11-13',
    };
    if (submissionId.trim()) {
      metadata.submissionId = submissionId.trim();
    }

    try {
      const result = await analyzeText(text, metadata);
      setAuditResult(result);
      try {
        const targetOrgKey = organisation.toLowerCase().includes('dabur') ? 'org-dabur' : 'org-novawear';
        localStorage.setItem(`integrix_last_audit_${targetOrgKey}`, JSON.stringify({
          timestamp: Date.now(),
          status: 'COMPLETED',
          submissionId: result.submissionId,
          verdict: result.overallStatus,
          findingsCount: result.findings?.length || 0
        }));
      } catch {}
    } catch (err: any) {
      console.error('[TextAudit] Audit submission error:', err);
      if (err instanceof ApiError && err.status === 409) {
        setErrorMessage(
          'Submission Conflict (HTTP 409): A submission with this ID already exists with different text content. Please provide a new submission ID or retry with identical content.'
        );
      } else {
        setErrorMessage(err.message || 'An error occurred while evaluating advertisement text.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: { label: string; text: string; sku: string }) => {
    setText(preset.text);
    setSku(preset.sku || '');
    setErrorMessage(null);
  };

  const handleReset = () => {
    setText('');
    setSubmissionId('');
    setErrorMessage(null);
    setAuditResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Text Audit</h2>
        <p className="text-xs text-slate-500 mt-1">
          Directly verify marketing copy, headlines, product claims, or promotional blurbs against brand policies.
        </p>
      </div>

      {auditResult ? (
        <AuditResultView result={auditResult} onNewAudit={handleReset} />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-800 leading-relaxed font-medium">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Quick Presets Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Sample Presets:
            </span>
            {presetSamples.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200/80 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Main Text Editor Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                Advertisement Content
              </label>
              <span className="text-xs font-mono text-slate-400">
                {charCount} characters
              </span>
            </div>

            <textarea
              rows={8}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or write advertisement body copy, headlines, disclaimers, or campaign pricing statements here..."
              className="w-full p-4 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />

            {/* Optional Metadata Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Target SKU (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. NW-CS-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  Submission ID (Optional, for idempotent retries)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SUB-CUSTOM-001"
                  value={submissionId}
                  onChange={(e) => setSubmissionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Form</span>
            </button>

            <button
              type="submit"
              disabled={!text.trim() || isLoading}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                !text.trim() || isLoading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20 cursor-pointer'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Evaluating against repository...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Audit</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

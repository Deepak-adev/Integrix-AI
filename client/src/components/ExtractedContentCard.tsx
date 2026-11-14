import React, { useState } from 'react';
import { FileText, Cpu, CheckCircle, Tag, DollarSign, Shirt, Truck, Flame, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { ExtractedAdContent } from '../types';

interface ExtractedContentCardProps {
  content: ExtractedAdContent;
}

export const ExtractedContentCard: React.FC<ExtractedContentCardProps> = ({ content }) => {
  const [showRawText, setShowRawText] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-navy">Extracted Advertisement Content</h3>
            <p className="text-xs text-slate-500">Automated multi-modal entity extraction & claim detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-500" />
            <span>Method: {content.extractionMethod}</span>
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
            Confidence: {(content.confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Entity Chips Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span>Identified SKU & Product</span>
          </div>
          <div className="font-mono font-bold text-xs text-slate-800">
            {content.detectedSku || 'None detected'}
          </div>
          <div className="text-xs text-slate-600 font-medium mt-0.5 truncate">
            {content.detectedProducts.join(', ') || 'General advertisement'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
            <span>Advertised Price</span>
          </div>
          <div className="font-bold text-sm text-emerald-700">
            {content.advertisedPriceFormatted || (content.detectedPrice ? `₹${content.detectedPrice}` : 'No price stated')}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {content.campaignReferences.length > 0 ? `Campaign: ${content.campaignReferences.join(', ')}` : 'Regular listing'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <Shirt className="w-3.5 h-3.5 text-slate-400" />
            <span>Fabric & Fit Specification</span>
          </div>
          <div className="font-semibold text-xs text-slate-800">
            {content.detectedComposition || 'No composition claim'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {content.detectedFit || 'Fit not specified'}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Claims & Promises</span>
          </div>
          <div className="text-xs font-semibold text-amber-800 truncate">
            {content.performanceClaims.length > 0 ? content.performanceClaims.join(', ') : 'None'}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {content.deliveryStatements.length > 0 ? content.deliveryStatements[0] : 'Standard dispatch'}
          </div>
        </div>
      </div>

      {/* Raw Extracted Text Toggle */}
      <div className="pt-3 border-t border-slate-100">
        <button
          onClick={() => setShowRawText(!showRawText)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-brand-navy transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-sky-600" />
          <span>{showRawText ? 'Hide Raw Extracted Text' : 'View Raw Extracted Text'}</span>
          {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showRawText && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border border-slate-800 shadow-inner">
            {content.rawText || 'No text extracted.'}
          </div>
        )}
      </div>
    </div>
  );
};


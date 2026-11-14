import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, FileText, CheckCircle } from 'lucide-react';

export const DiscrepancyNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 shadow-sm text-xs text-amber-900 mb-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 font-semibold text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>Notice on Reference Document Discrepancy (Preserved & Evaluated)</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-amber-800 hover:text-amber-950 font-medium px-2 py-0.5 rounded hover:bg-amber-100/60 transition-colors"
        >
          <span>{isOpen ? 'Hide Mapping' : 'View Mapping'}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      <p className="mt-1 text-amber-800/90 leading-relaxed">
        The supplied <strong>NOVAWEAR Sample Advertisement Test Pack (PDF)</strong> and <strong>Expected Audit Results (DOCX)</strong> contain differences in advertisement ID assignments. Integrix AI preserves both ID conventions without hardcoding, mapping both for transparent verification against the live brand repository.
      </p>

      {isOpen && (
        <div className="mt-3.5 pt-3 border-t border-amber-200/60 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-amber-100/50 text-amber-950 font-semibold border-b border-amber-200">
                <th className="py-1.5 px-2.5">Scenario / Test Case</th>
                <th className="py-1.5 px-2.5">Test Pack ID (PDF)</th>
                <th className="py-1.5 px-2.5">Expected Results ID (DOCX)</th>
                <th className="py-1.5 px-2.5">Target SKU</th>
                <th className="py-1.5 px-2.5">Primary Rule</th>
                <th className="py-1.5 px-2.5">Oracle Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-200/50">
              <tr>
                <td className="py-1.5 px-2.5 font-medium">1. Compliant product ad</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-001</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-007</td>
                <td className="py-1.5 px-2.5 font-mono">NW-CS-001</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-001</td>
                <td className="py-1.5 px-2.5 text-emerald-700 font-semibold">PASS</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">2. Price mismatch (₹999 vs ₹1,299)</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-002</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-001</td>
                <td className="py-1.5 px-2.5 font-mono">NW-CS-001</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-002</td>
                <td className="py-1.5 px-2.5 text-rose-700 font-semibold">FAIL</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">3. Fabric composition mismatch</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-003</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-002</td>
                <td className="py-1.5 px-2.5 font-mono">NW-CS-002</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-001</td>
                <td className="py-1.5 px-2.5 text-rose-700 font-semibold">FAIL</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">4. Approved campaign with conditions</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-004</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-003</td>
                <td className="py-1.5 px-2.5 font-mono">NW-TS-003</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-002</td>
                <td className="py-1.5 px-2.5 text-emerald-700 font-semibold">PASS</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">5. Pending campaign price</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-005</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-004</td>
                <td className="py-1.5 px-2.5 font-mono">NW-TR-005</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-002</td>
                <td className="py-1.5 px-2.5 text-rose-700 font-semibold">FAIL</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">6. Unsupported wrinkle-proof claim</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-006</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-005</td>
                <td className="py-1.5 px-2.5 font-mono">NW-CS-001</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-003</td>
                <td className="py-1.5 px-2.5 text-amber-700 font-semibold">NEEDS_VERIFICATION</td>
              </tr>
              <tr>
                <td className="py-1.5 px-2.5 font-medium">7. Guaranteed next-day delivery claim</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-007</td>
                <td className="py-1.5 px-2.5 font-mono">AD-NW-006</td>
                <td className="py-1.5 px-2.5 font-mono">General</td>
                <td className="py-1.5 px-2.5 font-mono">NW-RULE-004</td>
                <td className="py-1.5 px-2.5 text-rose-700 font-semibold">FAIL</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


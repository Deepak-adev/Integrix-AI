import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Shield,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Edit2,
  X,
  Check,
  Building2,
  Cpu,
} from 'lucide-react';
import {
  PolicyIntelligenceFinding,
  getStagedPolicyRecommendations,
  formallyApprovePolicyRule,
} from '../services/policyIntelligenceService';
import { Organisation, PolicyRuleItem } from '../types';
import { saveStoredRulesForOrg, getStoredRulesForOrg } from '../services/governanceStorage';

interface ApprovalCentrePageProps {
  activeOrg?: Organisation;
  onRuleActivated?: (newRule: PolicyRuleItem) => void;
  onNavigateStudio?: () => void;
}

export const ApprovalCentrePage: React.FC<ApprovalCentrePageProps> = ({
  activeOrg,
  onRuleActivated,
  onNavigateStudio,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stagedFindings, setStagedFindings] = useState<PolicyIntelligenceFinding[]>([]);
  const [selectedFinding, setSelectedFinding] = useState<PolicyIntelligenceFinding | null>(null);
  const [activeTab, setActiveTab] = useState<'staged-policies' | 'creatives'>('staged-policies');

  // Approval / Rejection Action State
  const [actionModalOpen, setActionModalOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [adminComments, setAdminComments] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadStaged = async () => {
    setLoading(true);
    try {
      const data = await getStagedPolicyRecommendations();
      setStagedFindings(data.stagedFindings || []);
      if (data.stagedFindings && data.stagedFindings.length > 0 && !selectedFinding) {
        setSelectedFinding(data.stagedFindings[0]);
      }
    } catch (err: any) {
      console.warn('[ApprovalCentrePage] Failed to fetch staged findings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaged();
  }, []);

  const handleOpenActionModal = (type: 'APPROVE' | 'REJECT', finding: PolicyIntelligenceFinding) => {
    setSelectedFinding(finding);
    setActionType(type);
    setAdminComments('');
    setRejectionReason('');
    setActionModalOpen(true);
    setToastMessage(null);
  };

  const handleConfirmDecision = async () => {
    if (!selectedFinding) return;

    if (actionType === 'REJECT' && !rejectionReason.trim() && !adminComments.trim()) {
      alert('Mandatory justification is required to formally reject a staged policy recommendation.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await formallyApprovePolicyRule(selectedFinding.findingId, {
        action: actionType,
        adminName: 'Lead Compliance Administrator',
        adminRole: 'CHIEF_GOVERNANCE_OFFICER',
        comments: adminComments.trim() || undefined,
        rejectionReason: actionType === 'REJECT' ? (rejectionReason.trim() || adminComments.trim()) : undefined,
      });

      // If approved, integrate into active rulebook storage
      if (actionType === 'APPROVE') {
        const orgId = activeOrg?.id || 'org-novawear';
        const currentRules = getStoredRulesForOrg(orgId);
        const ruleId = result.rule?.ruleId || selectedFinding.proposedDraftRuleId || `NW-RULE-PI-${Date.now().toString(36).toUpperCase()}`;

        const newRuleItem: PolicyRuleItem = {
          id: ruleId,
          title: selectedFinding.title,
          cat: selectedFinding.category === 'CONFLICT' ? 'Commercial' : selectedFinding.category === 'AMBIGUITY' ? 'Editorial' : 'Product',
          desc: selectedFinding.recommendedWording || selectedFinding.explanation,
          bad: selectedFinding.existingWording || 'Contradictory or unapproved claim',
          good: selectedFinding.recommendedWording || 'Adhere strictly to canonical brand guidelines',
          severity: selectedFinding.severity === 'HIGH' ? 'CRITICAL' : selectedFinding.severity === 'LOW' ? 'TIP' : 'WARNING',
          isActive: true,
          authoritySourceId: selectedFinding.sourceDocumentName || 'SRC-NW-003',
          sourceLocator: selectedFinding.sourceLocator || 'Policy Intelligence Certification',
        };

        const existingIdx = currentRules.findIndex(r => r.id === ruleId);
        let updatedRules: PolicyRuleItem[];
        if (existingIdx >= 0) {
          updatedRules = currentRules.map(r => r.id === ruleId ? newRuleItem : r);
        } else {
          updatedRules = [newRuleItem, ...currentRules];
        }

        saveStoredRulesForOrg(orgId, updatedRules);
        if (onRuleActivated) {
          onRuleActivated(newRuleItem);
        }
      }

      // Remove from staged list
      setStagedFindings(prev => prev.filter(f => f.findingId !== selectedFinding.findingId));
      setSelectedFinding(null);
      setActionModalOpen(false);

      setToastMessage({
        type: 'success',
        text: result.message,
      });
    } catch (err: any) {
      alert(`Approval error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold mb-1">
            <Shield className="w-3 h-3" />
            <span>Formal Governance Sign-off & Policy Rulebook Certification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Administrator Approval Centre
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Authorize staged policy harmonizations, resolve regulatory gaps, and compile certified rulebooks into live enforcement engines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateStudio && (
            <button
              onClick={onNavigateStudio}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Policy Intelligence Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Notification Banner ── */}
      {toastMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Tabs: Staged Policy Recommendations vs Ad Review Queue ── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('staged-policies')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'staged-policies'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Staged Policy Recommendations ({stagedFindings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('creatives')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'creatives'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Creative Claims Queue (0)</span>
        </button>
      </div>

      {/* ── TAB 1: STAGED POLICY RECOMMENDATIONS APPROVAL QUEUE ── */}
      {activeTab === 'staged-policies' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-4 shadow-sm flex items-start gap-3">
            <Shield className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-slate-700">
              <strong className="font-bold text-indigo-950 block">
                Human-in-the-Loop Governance Guardrail:
              </strong>
              <p>
                The items below were synthesised by the Policy Intelligence Agent and accepted/edited in the Studio. They remain <strong>STAGED & NON-EXECUTABLE</strong> until you grant formal sign-off. Approving a recommendation compiles it into the active rulebook ({activeOrg?.name || 'NOVAWEAR'} v1.0-certified).
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
              <span>Scanning staged recommendation queue...</span>
            </div>
          ) : stagedFindings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Staged Recommendation Queue Clear</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                There are currently no AI-synthesised policy amendments awaiting executive sign-off. Run a scan in the Policy Intelligence Studio to analyze fresh brand documents.
              </p>
              {onNavigateStudio && (
                <button
                  onClick={onNavigateStudio}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Launch Policy Intelligence Studio</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[500px]">
              {/* Left Column: Staged Queue List */}
              <div className="lg:col-span-5 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Staged Awaiting Final Sign-Off ({stagedFindings.length})
                </div>

                {stagedFindings.map(item => {
                  const isSelected = selectedFinding?.findingId === item.findingId;
                  const isEdited = item.status === 'EDITED';

                  return (
                    <div
                      key={item.findingId}
                      onClick={() => setSelectedFinding(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-600 shadow-md ring-2 ring-indigo-500/10'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isEdited ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">
                              Admin Edited
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">
                              Agent Accepted
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {item.severity}
                          </span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.recommendedWording || item.explanation}
                      </p>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[180px] font-medium">{item.affectedPolicyOrDoc}</span>
                        <span className="font-mono text-indigo-600 font-bold">Rule: {item.proposedDraftRuleId || 'Draft'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Formal Sign-off Workbench */}
              <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                {selectedFinding ? (
                  <>
                    <div className="space-y-2 pb-4 border-b border-slate-100">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-400">{selectedFinding.findingId}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                            Origin: Policy Intelligence Agent
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white uppercase tracking-wider">
                          Staged for Formal Sign-off
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                        {selectedFinding.title}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {selectedFinding.explanation}
                      </p>
                    </div>

                    {/* Ground-Truth Evidence Citation */}
                    <div className="space-y-1.5 bg-slate-900 text-slate-100 p-4 rounded-xl text-xs border border-slate-800">
                      <div className="flex items-center justify-between text-[10px] text-sky-400 font-mono">
                        <span>Source: {selectedFinding.sourceDocumentName}</span>
                        <span>Locator: {selectedFinding.sourceLocator}</span>
                      </div>
                      <div className="pt-1 space-y-1">
                        {selectedFinding.evidenceExcerpts && selectedFinding.evidenceExcerpts.length > 0 ? (
                          selectedFinding.evidenceExcerpts.map((ex, i) => (
                            <div key={i} className="p-2 bg-slate-800 rounded font-mono text-[11px] text-slate-200 border border-slate-700">
                              "{ex}"
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-400 italic">No exact excerpts extracted.</div>
                        )}
                      </div>
                    </div>

                    {/* Recommended Policy Formulation */}
                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          Proposed Rulebook Policy Formulation:
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold">
                          Assigned ID: {selectedFinding.proposedDraftRuleId || 'Pending'}
                        </span>
                      </div>
                      <p className="text-emerald-950 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-emerald-100">
                        {selectedFinding.recommendedWording || 'No amendment text provided.'}
                      </p>
                      {selectedFinding.rationale && (
                        <p className="text-[11px] text-emerald-800/80 italic pt-1">
                          <strong>Regulatory Rationale:</strong> {selectedFinding.rationale}
                        </p>
                      )}
                    </div>

                    {/* Formal Approval Decision Controls */}
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Executive Governance Action:</span>
                        <span className="text-[10px] text-slate-400 font-mono">Traceable Audit Timestamp Logged</span>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <button
                          onClick={() => handleOpenActionModal('APPROVE', selectedFinding)}
                          className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Certify & Activate in Rulebook</span>
                        </button>

                        <button
                          onClick={() => handleOpenActionModal('REJECT', selectedFinding)}
                          className="w-full sm:w-auto py-3 px-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Reject from Rulebook</span>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-xs text-slate-400">
                    Select a staged recommendation to inspect its ground-truth evidence and grant executive certification.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ADVERTISEMENT CLAIMS QUEUE (EXISTING WORKFLOW) ── */}
      {activeTab === 'creatives' && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Advertisement Review Queue Clear</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All recent creative audit submissions have completed deterministic verification. No ad-hoc commercial waivers currently pending.
          </p>
        </div>
      )}

      {/* ── FORMAL APPROVAL / REJECTION CONFIRMATION MODAL ── */}
      {actionModalOpen && selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl ${actionType === 'APPROVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {actionType === 'APPROVE' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {actionType === 'APPROVE' ? 'Certify Policy Rule in Rulebook' : 'Formally Reject Policy Recommendation'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Target: {selectedFinding.proposedDraftRuleId || selectedFinding.findingId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionType === 'APPROVE' ? (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1">
                <strong>Rulebook Activation:</strong>
                <p>
                  Approving this recommendation converts it into an active, enforceable policy rule in the live {activeOrg?.name || 'NOVAWEAR'} Rulebook (v1.0-certified). Future advertisement audits will immediately evaluate against this constraint.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-rose-800">
                  Mandatory Rejection Rationale:
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Specify legal counsel reason or operational rationale why this rule is dismissed..."
                  className="w-full text-xs p-3 border border-rose-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-800 bg-rose-50/20"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Administrator Audit Sign-off Comments:
              </label>
              <textarea
                rows={2}
                value={adminComments}
                onChange={e => setAdminComments(e.target.value)}
                placeholder="Optional compliance log remark for audit record..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setActionModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDecision}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 ${
                  actionType === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Recording Certification...' : actionType === 'APPROVE' ? 'Certify & Activate Rule' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

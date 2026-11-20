export interface PolicyIntelligenceFinding {
  findingId: string;
  category: 'CONFLICT' | 'AMBIGUITY' | 'MISSING_REQUIREMENT' | 'DUPLICATION';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EDITED' | 'DEFERRED';
  title: string;
  explanation: string;
  affectedPolicyOrDoc: string;
  sourceDocumentName: string;
  sourceLocator: string;
  evidenceExcerpts: string[];
  existingWording?: string;
  recommendedWording?: string;
  rationale?: string;
  confidence: number;
  isNeedsVerification: boolean;
  proposedDraftRuleId?: string;
  metadata?: Record<string, any>;
  reviews?: PolicyFindingReview[];
}

export interface PolicyFindingReview {
  reviewId?: string;
  action: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EDITED' | 'DEFERRED';
  reviewerName?: string;
  reviewerRole?: string;
  adminComments?: string;
  rejectionReason?: string;
  modifiedWording?: string;
  stagedRuleId?: string;
  stagedDraftId?: string;
  reviewedAt: string;
}

export interface PolicyAnalysisRun {
  runId: string;
  title: string;
  scope: 'ALL' | 'ACTIVE_RULES' | 'SOURCES' | 'DRAFTS';
  status: string;
  aiProvider: string;
  aiModel: string;
  isAiEnhanced?: boolean;
  summary: string;
  totalFindings: number;
  conflictsCount: number;
  ambiguitiesCount: number;
  missingCount: number;
  duplicatesCount: number;
  pendingReviewCount: number;
  completedAt?: string;
  createdAt?: string;
  findings?: PolicyIntelligenceFinding[];
}

export interface PolicyRunsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  runs: PolicyAnalysisRun[];
}

export interface PolicyFindingsResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  findings: PolicyIntelligenceFinding[];
}

export interface ReviewFindingPayload {
  action: 'ACCEPT' | 'REJECT' | 'EDIT' | 'DEFER';
  reviewerName?: string;
  reviewerRole?: string;
  adminComments?: string;
  rejectionReason?: string;
  modifiedWording?: string;
  stagedRuleId?: string;
  stagedDraftId?: string;
}

const API_BASE = '/api/policy-intelligence';

export async function runPolicyAnalysis(
  scope: 'ALL' | 'ACTIVE_RULES' | 'SOURCES' | 'DRAFTS' = 'ALL'
): Promise<PolicyAnalysisRun> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Policy analysis failed');
  }

  return res.json();
}

export async function getPolicyRuns(page = 1, limit = 20): Promise<PolicyRunsResponse> {
  const res = await fetch(`${API_BASE}/runs?page=${page}&limit=${limit}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to fetch analysis runs');
  }
  return res.json();
}

export async function getPolicyRunById(runId: string): Promise<PolicyAnalysisRun> {
  const res = await fetch(`${API_BASE}/runs/${encodeURIComponent(runId)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to fetch analysis run details');
  }
  return res.json();
}

export async function getPolicyFindings(filters?: {
  category?: string;
  severity?: string;
  status?: string;
  runId?: string;
  page?: number;
  limit?: number;
}): Promise<PolicyFindingsResponse> {
  const params = new URLSearchParams();
  if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
  if (filters?.severity && filters.severity !== 'ALL') params.set('severity', filters.severity);
  if (filters?.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters?.runId) params.set('runId', filters.runId);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));

  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/findings${qs}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to fetch policy findings');
  }
  return res.json();
}

export async function submitFindingReview(
  findingId: string,
  payload: ReviewFindingPayload
): Promise<{
  message: string;
  status: string;
  finding: PolicyIntelligenceFinding;
  review: PolicyFindingReview;
  isStagedForApproval: boolean;
}> {
  const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(findingId)}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to record review action');
  }
  return res.json();
}

export async function getStagedPolicyRecommendations(): Promise<{
  total: number;
  stagedFindings: PolicyIntelligenceFinding[];
}> {
  const res = await fetch(`${API_BASE}/staged`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to fetch staged policy recommendations');
  }
  return res.json();
}

export async function formallyApprovePolicyRule(
  findingId: string,
  payload: {
    action: 'APPROVE' | 'REJECT';
    adminName?: string;
    adminRole?: string;
    comments?: string;
    rejectionReason?: string;
  }
): Promise<{
  message: string;
  action: 'APPROVE' | 'REJECT';
  finding: PolicyIntelligenceFinding;
  rule?: any;
  review: PolicyFindingReview;
  rulebookVersion?: string;
}> {
  const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(findingId)}/approve-rule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || err.message || 'Failed to formally certify rule');
  }
  return res.json();
}

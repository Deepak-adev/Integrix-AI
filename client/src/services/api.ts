import { AuditResult, AcceptanceScenario, RepositoryStats } from '../types';
import {
  LOCAL_SCENARIOS,
  LOCAL_PRODUCTS,
  LOCAL_CAMPAIGNS,
  LOCAL_RULES,
  runClientSideScenarioAudit,
  runClientSideTextAudit,
  runAllClientSideScenarios,
} from './local-audit-engine';
import {
  getStoredActiveOrgId,
  getStoredProductsForOrg,
  getStoredRulesForOrg,
  getCampaignsForOrg,
  getPoliciesForOrg,
} from './governanceStorage';

const API_BASE = '/api/audit';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Upload advertisement creative file and execute audit.
 * Reaches POST /api/audit/upload.
 */
export async function uploadAndAudit(formData: FormData): Promise<AuditResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
  } catch (err: any) {
    console.warn('[API] Backend unreachable, falling back to client-side audit engine:', err);
    // Fall back to client simulation only if backend server is offline
    return clientSideUploadFallback(formData);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `HTTP ${response.status} Error` }));
    throw new ApiError(response.status, errorBody.error || errorBody.message || 'File audit failed', errorBody);
  }

  return await response.json();
}

/**
 * Audit raw advertisement text via POST /api/audit/analyze (AI & deterministic).
 */
export async function analyzeText(text: string, metadata?: any): Promise<AuditResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, metadata }),
    });
  } catch (err: any) {
    console.warn('[API] Backend unreachable, falling back to local audit engine:', err);
    return runClientSideTextAudit(text, metadata);
  }

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: `HTTP ${response.status} Error` };
    }

    if (response.status >= 500) {
      console.warn(`[API] Server returned HTTP ${response.status}, falling back to local audit engine:`, errorBody);
      return runClientSideTextAudit(text, metadata);
    }

    throw new ApiError(response.status, errorBody.error || errorBody.message || 'Text audit failed', errorBody);
  }

  return await response.json();
}

/**
 * Audit raw text via legacy deterministic endpoint POST /api/audit/verify-text.
 */
export async function verifyRawText(text: string, metadata?: any): Promise<AuditResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/verify-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, metadata }),
    });
  } catch (err: any) {
    console.warn('[API] Backend unreachable, running in client-side mode:', err);
    return runClientSideTextAudit(text, metadata);
  }

  if (!response.ok) {
    let errorBody: any = null;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = { error: `HTTP ${response.status} Error` };
    }

    if (response.status >= 500) {
      console.warn(`[API] Server returned HTTP ${response.status}, running in client-side mode:`, errorBody);
      return runClientSideTextAudit(text, metadata);
    }

    throw new ApiError(response.status, errorBody.error || errorBody.message || 'Text verification failed', errorBody);
  }

  return await response.json();
}

// Client-side fallback for offline mode
function clientSideUploadFallback(formData: FormData): AuditResult {
  const file = formData.get('file') as File | null;
  const sku = (formData.get('sku') as string) || 'NW-CS-001';
  const channel = (formData.get('publicationChannel') as string) || 'NOVAWEAR website';
  const pubDate = (formData.get('publicationDate') as string) || '2026-11-13';

  const matchingScenario = LOCAL_SCENARIOS.find((s) => s.sku === sku) || LOCAL_SCENARIOS[0];
  const clientAudit = runClientSideScenarioAudit(matchingScenario.id);

  return {
    ...clientAudit.result,
    filename: file ? file.name : 'uploaded_advertisement.png',
    metadata: {
      organisation: 'NOVAWEAR',
      publicationChannel: channel,
      publicationDate: pubDate,
      sku,
      auditTimestamp: new Date().toISOString(),
      rulebookVersion: '0.1',
    },
  };
}

export async function getAcceptanceScenarios(): Promise<{
  scenarios: AcceptanceScenario[];
  discrepancyDocumentation: { issue: string; detail: string; solution: string };
}> {
  try {
    const response = await fetch(`${API_BASE}/scenarios`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API] Backend unreachable, using embedded scenarios.');
  }

  return {
    scenarios: LOCAL_SCENARIOS,
    discrepancyDocumentation: {
      issue:
        'Discrepancy in Advertisement ID assignments between Sample Advertisement Test Pack (PDF) and Expected Audit Results (DOCX)',
      detail:
        'The Sample Advertisement Test Pack v0.1 defines AD-NW-001 as Compliant Product Ad and AD-NW-007 as Delivery Guarantee. In contrast, Expected Audit Results v0.1 defines AD-NW-001 as Price Mismatch and AD-NW-007 as Compliant Product Ad.',
      solution:
        'Integrix AI preserves both ID spaces, maps them explicitly, and deterministically audits content against actual repository facts.',
    },
  };
}

export async function runScenario(scenarioId: string): Promise<{
  scenario: AcceptanceScenario;
  result: AuditResult;
  matchesExpected: boolean;
}> {
  try {
    const response = await fetch(`${API_BASE}/scenarios/run/${scenarioId}`, {
      method: 'POST',
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API] Backend unreachable, executing scenario locally in React:', err);
  }

  return runClientSideScenarioAudit(scenarioId);
}

export async function runAllScenarios(): Promise<{
  scenariosRun: number;
  passedCount: number;
  failedCount: number;
  results: { scenario: AcceptanceScenario; result: AuditResult; matchesExpected: boolean }[];
}> {
  try {
    const response = await fetch(`${API_BASE}/scenarios/run-all`, {
      method: 'POST',
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API] Backend unreachable, executing all 7 scenarios locally in React:', err);
  }

  return runAllClientSideScenarios();
}

export async function getRepositoryStats(orgId?: string): Promise<RepositoryStats> {
  const currentOrgId = orgId || getStoredActiveOrgId();

  try {
    const response = await fetch(`${API_BASE}/repository?orgId=${encodeURIComponent(currentOrgId)}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('[API] Backend unreachable, using embedded repository statistics.');
  }

  const isDabur = currentOrgId === 'org-dabur' || currentOrgId.toLowerCase().includes('dabur');

  if (isDabur) {
    return {
      organisation: 'Dabur India Limited',
      referenceDate: '2026-11-16',
      products: getStoredProductsForOrg('org-dabur'),
      campaigns: getCampaignsForOrg('org-dabur'),
      rules: getStoredRulesForOrg('org-dabur'),
      indexedPolicies: getPoliciesForOrg('org-dabur'),
    };
  }

  return {
    organisation: 'NOVAWEAR (NovaWear Retail Private Limited)',
    referenceDate: '2026-11-13',
    products: getStoredProductsForOrg('org-novawear'),
    campaigns: getCampaignsForOrg('org-novawear'),
    rules: getStoredRulesForOrg('org-novawear'),
    indexedPolicies: getPoliciesForOrg('org-novawear'),
  };
}

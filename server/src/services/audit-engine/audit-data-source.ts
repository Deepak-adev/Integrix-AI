import type { OrganisationContext } from '../../types/index.js';
import {
  organisationDataProvider,
  type OrganisationDataProvider,
} from '../repositories/organisation-data.provider.js';
import type { OrganisationDataBundle } from '../repositories/organisation-data.types.js';
import type { PolicySourceRecord } from '../repositories/organisation-data.types.js';
import type { AuditDataSource, AuditDataSourceMode } from './audit-data-source.interface.js';
import { FileAuditDataSource } from './file-audit-data-source.js';

// Re-export the Prisma-free interface and the file implementation so existing
// importers of this module continue to work.
export type { AuditDataSource, AuditDataSourceMode } from './audit-data-source.interface.js';
export { FileAuditDataSource } from './file-audit-data-source.js';

interface PolicyPage { pageNum: number; text: string }

function normalizePages(pages: PolicySourceRecord['pages']): PolicyPage[] {
  if (!Array.isArray(pages)) return [];
  const out: PolicyPage[] = [];
  for (const item of pages as any[]) {
    if (item && typeof item.text === 'string') {
      out.push({ pageNum: typeof item.pageNum === 'number' ? item.pageNum : typeof item.num === 'number' ? item.num : 1, text: item.text });
    }
  }
  return out;
}

function toPolicyDocument(record: PolicySourceRecord) {
  return {
    filename: record.filename,
    pages: normalizePages(record.pages),
    fullText: record.extractedText ?? '',
  };
}

function searchRecordText(record: PolicySourceRecord, terms: string[]): { excerpt: string; pageNumber: number } | null {
  const pages = normalizePages(record.pages);
  const fullText = record.extractedText ?? '';
  for (const page of pages) {
    const lower = page.text.toLowerCase();
    for (const term of terms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 100);
        const end = Math.min(page.text.length, idx + 200);
        return { excerpt: page.text.substring(start, end).replace(/\s+/g, ' ').trim(), pageNumber: page.pageNum };
      }
    }
  }
  if (fullText) {
    const lower = fullText.toLowerCase();
    for (const term of terms) {
      const idx = lower.indexOf(term.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx - 100);
        const end = Math.min(fullText.length, idx + 200);
        return { excerpt: fullText.substring(start, end).replace(/\s+/g, ' ').trim(), pageNumber: 1 };
      }
    }
  }
  return null;
}

/**
 * Database-backed audit data source.
 *
 * Fetches the organisation bundle once during initialize() and serves
 * synchronous getters thereafter. Only lifecycle-eligible (ACTIVE) rules are
 * exposed via getRule/getAllRules; DRAFT rules are never surfaced as
 * executable. Retrieval errors propagate (fail closed).
 */
export class DatabaseAuditDataSource implements AuditDataSource {
  private bundle: OrganisationDataBundle | null = null;

  constructor(
    private readonly context: OrganisationContext,
    private readonly provider: OrganisationDataProvider = organisationDataProvider
  ) {}

  async initialize(): Promise<void> {
    this.bundle = await this.provider.getBundle(this.context);
  }

  private requireBundle(): OrganisationDataBundle {
    if (!this.bundle) throw new Error('DatabaseAuditDataSource is not initialized.');
    return this.bundle;
  }

  getProductBySku(sku: string) { return this.requireBundle().products.find((p) => p.sku === sku); }
  getAllProducts() { return this.requireBundle().products; }
  getCampaignById(campaignId: string) { return this.requireBundle().campaigns.find((c) => c.campaignId === campaignId); }
  getCampaignsForSku(sku: string) {
    const target = sku.trim().toUpperCase();
    return this.requireBundle().campaigns.filter((c) => c.sku.toUpperCase() === target);
  }
  getAllCampaigns() { return this.requireBundle().campaigns; }
  getRule(ruleId: string) { return this.requireBundle().executableRules.find((r) => r.ruleId === ruleId); }
  getAllRules() { return this.requireBundle().executableRules; }

  getPolicyDocument(sourceId: string) {
    const record = this.requireBundle().policySources.find((s) => s.sourceId === sourceId);
    return record ? toPolicyDocument(record) : undefined;
  }

  searchPolicyText(sourceId: string, searchTerms: string[]) {
    const record = this.requireBundle().policySources.find((s) => s.sourceId === sourceId);
    return record ? searchRecordText(record, searchTerms) : null;
  }
}

export interface CreateAuditDataSourceOptions {
  mode: AuditDataSourceMode;
  /** Required for database mode; ignored for file mode. */
  context?: OrganisationContext | null;
  /** Optional provider override (tests). */
  provider?: OrganisationDataProvider;
}

/**
 * Explicitly create an audit data source. There is no silent fallback: the
 * caller must choose the mode, and database mode requires a trusted context.
 */
export async function createAuditDataSource(options: CreateAuditDataSourceOptions): Promise<AuditDataSource> {
  if (options.mode === 'file') {
    const source = new FileAuditDataSource();
    await source.initialize();
    return source;
  }
  if (options.mode === 'database') {
    if (!options.context) {
      throw new Error('An OrganisationContext is required for database audit data source.');
    }
    const source = new DatabaseAuditDataSource(options.context, options.provider ?? organisationDataProvider);
    await source.initialize();
    return source;
  }
  throw new Error(`Unknown audit data source mode: ${String(options.mode)}`);
}

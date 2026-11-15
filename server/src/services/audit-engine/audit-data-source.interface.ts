import type {
  CampaignFact,
  PolicyRuleDefinition,
  ProductFact,
} from '../../types/index.js';

/**
 * Audit data-source boundary (Prisma-free, Express-free).
 *
 * The audit pipeline consumes repository data through this interface so the
 * underlying source (file-based loader vs database-backed provider) can be
 * selected explicitly. This module intentionally imports ONLY domain types so
 * that the audit engine can depend on it without pulling in Prisma or Express.
 */
export interface AuditDataSource {
  initialize(): Promise<void>;
  getProductBySku(sku: string): ProductFact | undefined;
  getAllProducts(): ProductFact[];
  getCampaignById(campaignId: string): CampaignFact | undefined;
  getCampaignsForSku(sku: string): CampaignFact[];
  getAllCampaigns(): CampaignFact[];
  getRule(ruleId: string): PolicyRuleDefinition | undefined;
  getAllRules(): PolicyRuleDefinition[];
  getPolicyDocument(sourceId: string): { filename: string; pages: { pageNum: number; text: string }[]; fullText: string } | undefined;
  searchPolicyText(sourceId: string, searchTerms: string[]): { excerpt: string; pageNumber: number } | null;
}

export type AuditDataSourceMode = 'file' | 'database';

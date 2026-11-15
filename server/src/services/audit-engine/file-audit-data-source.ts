import type { AuditDataSource } from './audit-data-source.interface.js';
import { repositoryLoader } from '../ingestion/repository-loader.js';

/**
 * Compatibility path: delegates to the existing file-based repository loader.
 * This is the default audit data source and preserves current behaviour.
 */
export class FileAuditDataSource implements AuditDataSource {
  async initialize(): Promise<void> {
    await repositoryLoader.initialize();
  }
  getProductBySku(sku: string) { return repositoryLoader.getProductBySku(sku); }
  getAllProducts() { return repositoryLoader.getAllProducts(); }
  getCampaignById(campaignId: string) { return repositoryLoader.getCampaignById(campaignId); }
  getCampaignsForSku(sku: string) { return repositoryLoader.getCampaignsForSku(sku); }
  getAllCampaigns() { return repositoryLoader.getAllCampaigns(); }
  getRule(ruleId: string) { return repositoryLoader.getRule(ruleId); }
  getAllRules() { return repositoryLoader.getAllRules(); }
  getPolicyDocument(sourceId: string) { return repositoryLoader.getPolicyDocument(sourceId); }
  searchPolicyText(sourceId: string, terms: string[]) { return repositoryLoader.searchPolicyText(sourceId, terms); }
}

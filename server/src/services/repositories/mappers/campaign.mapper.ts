import type { Campaign } from '@prisma/client';
import type { CampaignFact } from '../../../types/index.js';

/**
 * Normalize a stored campaign approval status to the domain representation.
 * PENDING remains Pending (never treated as approved). Unknown values are
 * preserved unchanged rather than coerced.
 */
export function normalizeCampaignApprovalStatus(raw: string): string {
  const v = raw.trim().toUpperCase();
  if (v === 'APPROVED') return 'Approved';
  if (v === 'PENDING') return 'Pending';
  if (v === 'EXPIRED') return 'Expired';
  return raw;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Map a Prisma Campaign row to the audit-engine CampaignFact domain type.
 *
 * Schema limitation: `campaignName` does not exist in the Campaign table, so
 * it is mapped to an empty string. Approval status is normalized at this
 * boundary; validity dates are preserved as ISO date strings so the audit
 * rules can determine expiry. Approval status reflects approval only — it is
 * NOT overwritten based on dates.
 */
export function toCampaignFact(campaign: Campaign): CampaignFact {
  return {
    campaignId: campaign.campaignId,
    sku: campaign.sku,
    campaignName: '',
    campaignPriceInr: Number(campaign.campaignPriceInr),
    startDate: toDateString(campaign.startDate),
    endDate: toDateString(campaign.endDate),
    eligibleChannels: campaign.eligibleChannels,
    conditions: campaign.conditionsText ?? '',
    approvalStatus: normalizeCampaignApprovalStatus(campaign.approvalStatus),
    approver: campaign.approvedBy ?? '',
  };
}

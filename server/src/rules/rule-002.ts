import { Finding, ExtractedAdContent, AuditSubmissionMetadata, CampaignFact } from '../types/index.js';
import type { AuditDataSource } from '../services/audit-engine/audit-data-source.interface.js';

export function evaluateRule002(
  extracted: ExtractedAdContent,
  metadata: AuditSubmissionMetadata | undefined,
  dataSource: AuditDataSource
): Finding | null {
  const ruleDef = dataSource.getRule('NW-RULE-002');
  const price = extracted.detectedPrice;
  const sku = extracted.detectedSku || metadata?.sku;
  const pubDateStr = metadata?.publicationDate || '2026-11-13';
  const pubChannel = (metadata?.publicationChannel || 'NOVAWEAR website').toLowerCase();

  // If no price is advertised, rule is not triggered
  if (price === undefined || price === null) {
    return null;
  }

  // 1. Resolve product facts
  const product = sku ? dataSource.getProductBySku(sku) : undefined;
  const basePrice = product ? product.sellingPriceInr : undefined;

  // 2. Resolve campaign records
  const campaignId = extracted.campaignReferences[0] || metadata?.campaignId;
  let campaign: CampaignFact | undefined;

  if (campaignId) {
    campaign = dataSource.getCampaignById(campaignId);
  }
  if (!campaign && sku) {
    // Find campaign matching price or sku
    const skuCampaigns = dataSource.getCampaignsForSku(sku);
    campaign = skuCampaigns.find(c => c.campaignPriceInr === price) || skuCampaigns[0];
  }

  // 3. Scenario A: Displayed price equals base selling price without campaign discount
  if (basePrice !== undefined && price === basePrice && !campaignId) {
    return {
      id: `FIND-002-${Date.now()}`,
      ruleId: 'NW-RULE-002',
      policyName: ruleDef?.ruleName || 'Campaign price validity',
      status: 'PASS',
      severity: 'GREEN',
      observedValue: `₹${price.toLocaleString('en-IN')}`,
      expectedValue: `Base selling price: ₹${basePrice.toLocaleString('en-IN')}`,
      evidenceExcerpt: `Product Catalogue: SKU ${sku} | MRP: ₹${product?.mrpInr} | Base Selling Price: ₹${basePrice} | Status: Active`,
      sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: `Product Catalogue sheet; row for SKU ${sku}`,
      explanation: `The advertised price ₹${price.toLocaleString('en-IN')} matches the approved base selling price of ₹${basePrice.toLocaleString('en-IN')} for ${product?.productName} (${sku}). No promotional campaign discount claimed.`,
      suggestedCorrection: 'No correction required. Advertised price is fully substantiated by the active product catalogue.',
      confidence: 1.0,
    };
  }

  // 4. Scenario B: Campaign record exists
  if (campaign) {
    // Check approval status FIRST
    if (campaign.approvalStatus.toLowerCase() !== 'approved') {
      return {
        id: `FIND-002-${Date.now()}`,
        ruleId: 'NW-RULE-002',
        policyName: ruleDef?.ruleName || 'Campaign price validity',
        status: 'FAIL',
        severity: 'RED',
        observedValue: `₹${price.toLocaleString('en-IN')} (Campaign: ${campaign.campaignId}, Status: ${campaign.approvalStatus})`,
        expectedValue: `Approval Status: Approved (Current status: ${campaign.approvalStatus})`,
        evidenceExcerpt: `Campaign Offers: Campaign ID: ${campaign.campaignId} | SKU: ${campaign.sku} | Campaign Name: "${campaign.campaignName}" | Price: ₹${campaign.campaignPriceInr} | Dates: ${campaign.startDate} to ${campaign.endDate} | Approval Status: ${campaign.approvalStatus} | Approver: ${campaign.approver}`,
        sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
        sourceLocator: `Campaign Offers sheet; row for ${campaign.campaignId}`,
        explanation: `${campaign.campaignId} is "${campaign.approvalStatus}". Its date range does not make it an approved campaign. A pending campaign cannot authorise a public campaign price under any circumstances.`,
        suggestedCorrection: `Do not publish the offer until the authorised commercial owner (${campaign.approver}) formally approves it. Otherwise, use the approved base price of ₹${basePrice ? basePrice.toLocaleString('en-IN') : 'N/A'}.`,
        confidence: 1.0,
      };
    }

    // Check validity dates
    const pubDate = new Date(pubDateStr);
    const startDate = new Date(campaign.startDate);
    const endDate = new Date(campaign.endDate);
    const isDateValid = pubDate >= startDate && pubDate <= endDate;

    if (!isDateValid) {
      return {
        id: `FIND-002-${Date.now()}`,
        ruleId: 'NW-RULE-002',
        policyName: ruleDef?.ruleName || 'Campaign price validity',
        status: 'FAIL',
        severity: 'RED',
        observedValue: `₹${price.toLocaleString('en-IN')} on ${pubDateStr}`,
        expectedValue: `Campaign valid from ${campaign.startDate} to ${campaign.endDate}`,
        evidenceExcerpt: `Campaign ID: ${campaign.campaignId} | SKU: ${campaign.sku} | Start Date: ${campaign.startDate} | End Date: ${campaign.endDate} | Approval Status: ${campaign.approvalStatus}`,
        sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
        sourceLocator: `Campaign Offers sheet; row for ${campaign.campaignId}`,
        explanation: `The campaign ${campaign.campaignId} expired on ${campaign.endDate}. Intended publication date ${pubDateStr} falls outside the approved promotional window. An expired campaign cannot authorise a discounted price.`,
        suggestedCorrection: `Update the displayed price to the current approved base price of ₹${basePrice ? basePrice.toLocaleString('en-IN') : '1,299'} or provide an active approved campaign record.`,
        confidence: 1.0,
      };
    }

    // Check publication channel
    const channelMatch = campaign.eligibleChannels.some(ch => pubChannel.includes(ch) || ch.includes(pubChannel));
    if (!channelMatch && campaign.eligibleChannels.length > 0) {
      return {
        id: `FIND-002-${Date.now()}`,
        ruleId: 'NW-RULE-002',
        policyName: ruleDef?.ruleName || 'Campaign price validity',
        status: 'FAIL',
        severity: 'RED',
        observedValue: `Channel: ${metadata?.publicationChannel || pubChannel}`,
        expectedValue: `Eligible Channels: ${campaign.eligibleChannels.join(', ')}`,
        evidenceExcerpt: `Campaign ID: ${campaign.campaignId} | Eligible Channels: ${campaign.eligibleChannels.join('; ')}`,
        sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
        sourceLocator: `Campaign Offers sheet; row for ${campaign.campaignId}`,
        explanation: `Campaign ${campaign.campaignId} authorises price ₹${campaign.campaignPriceInr} only on "${campaign.eligibleChannels.join(', ')}". Channel "${metadata?.publicationChannel || pubChannel}" is not eligible.`,
        suggestedCorrection: `Publish this offer only on eligible channels (${campaign.eligibleChannels.join(', ')}) or request channel expansion from the commercial owner.`,
        confidence: 0.95,
      };
    }

    // Check advertised price vs campaign price
    if (price !== campaign.campaignPriceInr) {
      return {
        id: `FIND-002-${Date.now()}`,
        ruleId: 'NW-RULE-002',
        policyName: ruleDef?.ruleName || 'Campaign price validity',
        status: 'FAIL',
        severity: 'RED',
        observedValue: `₹${price.toLocaleString('en-IN')}`,
        expectedValue: `Approved Campaign Price: ₹${campaign.campaignPriceInr.toLocaleString('en-IN')}`,
        evidenceExcerpt: `Campaign ID: ${campaign.campaignId} | Approved Campaign Price: ₹${campaign.campaignPriceInr}`,
        sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
        sourceLocator: `Campaign Offers sheet; row for ${campaign.campaignId}`,
        explanation: `The advertised price ₹${price.toLocaleString('en-IN')} does not match the approved campaign price ₹${campaign.campaignPriceInr.toLocaleString('en-IN')} under ${campaign.campaignId}.`,
        suggestedCorrection: `Align the advertised price with the approved campaign price ₹${campaign.campaignPriceInr.toLocaleString('en-IN')}.`,
        confidence: 1.0,
      };
    }

    // If all checks pass, it's an Approved Campaign!
    return {
      id: `FIND-002-${Date.now()}`,
      ruleId: 'NW-RULE-002',
      policyName: ruleDef?.ruleName || 'Campaign price validity',
      status: 'PASS',
      severity: 'GREEN',
      observedValue: `₹${price.toLocaleString('en-IN')} (Campaign: ${campaign.campaignId})`,
      expectedValue: `₹${campaign.campaignPriceInr.toLocaleString('en-IN')} (Valid: ${campaign.startDate} to ${campaign.endDate})`,
      evidenceExcerpt: `Campaign Offers: ID: ${campaign.campaignId} | SKU: ${campaign.sku} | Campaign Price: ₹${campaign.campaignPriceInr} | Dates: ${campaign.startDate}–${campaign.endDate} | Channels: ${campaign.eligibleChannels.join('; ')} | Conditions: "${campaign.conditions}" | Approval Status: Approved`,
      sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
      sourceLocator: `Campaign Offers sheet; row for ${campaign.campaignId}`,
      explanation: `${campaign.campaignId} authorises ₹${campaign.campaignPriceInr.toLocaleString('en-IN')} for ${campaign.sku} from ${campaign.startDate} to ${campaign.endDate} on ${campaign.eligibleChannels.join(', ')}. Pass is conditional on retaining mandatory conditions: "${campaign.conditions}".`,
      suggestedCorrection: 'No correction needed if the SKU, channel, date, and conditions remain visible.',
      confidence: 1.0,
    };
  }

  // 5. Scenario C: Price does not match base price and no valid campaign found
  const pastCampaigns = sku ? dataSource.getCampaignsForSku(sku) : [];
  const expiredCampaign = pastCampaigns.find(c => c.endDate < pubDateStr);

  let explanation = `Displayed price ₹${price.toLocaleString('en-IN')} does not match the ${sku || 'product'} base selling price of ₹${basePrice ? basePrice.toLocaleString('en-IN') : '1,299'}.`;
  if (expiredCampaign) {
    explanation += ` The supplied campaign ${expiredCampaign.campaignId} ended on ${expiredCampaign.endDate} and does not authorise this price on ${pubDateStr}.`;
  } else {
    explanation += ` No matching active approved campaign is supplied for ₹${price.toLocaleString('en-IN')} on ${pubDateStr}.`;
  }

  return {
    id: `FIND-002-${Date.now()}`,
    ruleId: 'NW-RULE-002',
    policyName: ruleDef?.ruleName || 'Campaign price validity',
    status: 'FAIL',
    severity: 'RED',
    observedValue: `₹${price.toLocaleString('en-IN')}`,
    expectedValue: `Base selling price ₹${basePrice ? basePrice.toLocaleString('en-IN') : '1,299'} (or active approved campaign)`,
    evidenceExcerpt: `Product Catalogue: SKU ${sku || 'NW-CS-001'} base selling price is ₹${basePrice || 1299}. ${expiredCampaign ? `Campaign ${expiredCampaign.campaignId} expired on ${expiredCampaign.endDate}.` : 'No matching active campaign in Campaign Offers.'}`,
    sourceFilename: '05_Product_Catalogue_and_Campaigns.xlsx',
    sourceLocator: 'Product Catalogue and Campaign Offers sheets',
    explanation,
    suggestedCorrection: `Update the displayed price to ₹${basePrice ? basePrice.toLocaleString('en-IN') : '1,299'} or provide a valid approved campaign record matching SKU, date, channel, price and conditions.`,
    confidence: 1.0,
  };
}


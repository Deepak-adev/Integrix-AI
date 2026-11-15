import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import xlsx from 'xlsx';
import { PDFParse } from 'pdf-parse';
import { ProductFact, CampaignFact, PolicyRuleDefinition } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class RepositoryLoader {
  private products: Map<string, ProductFact> = new Map();
  private campaigns: Map<string, CampaignFact> = new Map();
  private rules: Map<string, PolicyRuleDefinition> = new Map();
  private policyTexts: Map<string, { filename: string; pages: { pageNum: number; text: string }[]; fullText: string }> = new Map();
  private initialized: boolean = false;

  private findDocsDir(): string {
    const candidatePaths = [
      path.join(process.cwd(), 'docs'),
      path.join(process.cwd(), '..', 'docs'),
      path.resolve(__dirname, '../../../../docs'),
      path.resolve(__dirname, '../../../docs'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }
    return path.join(process.cwd(), 'docs');
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    const docsDir = this.findDocsDir();
    console.log(`[RepositoryLoader] Initializing from docs directory: ${docsDir}`);

    // 1. Load 05_Product_Catalogue_and_Campaigns.xlsx
    const cataloguePath = path.join(
      docsDir,
      'NOVAWEAR_Master_Brand_Repository',
      'NOVAWEAR_Master_Brand_Repository',
      '05_Product_Catalogue_and_Campaigns.xlsx'
    );
    const altCataloguePath = path.join(docsDir, '05_Product_Catalogue_and_Campaigns.xlsx');
    const finalCataloguePath = fs.existsSync(cataloguePath) ? cataloguePath : altCataloguePath;

    if (fs.existsSync(finalCataloguePath)) {
      const wb = xlsx.readFile(finalCataloguePath);

      // Parse Product Catalogue
      const catSheet = wb.Sheets['Product Catalogue'];
      if (catSheet) {
        const rows: any[] = xlsx.utils.sheet_to_json(catSheet);
        for (const r of rows) {
          const sku = String(r['SKU'] || '').trim();
          if (!sku) continue;

          const approvedClaims = String(r['Approved Claims'] || '')
            .split(';')
            .map(c => c.trim())
            .filter(Boolean);

          const claimsNotApproved = String(r['Claims Not Approved'] || '')
            .split(';')
            .map(c => c.trim())
            .filter(Boolean);

          const product: ProductFact = {
            sku,
            productName: String(r['Product Name'] || '').trim(),
            category: String(r['Category'] || '').trim(),
            colour: String(r['Colour'] || '').trim(),
            composition: String(r['Composition'] || '').trim(),
            fit: String(r['Fit'] || '').trim(),
            sizeRange: String(r['Size Range'] || '').trim(),
            mrpInr: Number(r['MRP_INR']) || 0,
            sellingPriceInr: Number(r['Selling Price_INR']) || 0,
            approvedDescription: String(r['Approved Product Description'] || '').trim(),
            approvedClaims,
            claimsNotApproved,
            careInstructions: String(r['Care Instructions'] || '').trim(),
            status: String(r['Status'] || 'Active').trim(),
            lastUpdated: String(r['Last Updated'] || '').trim(),
          };
          this.products.set(sku, product);
        }
      }

      // Parse Campaign Offers
      const campSheet = wb.Sheets['Campaign Offers'];
      if (campSheet) {
        const rows: any[] = xlsx.utils.sheet_to_json(campSheet);
        for (const r of rows) {
          const campaignId = String(r['Campaign ID'] || '').trim();
          if (!campaignId) continue;

          const eligibleChannels = String(r['Eligible Channels'] || '')
            .split(';')
            .map(c => c.trim().toLowerCase())
            .filter(Boolean);

          const campaign: CampaignFact = {
            campaignId,
            sku: String(r['SKU'] || '').trim(),
            campaignName: String(r['Campaign Name'] || '').trim(),
            campaignPriceInr: Number(r['Campaign Price_INR']) || 0,
            startDate: String(r['Start Date'] || '').trim(),
            endDate: String(r['End Date'] || '').trim(),
            eligibleChannels,
            conditions: String(r['Conditions'] || '').trim(),
            approvalStatus: String(r['Approval Status'] || 'Pending').trim(),
            approver: String(r['Approver'] || '').trim(),
          };
          this.campaigns.set(campaignId, campaign);
        }
      }
      console.log(`[RepositoryLoader] Loaded ${this.products.size} products and ${this.campaigns.size} campaigns.`);
    }

    // 2. Load Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx
    const rulebookCandidates = [
      path.join(docsDir, 'Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx'),
      path.join(docsDir, 'Integrix_AI_Executable_Rulebook_Schema_v0.1.xlsx'),
    ];
    for (const rbPath of rulebookCandidates) {
      if (fs.existsSync(rbPath)) {
        const wb = xlsx.readFile(rbPath);
        const rulesSheet = wb.Sheets['Rule Registry'];
        if (rulesSheet) {
          const rows: any[] = xlsx.utils.sheet_to_json(rulesSheet);
          for (const r of rows) {
            const ruleId = String(r['Rule ID'] || '').trim();
            if (!ruleId) continue;

            const rule: PolicyRuleDefinition = {
              ruleId,
              organisationId: String(r['Organisation ID'] || 'ORG-NW').trim(),
              ruleVersion: String(r['Rule Version'] || '0.1').trim(),
              ruleName: String(r['Rule Name'] || '').trim(),
              ruleFamily: String(r['Rule Family'] || '').trim(),
              category: String(r['Category'] || '').trim(),
              inputComponentId: String(r['Input Component ID'] || '').trim(),
              inputComponentName: String(r['Input Component Name'] || '').trim(),
              referenceComponentIds: String(r['Reference Component IDs'] || '').trim(),
              policyStatement: String(r['Policy Statement'] || '').trim(),
              validationLogic: String(r['Validation Logic'] || '').trim(),
              exceptionLogic: r['Exception Logic'] ? String(r['Exception Logic']).trim() : undefined,
              errorMessage: String(r['Error Message'] || '').trim(),
              correctionMessage: String(r['Correction Message'] || '').trim(),
              authoritySourceId: String(r['Authority / Source ID'] || '').trim(),
              sourceLocator: String(r['Source Locator'] || '').trim(),
              severity: (String(r['Severity (RAG)'] || 'AMBER').toUpperCase() as any),
              engine: String(r['Engine'] || 'Deterministic').trim(),
              executionMode: String(r['Execution Mode'] || 'Pre-publication').trim(),
              requiredInputs: String(r['Required Inputs'] || '').trim(),
              passCriteria: String(r['Pass Criteria'] || '').trim(),
              failCriteria: String(r['Fail Criteria'] || '').trim(),
              reviewRequired: String(r['Review Required'] || 'Yes').toLowerCase() === 'yes',
              ruleStatus: String(r['Rule Status'] || 'DRAFT').trim(),
              confidenceThreshold: r['Confidence Threshold'] ? Number(r['Confidence Threshold']) : 0.8,
            };
            this.rules.set(ruleId, rule);
          }
        }
        console.log(`[RepositoryLoader] Loaded ${this.rules.size} rules from rulebook.`);
        break;
      }
    }

    // 3. Load Brand Repository Policy PDFs
    const repoPdfDir = path.join(
      docsDir,
      'NOVAWEAR_Master_Brand_Repository',
      'NOVAWEAR_Master_Brand_Repository'
    );
    const pdfFiles = [
      { id: 'SRC-NW-001', name: '01_Brand_Guidelines.pdf' },
      { id: 'SRC-NW-002', name: '02_Company_Profile.pdf' },
      { id: 'SRC-NW-003', name: '03_Marketing_and_Communication_Policy.pdf' },
      { id: 'SRC-NW-004', name: '04_Product_and_Customer_Information_Policy.pdf' },
    ];

    for (const item of pdfFiles) {
      const fullPath = path.join(repoPdfDir, item.name);
      if (fs.existsSync(fullPath)) {
        try {
          const buffer = fs.readFileSync(fullPath);
          // pdf-parse v2: named class export, getText() returns { text, pages }
          const parser = new PDFParse({ data: buffer });
          const textRes = await parser.getText();
          const pages: { pageNum: number; text: string }[] = [];
          if (textRes.pages && Array.isArray(textRes.pages)) {
            textRes.pages.forEach((p: any) => pages.push({ pageNum: p.num ?? 1, text: p.text ?? '' }));
          } else {
            pages.push({ pageNum: 1, text: textRes.text });
          }
          this.policyTexts.set(item.id, {
            filename: item.name,
            pages,
            fullText: textRes.text,
          });
        } catch (err: any) {
          console.warn(`[RepositoryLoader] Error reading ${item.name}:`, err.message);
        }
      }
    }
    console.log(`[RepositoryLoader] Indexed ${this.policyTexts.size} policy reference PDFs.`);

    this.initialized = true;
  }

  public getProductBySku(sku: string): ProductFact | undefined {
    return this.products.get(sku.trim());
  }

  public getAllProducts(): ProductFact[] {
    return Array.from(this.products.values());
  }

  public getCampaignById(campaignId: string): CampaignFact | undefined {
    return this.campaigns.get(campaignId.trim());
  }

  public getCampaignsForSku(sku: string): CampaignFact[] {
    const normalizedSku = sku.trim().toUpperCase();
    return Array.from(this.campaigns.values()).filter(c => c.sku.toUpperCase() === normalizedSku);
  }

  public getAllCampaigns(): CampaignFact[] {
    return Array.from(this.campaigns.values());
  }

  public getRule(ruleId: string): PolicyRuleDefinition | undefined {
    return this.rules.get(ruleId.trim());
  }

  public getAllRules(): PolicyRuleDefinition[] {
    return Array.from(this.rules.values());
  }

  public getPolicyDocument(sourceId: string) {
    return this.policyTexts.get(sourceId);
  }

  public searchPolicyText(sourceId: string, searchTerms: string[]): { excerpt: string; pageNumber: number } | null {
    const doc = this.policyTexts.get(sourceId);
    if (!doc) return null;

    for (const page of doc.pages) {
      const lower = page.text.toLowerCase();
      const match = searchTerms.some(t => lower.includes(t.toLowerCase()));
      if (match) {
        // Return a clean snippet around match
        for (const term of searchTerms) {
          const idx = lower.indexOf(term.toLowerCase());
          if (idx !== -1) {
            const start = Math.max(0, idx - 100);
            const end = Math.min(page.text.length, idx + 200);
            return {
              excerpt: page.text.substring(start, end).replace(/\s+/g, ' ').trim(),
              pageNumber: page.pageNum,
            };
          }
        }
      }
    }
    return null;
  }
}

export const repositoryLoader = new RepositoryLoader();


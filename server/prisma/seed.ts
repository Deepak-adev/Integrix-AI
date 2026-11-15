import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { repositoryLoader } from '../src/services/ingestion/repository-loader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ORG_SLUG = 'novawear';
const RULEBOOK_VERSION = '0.1';
const RELEASE_ID = 'NW-RB-0.1';
const REFERENCE_DATE = '2026-11-13';

function findDocsDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'docs'),
    path.resolve(process.cwd(), '..', 'docs'),
    path.resolve(__dirname, '..', '..', 'docs'),
    path.resolve(__dirname, '..', '..', '..', 'docs'),
  ];
  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error('NOVAWEAR docs directory not found');
}

function dec(n: number | string): Prisma.Decimal {
  return new Prisma.Decimal(String(n));
}

function splitList(value: string | undefined | null): string[] {
  return String(value || '')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);
}

function sheetToText(wb: xlsx.WorkBook): string {
  const parts: string[] = [];
  for (const name of wb.SheetNames) {
    const rows = xlsx.utils.sheet_to_json<any>(wb.Sheets[name], { defval: '' });
    parts.push(`## Sheet: ${name} (${rows.length} rows)`);
    for (const r of rows) parts.push(JSON.stringify(r));
  }
  return parts.join('\n');
}

function readCatalogue(docsDir: string) {
  const file = path.join(
    docsDir,
    'NOVAWEAR_Master_Brand_Repository',
    'NOVAWEAR_Master_Brand_Repository',
    '05_Product_Catalogue_and_Campaigns.xlsx'
  );
  const wb = xlsx.readFile(file);
  const products = xlsx.utils.sheet_to_json<any>(wb.Sheets['Product Catalogue'], { defval: '' });
  const campaigns = xlsx.utils.sheet_to_json<any>(wb.Sheets['Campaign Offers'], { defval: '' });
  return { file, wb, products, campaigns, text: sheetToText(wb) };
}

function brandAssets(docsDir: string) {
  const dir = path.join(
    docsDir,
    'NOVAWEAR_Master_Brand_Repository',
    'NOVAWEAR_Master_Brand_Repository',
    'Brand_Assets'
  );
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).sort() : [];
  const colourPath = path.join(dir, 'Colour_Reference.txt');
  const colourReference = fs.existsSync(colourPath) ? fs.readFileSync(colourPath, 'utf8') : '';
  return { dir, files, colourReference };
}

const CREATIVE_TEXT: Record<string, string> = {
  'INX-NW-T01': `NOVAWEAR
THE CLASSIC COTTON SHIRT
Your everyday essential. 100% cotton. Regular fit.
₹999
Shop now | NOVAWEAR | NW-CS-001`,
  'INX-NW-T02': `NOVAWEAR
100% COTTON. ALL DAY COMFORT.
Meet the Everyday Oxford Shirt – a breathable 100% cotton essential for every day.
₹1,199
NOVAWEAR | NW-CS-002`,
  'INX-NW-T03': `NOVAWEAR
CORE CREW TEE
A regular-fit everyday tee. Available in selected sizes.
₹599
CMP-26-018
Campaign price valid 1–15 Nov 2026 on NOVAWEAR website and Instagram Shop. Selected sizes only. Price shown at checkout.
NOVAWEAR | NW-TS-003`,
  'INX-NW-T04': `NOVAWEAR
EVERYDAY CHINO – LIMITED-TIME OFFER
Get your pair today at our special campaign price.
₹1,399
CMP-26-021
Offer ends 20 Nov 2026 | Shop now
NOVAWEAR | NW-TR-005`,
  'INX-NW-T05': `NOVAWEAR
WRINKLE-PROOF. READY FOR ANYTHING.
A shirt that stays perfectly smooth from morning to night.
₹1,299
NOVAWEAR | NW-CS-001`,
  'INX-NW-T06': `NOVAWEAR
ORDER TODAY. DELIVERED TOMORROW. GUARANTEED.
Place your order now and receive it by tomorrow, wherever you are.
NOVAWEAR | Delivery promise`,
  'INX-NW-T07': `NOVAWEAR
THE CLASSIC COTTON SHIRT
An easy everyday layer in 100% cotton. Regular fit. Made for repeat wear.
₹1,299
NOVAWEAR | NW-CS-001 | Regular fit`,
};

const SCENARIOS = [
  {
    testPackId: 'INX-NW-T01', expectedAuditDocId: 'AD-NW-001', title: 'Price Mismatch (Deliberate commercial violation)',
    sku: 'NW-CS-001', channel: 'Instagram feed advertisement', filename: 'AD-NW-002.pdf',
    expectedOutcome: 'FAIL', primaryRuleId: 'NW-RULE-002', expectedSeverity: 'RED',
    expectedEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue and Campaign Offers.',
    expectedCorrection: 'Update displayed price to ₹1,299 or provide an active approved campaign record.', sortOrder: 1,
  },
  {
    testPackId: 'INX-NW-T02', expectedAuditDocId: 'AD-NW-002', title: 'Fabric Composition Mismatch (Deliberate product-claim violation)',
    sku: 'NW-CS-002', channel: 'NOVAWEAR website banner', filename: 'AD-NW-003.pdf',
    expectedOutcome: 'FAIL', primaryRuleId: 'NW-RULE-001', expectedSeverity: 'RED',
    expectedEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue → NW-CS-002 row.',
    expectedCorrection: "Replace claim with exact approved composition: \"60% cotton, 40% polyester\".", sortOrder: 2,
  },
  {
    testPackId: 'INX-NW-T03', expectedAuditDocId: 'AD-NW-003', title: 'Approved Campaign with Conditions (Weekend Essentials)',
    sku: 'NW-TS-003', channel: 'Instagram Shop', filename: 'AD-NW-004.pdf',
    expectedOutcome: 'PASS', primaryRuleId: 'NW-RULE-002', expectedSeverity: 'GREEN',
    expectedEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Campaign Offers → CMP-26-018.',
    expectedCorrection: 'No correction needed if the SKU, channel, date, and conditions remain visible.', sortOrder: 3,
  },
  {
    testPackId: 'INX-NW-T04', expectedAuditDocId: 'AD-NW-004', title: 'Pending Campaign Price (Deliberate approval-state violation)',
    sku: 'NW-TR-005', channel: 'NOVAWEAR website homepage banner', filename: 'AD-NW-005.pdf',
    expectedOutcome: 'FAIL', primaryRuleId: 'NW-RULE-002', expectedSeverity: 'RED',
    expectedEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Campaign Offers → CMP-26-021.',
    expectedCorrection: 'Do not publish offer until commercial owner approves CMP-26-021. Otherwise use base price.', sortOrder: 4,
  },
  {
    testPackId: 'INX-NW-T05', expectedAuditDocId: 'AD-NW-005', title: 'Unsupported Performance Claim (Wrinkle-Proof)',
    sku: 'NW-CS-001', channel: 'Paid social advertisement', filename: 'AD-NW-006.pdf',
    expectedOutcome: 'NEEDS_VERIFICATION', primaryRuleId: 'NW-RULE-003', expectedSeverity: 'AMBER',
    expectedEvidence: '03_Marketing_and_Communication_Policy.pdf (Section 4); 05_Product_Catalogue_and_Campaigns.xlsx (Claims Not Approved).',
    expectedCorrection: 'Provide approved product-specific test evidence linked to NW-CS-001 or remove/qualify claim.', sortOrder: 5,
  },
  {
    testPackId: 'INX-NW-T06', expectedAuditDocId: 'AD-NW-006', title: 'Guaranteed Next-Day Delivery (Deliberate service-promise violation)',
    sku: '', channel: 'Website homepage banner', filename: 'AD-NW-007.pdf',
    expectedOutcome: 'FAIL', primaryRuleId: 'NW-RULE-004', expectedSeverity: 'AMBER',
    expectedEvidence: '02_Company_Profile.pdf and 04_Product_and_Customer_Information_Policy.pdf (Operational facts).',
    expectedCorrection: 'Replace with approved dispatch estimate (orders handed to carrier in 1–2 business days).', sortOrder: 6,
  },
  {
    testPackId: 'INX-NW-T07', expectedAuditDocId: 'AD-NW-007', title: 'Compliant Product Advertisement (Everyday, made easy)',
    sku: 'NW-CS-001', channel: 'NOVAWEAR website product tile', filename: 'AD-NW-001.pdf',
    expectedOutcome: 'PASS', primaryRuleId: 'NW-RULE-001', expectedSeverity: 'GREEN',
    expectedEvidence: '05_Product_Catalogue_and_Campaigns.xlsx → Product Catalogue → NW-CS-001 row.',
    expectedCorrection: 'No correction required if creative contains no additional unverified claims.', sortOrder: 7,
  },
];

async function main() {
  const docsDir = findDocsDir();
  await repositoryLoader.initialize();
  const catalogue = readCatalogue(docsDir);
  const assets = brandAssets(docsDir);

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(async (tx) => {
      const productAliases: Record<string, string> = {};
      for (const p of repositoryLoader.getAllProducts()) {
        productAliases[p.productName.toLowerCase()] = p.sku;
      }

      const org = await tx.organisation.upsert({
        where: { slug: ORG_SLUG },
        create: {
          slug: ORG_SLUG,
          name: 'NOVAWEAR',
          legalName: 'NovaWear Retail Private Limited',
          status: 'ACTIVE',
          settings: {
            referenceDate: REFERENCE_DATE,
            defaultPublicationChannel: 'NOVAWEAR website',
            currency: 'INR',
            rulebookVersion: RULEBOOK_VERSION,
            rulebookReleaseId: RELEASE_ID,
            extraction: {
              skuPattern: 'NW-[A-Z]{2}-\\d{3}',
              campaignPattern: 'CMP-\\d{2}-\\d{3}',
              brandTerms: ['NOVAWEAR', 'NovaWear'],
              productAliases,
              priceSymbol: '₹',
            },
            brandVoice: {
              descriptor: 'Everyday essentials',
              prohibitedTerms: ['luxury', 'revolutionary', 'life-changing', 'guaranteed', 'premium for everyone', 'fashion that transforms you'],
              guidance: 'Clear about fabric, fit, care and delivery; no shouting, overpromising or pressure tactics.',
            },
            brandColours: {
              'NOVA Navy': '#172B4D',
              'Slate Blue': '#315B7D',
              'Warm Sand': '#E9E1D5',
              Rust: '#C66A3D',
              Cloud: '#F4F6F8',
              Ink: '#202833',
            },
            discrepancyNote: 'Test Pack PDF uses AD-NW-001..007 while Expected Audit Results DOCX uses a shifted AD-NW mapping; canonical Integrix IDs INX-NW-T01..T07 reconcile both conventions.',
            audit: { discrepancyNote: 'See discrepancyNote; legacy IDs preserved via creativeFilename and expectedAuditDocId.' },
            sourcePaths: {
              brandRepository: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository',
              catalogueWorkbook: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/05_Product_Catalogue_and_Campaigns.xlsx',
              brandAssetsDir: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/Brand_Assets',
              adCreativesDir: 'docs/NOVAWEAR_Seven_Individual_Ad_Creatives',
            },
          },
        },
        update: {
          name: 'NOVAWEAR',
          legalName: 'NovaWear Retail Private Limited',
          status: 'ACTIVE',
        },
      });

      for (const p of repositoryLoader.getAllProducts()) {
        const sizes = String(p.sizeRange || '').split(',').map(s => s.trim()).filter(Boolean);
        await tx.product.upsert({
          where: { organisationId_sku: { organisationId: org.id, sku: p.sku } },
          create: {
            organisationId: org.id,
            sku: p.sku,
            productName: p.productName,
            composition: p.composition,
            fit: p.fit || null,
            sizes,
            sellingPriceInr: dec(p.sellingPriceInr),
            mrpInr: p.mrpInr ? dec(p.mrpInr) : null,
            approvedClaims: p.approvedClaims,
            claimsNotApproved: p.claimsNotApproved,
            careInstructions: p.careInstructions || null,
            status: 'ACTIVE',
          },
          update: {
            productName: p.productName,
            composition: p.composition,
            fit: p.fit || null,
            sizes,
            sellingPriceInr: dec(p.sellingPriceInr),
            mrpInr: p.mrpInr ? dec(p.mrpInr) : null,
            approvedClaims: p.approvedClaims,
            claimsNotApproved: p.claimsNotApproved,
            careInstructions: p.careInstructions || null,
            status: 'ACTIVE',
          },
        });
      }

      for (const c of catalogue.campaigns) {
        const campaignId = String(c['Campaign ID'] || '').trim();
        if (!campaignId) continue;
        const approvalRaw = String(c['Approval Status'] || 'Pending').trim();
        const approvalStatus = approvalRaw.toLowerCase() === 'approved' ? 'APPROVED' : 'PENDING';
        const approver = String(c['Approver'] || '').trim();
        await tx.campaign.upsert({
          where: { organisationId_campaignId: { organisationId: org.id, campaignId } },
          create: {
            organisationId: org.id,
            campaignId,
            sku: String(c['SKU'] || '').trim(),
            campaignPriceInr: dec(Number(c['Campaign Price_INR']) || 0),
            startDate: new Date(String(c['Start Date'])),
            endDate: new Date(String(c['End Date'])),
            eligibleChannels: splitList(String(c['Eligible Channels'] || '')),
            conditionsText: String(c['Conditions'] || '').trim() || null,
            approvalStatus,
            approvedBy: approvalStatus === 'APPROVED' ? approver || null : null,
            approvedAt: null,
            status: 'ACTIVE',
          },
          update: {
            sku: String(c['SKU'] || '').trim(),
            campaignPriceInr: dec(Number(c['Campaign Price_INR']) || 0),
            startDate: new Date(String(c['Start Date'])),
            endDate: new Date(String(c['End Date'])),
            eligibleChannels: splitList(String(c['Eligible Channels'] || '')),
            conditionsText: String(c['Conditions'] || '').trim() || null,
            approvalStatus,
            approvedBy: approvalStatus === 'APPROVED' ? approver || null : null,
            approvedAt: null,
            status: 'ACTIVE',
          },
        });
      }

      const pdfSources = [
        { sourceId: 'SRC-NW-001', title: 'NOVAWEAR Brand Guidelines', filename: '01_Brand_Guidelines.pdf', type: 'PDF', mime: 'application/pdf' },
        { sourceId: 'SRC-NW-002', title: 'NOVAWEAR Company Profile', filename: '02_Company_Profile.pdf', type: 'PDF', mime: 'application/pdf' },
        { sourceId: 'SRC-NW-003', title: 'NOVAWEAR Marketing and Communication Policy', filename: '03_Marketing_and_Communication_Policy.pdf', type: 'PDF', mime: 'application/pdf' },
        { sourceId: 'SRC-NW-004', title: 'NOVAWEAR Product and Customer Information Policy', filename: '04_Product_and_Customer_Information_Policy.pdf', type: 'PDF', mime: 'application/pdf' },
      ];
      for (const s of pdfSources) {
        const doc = repositoryLoader.getPolicyDocument(s.sourceId);
        await tx.policySource.upsert({
          where: { organisationId_sourceId: { organisationId: org.id, sourceId: s.sourceId } },
          create: {
            organisationId: org.id,
            sourceId: s.sourceId,
            title: s.title,
            filename: s.filename,
            sourceType: s.type,
            storagePath: `docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/${s.filename}`,
            mimeType: s.mime,
            extractedText: doc?.fullText || null,
            pages: doc ? (doc.pages as any) : undefined,
            metadata: { documentFamily: 'NOVAWEAR Master Brand Repository' },
            status: 'ACTIVE',
          },
          update: {
            title: s.title,
            filename: s.filename,
            sourceType: s.type,
            storagePath: `docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/${s.filename}`,
            mimeType: s.mime,
            extractedText: doc?.fullText || null,
            pages: doc ? (doc.pages as any) : undefined,
            status: 'ACTIVE',
          },
        });
      }

      await tx.policySource.upsert({
        where: { organisationId_sourceId: { organisationId: org.id, sourceId: 'SRC-NW-005' } },
        create: {
          organisationId: org.id,
          sourceId: 'SRC-NW-005',
          title: 'NOVAWEAR Product Catalogue and Campaigns',
          filename: '05_Product_Catalogue_and_Campaigns.xlsx',
          sourceType: 'XLSX',
          storagePath: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/05_Product_Catalogue_and_Campaigns.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extractedText: catalogue.text,
          pages: [
            { sheet: 'Product Catalogue', rows: catalogue.products.length },
            { sheet: 'Campaign Offers', rows: catalogue.campaigns.length },
          ] as any,
          metadata: { sheets: ['Product Catalogue', 'Campaign Offers'], productRows: catalogue.products.length, campaignRows: catalogue.campaigns.length },
          status: 'ACTIVE',
        },
        update: {
          title: 'NOVAWEAR Product Catalogue and Campaigns',
          filename: '05_Product_Catalogue_and_Campaigns.xlsx',
          sourceType: 'XLSX',
          storagePath: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/05_Product_Catalogue_and_Campaigns.xlsx',
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extractedText: catalogue.text,
          pages: [
            { sheet: 'Product Catalogue', rows: catalogue.products.length },
            { sheet: 'Campaign Offers', rows: catalogue.campaigns.length },
          ] as any,
          status: 'ACTIVE',
        },
      });

      const assetText = [
        'NOVAWEAR Brand Assets collection',
        `Files: ${assets.files.join(', ') || 'none'}`,
        '',
        assets.colourReference,
        '',
        'Note: Logo SVG assets are registered as files only; visual logo analysis has not been implemented.',
      ].join('\n');
      await tx.policySource.upsert({
        where: { organisationId_sourceId: { organisationId: org.id, sourceId: 'SRC-NW-006' } },
        create: {
          organisationId: org.id,
          sourceId: 'SRC-NW-006',
          title: 'NOVAWEAR Brand Assets',
          filename: 'Brand_Assets',
          sourceType: 'DIRECTORY',
          storagePath: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/Brand_Assets',
          mimeType: null,
          extractedText: assetText,
          pages: assets.files.map(f => ({ file: f })) as any,
          metadata: { files: assets.files, colourReferenceFile: 'Colour_Reference.txt', visualAnalysisImplemented: false },
          status: 'ACTIVE',
        },
        update: {
          title: 'NOVAWEAR Brand Assets',
          filename: 'Brand_Assets',
          sourceType: 'DIRECTORY',
          storagePath: 'docs/NOVAWEAR_Master_Brand_Repository/NOVAWEAR_Master_Brand_Repository/Brand_Assets',
          mimeType: null,
          extractedText: assetText,
          pages: assets.files.map(f => ({ file: f })) as any,
          status: 'ACTIVE',
        },
      });

      const rulebookWb = xlsx.readFile(path.join(docsDir, 'Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx'));
      const ruleRowsRaw = xlsx.utils.sheet_to_json<any>(rulebookWb.Sheets['Rule Registry'], { defval: '' });
      const ruleRowById = new Map<string, any>(ruleRowsRaw.map((row: any) => [String(row['Rule ID'] || '').trim(), row]));
      const ruleIds = ['NW-RULE-001', 'NW-RULE-002', 'NW-RULE-003', 'NW-RULE-004', 'NW-RULE-005'];
      for (const ruleId of ruleIds) {
        const r = repositoryLoader.getRule(ruleId);
        if (!r) throw new Error(`Rule ${ruleId} not found in rulebook`);
        const raw = ruleRowById.get(ruleId);
        const requiredInputs = splitList(r.requiredInputs);
        const sourceIds = splitList(r.authoritySourceId);
        const referenceComponentIds = splitList(r.referenceComponentIds);
        await tx.policyRule.upsert({
          where: { organisationId_ruleId_ruleVersion: { organisationId: org.id, ruleId: r.ruleId, ruleVersion: r.ruleVersion } },
          create: {
            organisationId: org.id,
            ruleId: r.ruleId,
            ruleVersion: r.ruleVersion,
            ruleFamily: r.ruleFamily || null,
            ruleCategory: r.category || null,
            componentId: r.inputComponentId || null,
            policyText: r.policyStatement || null,
            validationLogic: r.validationLogic || null,
            exceptionText: r.exceptionLogic || null,
            errorMessage: r.errorMessage || null,
            correctionGuidance: r.correctionMessage || null,
            sourceIds,
            referenceComponentIds,
            severity: r.severity || 'WARNING',
            engine: r.engine || 'DETERMINISTIC',
            executionMode: r.executionMode || 'PRE_PUBLICATION',
            requiredInputs,
            passCriteria: r.passCriteria || null,
            failCriteria: r.failCriteria || null,
            reviewRequired: !!r.reviewRequired,
            status: 'DRAFT',
            approvalStatus: 'DRAFT',
            approvedBy: null,
            approvedAt: null,
            activatedBy: null,
            activatedAt: null,
            effectiveFrom: null,
            effectiveTo: null,
            confidenceThreshold: r.confidenceThreshold != null ? dec(r.confidenceThreshold) : null,
            evaluatorKey: null,
            owner: raw?.['Owner / Approver'] ? String(raw['Owner / Approver']).trim() : null,
            testCaseId: raw?.['Test Case ID'] ? String(raw['Test Case ID']).trim() : null,
            reasoning: raw?.['Step-by-Step Reasoning'] ? String(raw['Step-by-Step Reasoning']).trim() : null,
            badExample: raw?.['Bad Trigger Example'] ? String(raw['Bad Trigger Example']).trim() : null,
            goodExample: raw?.['Good / Passing Example'] ? String(raw['Good / Passing Example']).trim() : null,
            metadata: {
              ruleName: r.ruleName,
              inputComponentName: r.inputComponentName,
              authoritySourceId: r.authoritySourceId,
              sourceLocator: r.sourceLocator,
              sourceRuleStatus: r.ruleStatus,
              sourceExecutionMode: r.executionMode,
              effectiveFromSource: raw?.['Effective From'] || '',
              effectiveToSource: raw?.['Effective To'] || '',
              lastReviewed: raw?.['Last Reviewed'] || '',
              organisationIdSource: raw?.['Organisation ID'] || r.organisationId,
              note: 'Draft illustrative rule from rulebook schema; not approved for execution.',
            } as any,
          },
          update: {
            ruleFamily: r.ruleFamily || null,
            ruleCategory: r.category || null,
            componentId: r.inputComponentId || null,
            policyText: r.policyStatement || null,
            validationLogic: r.validationLogic || null,
            exceptionText: r.exceptionLogic || null,
            errorMessage: r.errorMessage || null,
            correctionGuidance: r.correctionMessage || null,
            sourceIds,
            referenceComponentIds,
            severity: r.severity || 'WARNING',
            engine: r.engine || 'DETERMINISTIC',
            executionMode: r.executionMode || 'PRE_PUBLICATION',
            requiredInputs,
            passCriteria: r.passCriteria || null,
            failCriteria: r.failCriteria || null,
            reviewRequired: !!r.reviewRequired,
            status: 'DRAFT',
            approvalStatus: 'DRAFT',
            approvedBy: null,
            approvedAt: null,
            activatedBy: null,
            activatedAt: null,
            confidenceThreshold: r.confidenceThreshold != null ? dec(r.confidenceThreshold) : null,
            owner: raw?.['Owner / Approver'] ? String(raw['Owner / Approver']).trim() : null,
            testCaseId: raw?.['Test Case ID'] ? String(raw['Test Case ID']).trim() : null,
            reasoning: raw?.['Step-by-Step Reasoning'] ? String(raw['Step-by-Step Reasoning']).trim() : null,
            badExample: raw?.['Bad Trigger Example'] ? String(raw['Bad Trigger Example']).trim() : null,
            goodExample: raw?.['Good / Passing Example'] ? String(raw['Good / Passing Example']).trim() : null,
          },
        });
      }

      const paramRows = xlsx.utils.sheet_to_json<any>(
        rulebookWb.Sheets['Parameter Config'],
        { defval: '' }
      );
      for (const p of paramRows) {
        const parameterId = String(p['Parameter ID'] || '').trim();
        if (!parameterId) continue;
        const valueType = String(p['Data Type'] || 'STRING').trim().toUpperCase();
        await tx.ruleParameter.upsert({
          where: { organisationId_parameterId: { organisationId: org.id, parameterId } },
          create: {
            organisationId: org.id,
            parameterId,
            ruleId: null,
            ruleVersion: null,
            parameterName: String(p['Parameter Name'] || '').trim(),
            parameterValue: String(p['Configured Value'] ?? ''),
            valueType,
            unit: String(p['Unit / Format'] || '').trim() || null,
            description: [
              String(p['Notes'] || '').trim(),
              p['Scope'] ? `Scope: ${p['Scope']}` : '',
              `Source IDs: ${splitList(String(p['Source ID'] || '')).join('; ')}`,
              `Source locator: ${p['Source Locator'] || ''}`,
              `Effective: ${p['Effective From'] || '—'} to ${p['Effective To'] || '—'}`,
              `Approval: ${p['Approval Status'] || 'DRAFT'}`,
            ].filter(Boolean).join(' | ') || null,
            sourceId: splitList(String(p['Source ID'] || ''))[0] || null,
            status: 'DRAFT',
          },
          update: {
            parameterName: String(p['Parameter Name'] || '').trim(),
            parameterValue: String(p['Configured Value'] ?? ''),
            valueType,
            unit: String(p['Unit / Format'] || '').trim() || null,
            description: [
              String(p['Notes'] || '').trim(),
              p['Scope'] ? `Scope: ${p['Scope']}` : '',
              `Source IDs: ${splitList(String(p['Source ID'] || '')).join('; ')}`,
              `Source locator: ${p['Source Locator'] || ''}`,
              `Effective: ${p['Effective From'] || '—'} to ${p['Effective To'] || '—'}`,
              `Approval: ${p['Approval Status'] || 'DRAFT'}`,
            ].filter(Boolean).join(' | ') || null,
            sourceId: splitList(String(p['Source ID'] || ''))[0] || null,
            status: 'DRAFT',
          },
        });
      }

      const exceptionRows = xlsx.utils.sheet_to_json<any>(
        rulebookWb.Sheets['Exception Registry'],
        { defval: '' }
      );
      for (const e of exceptionRows) {
        const exceptionId = String(e['Exception ID'] || '').trim();
        if (!exceptionId) continue;
        const ruleId = String(e['Rule ID'] || '').trim() || null;
        await tx.ruleException.upsert({
          where: { organisationId_exceptionId: { organisationId: org.id, exceptionId } },
          create: {
            organisationId: org.id,
            exceptionId,
            ruleId,
            ruleVersion: ruleId ? RULEBOOK_VERSION : null,
            exceptionName: exceptionId,
            conditionText: String(e['Exception Condition'] || '').trim() || null,
            status: 'DRAFT',
            reason: [
              String(e['Decision Effect'] || '').trim(),
              e['Required Evidence / Context'] ? `Evidence: ${e['Required Evidence / Context']}` : '',
              e['Approval Required'] ? `Approval required: ${e['Approval Required']}` : '',
              e['Authority / Source ID'] ? `Authority: ${e['Authority / Source ID']}` : '',
              e['Expiry / Review Date'] ? `Expiry/review: ${e['Expiry / Review Date']}` : '',
            ].filter(Boolean).join(' | ') || null,
          },
          update: {
            ruleId,
            ruleVersion: ruleId ? RULEBOOK_VERSION : null,
            exceptionName: exceptionId,
            conditionText: String(e['Exception Condition'] || '').trim() || null,
            status: 'DRAFT',
            reason: [
              String(e['Decision Effect'] || '').trim(),
              e['Required Evidence / Context'] ? `Evidence: ${e['Required Evidence / Context']}` : '',
              e['Approval Required'] ? `Approval required: ${e['Approval Required']}` : '',
              e['Authority / Source ID'] ? `Authority: ${e['Authority / Source ID']}` : '',
              e['Expiry / Review Date'] ? `Expiry/review: ${e['Expiry / Review Date']}` : '',
            ].filter(Boolean).join(' | ') || null,
          },
        });
      }

      const release = await tx.rulebookRelease.upsert({
        where: { organisationId_releaseId: { organisationId: org.id, releaseId: RELEASE_ID } },
        create: {
          organisationId: org.id,
          releaseId: RELEASE_ID,
          status: 'DRAFT',
          description: 'Initial NOVAWEAR draft rulebook release v0.1 (illustrative rules; not approved for execution).',
          approvedBy: null,
          approvedAt: null,
          activatedBy: null,
          activatedAt: null,
          metadata: {
            rulebookVersion: RULEBOOK_VERSION,
            sourceWorkbook: 'Integrix_AI_Executable_Rulebook_Schema_v0.1 (1).xlsx',
            note: 'Draft release preserving exact rule versions and policy sources; not activated.',
          } as any,
        },
        update: {
          status: 'DRAFT',
          description: 'Initial NOVAWEAR draft rulebook release v0.1 (illustrative rules; not approved for execution).',
        },
      });

      for (const ruleId of ruleIds) {
        await tx.rulebookReleaseRule.upsert({
          where: {
            organisationId_releaseId_ruleId_ruleVersion: {
              organisationId: org.id,
              releaseId: release.id,
              ruleId,
              ruleVersion: RULEBOOK_VERSION,
            },
          },
          create: { organisationId: org.id, releaseId: release.id, ruleId, ruleVersion: RULEBOOK_VERSION },
          update: {},
        });
      }

      for (const sourceId of ['SRC-NW-001', 'SRC-NW-002', 'SRC-NW-003', 'SRC-NW-004', 'SRC-NW-005', 'SRC-NW-006']) {
        await tx.rulebookReleaseSource.upsert({
          where: {
            organisationId_releaseId_sourceId: {
              organisationId: org.id,
              releaseId: release.id,
              sourceId,
            },
          },
          create: { organisationId: org.id, releaseId: release.id, sourceId },
          update: {},
        });
      }

      for (const s of SCENARIOS) {
        const creativeFilePath = `docs/NOVAWEAR_Seven_Individual_Ad_Creatives/${s.filename}`;
        await tx.acceptanceScenario.upsert({
          where: { organisationId_testPackId: { organisationId: org.id, testPackId: s.testPackId } },
          create: {
            organisationId: org.id,
            testPackId: s.testPackId,
            expectedAuditDocId: s.expectedAuditDocId,
            title: s.title,
            sku: s.sku || null,
            publicationChannel: s.channel,
            publicationDate: new Date(REFERENCE_DATE),
            creativeFilename: s.filename,
            creativeText: CREATIVE_TEXT[s.testPackId],
            creativeFilePath,
            expectedOutcome: s.expectedOutcome,
            primaryRuleId: s.primaryRuleId,
            expectedSeverity: s.expectedSeverity,
            expectedEvidence: s.expectedEvidence,
            expectedCorrection: s.expectedCorrection,
            sortOrder: s.sortOrder,
            status: 'ACTIVE',
          },
          update: {
            expectedAuditDocId: s.expectedAuditDocId,
            title: s.title,
            sku: s.sku || null,
            publicationChannel: s.channel,
            publicationDate: new Date(REFERENCE_DATE),
            creativeFilename: s.filename,
            creativeText: CREATIVE_TEXT[s.testPackId],
            creativeFilePath,
            expectedOutcome: s.expectedOutcome,
            primaryRuleId: s.primaryRuleId,
            expectedSeverity: s.expectedSeverity,
            expectedEvidence: s.expectedEvidence,
            expectedCorrection: s.expectedCorrection,
            sortOrder: s.sortOrder,
            status: 'ACTIVE',
          },
        });
      }
    });

    console.log('NOVAWEAR seed completed successfully.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(err => {
  console.error('NOVAWEAR seed failed:', err);
  process.exit(1);
});

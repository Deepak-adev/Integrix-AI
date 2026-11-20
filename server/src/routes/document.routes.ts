import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

const router = Router();

// Permitted extensions and MIME mapping
const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.csv': 'text/csv; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

// Candidate directories where documents live
const SEARCH_DIRS = [
  path.join(process.cwd(), 'client', 'public', 'sample-docs'),
  path.join(process.cwd(), 'server', 'public', 'sample-docs'),
  path.join(process.cwd(), 'docs', 'NOVAWEAR_Master_Brand_Repository', 'NOVAWEAR_Master_Brand_Repository'),
  path.join(process.cwd(), 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives'),
  path.join(process.cwd(), 'docs'),
  path.join(process.cwd(), 'uploads'),
];

// Document filename aliases mapping
const FILENAME_ALIASES: Record<string, string> = {
  '01_brand_style_and_identity.pdf': '01_Brand_Guidelines.pdf',
  '01_brand_guidelines.pdf': '01_Brand_Guidelines.pdf',
  '02_company_profile.pdf': '02_Company_Profile.pdf',
  '03_marketing_policy.pdf': '03_Marketing_and_Communication_Policy.pdf',
  '03_marketing_and_communication_policy.pdf': '03_Marketing_and_Communication_Policy.pdf',
  '04_product_and_customer_information_policy.pdf': '04_Product_and_Customer_Information_Policy.pdf',
  '05_product_catalogue.xlsx': '05_Product_Catalogue_and_Campaigns.xlsx',
  '05_product_catalogue.json': '05_Product_Catalogue_and_Campaigns.json',
  '05_product_catalogue_and_campaigns.xlsx': '05_Product_Catalogue_and_Campaigns.xlsx',
  '05_product_catalogue_and_campaigns.json': '05_Product_Catalogue_and_Campaigns.json',
  '06_universal_policy_document_template.docx': '06_Universal_Policy_Document_Template.docx',
  '06_universal_policy_document_template.html': '06_Universal_Policy_Document_Template.html',
  '07_generated_policy_profile_draft.docx': '07_Generated_Policy_Profile_Draft.docx',
  '07_generated_policy_profile_draft.html': '07_Generated_Policy_Profile_Draft.html',
  'novawear_sample_advertisement_test_pack_v0.1.pdf': 'NOVAWEAR_Sample_Advertisement_Test_Pack_v0.1.pdf',
  'colour_reference.txt': 'Colour_Reference.txt',
  'readme.txt': 'README.txt',
};

/**
 * Locate document across search paths with alias resolution
 */
function findDocumentFile(rawFilename: string): string | null {
  // Sanitize path traversal attempts
  const safeBase = path.basename(rawFilename).trim();
  const aliasResolved = FILENAME_ALIASES[safeBase.toLowerCase()] || safeBase;

  for (const dir of SEARCH_DIRS) {
    if (!fs.existsSync(dir)) continue;

    // Direct check
    const directPath = path.join(dir, aliasResolved);
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      return directPath;
    }

    // Direct check with raw name
    const rawPath = path.join(dir, safeBase);
    if (fs.existsSync(rawPath) && fs.statSync(rawPath).isFile()) {
      return rawPath;
    }

    // Case-insensitive fallback lookup
    try {
      const files = fs.readdirSync(dir);
      const match = files.find(
        (f) =>
          f.toLowerCase() === aliasResolved.toLowerCase() ||
          f.toLowerCase() === safeBase.toLowerCase()
      );
      if (match) {
        const matchedPath = path.join(dir, match);
        if (fs.statSync(matchedPath).isFile()) return matchedPath;
      }
    } catch {}
  }

  return null;
}

/**
 * GET /api/documents/:filename
 * Serves actual raw document bytes with proper Content-Type & Content-Disposition
 * Returns real 404 JSON if not found, never falling back to index.html
 */
router.get('/:filename(*)', (req: Request, res: Response) => {
  const rawParam = req.params.filename;
  if (!rawParam) {
    res.status(400).json({ error: 'Filename is required' });
    return;
  }

  const filePath = findDocumentFile(rawParam);
  if (!filePath) {
    res.status(404).json({
      error: 'DocumentNotFound',
      message: `Document '${rawParam}' could not be located in organisation repository.`,
      filename: rawParam,
    });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  const filename = path.basename(filePath);

  // Set headers explicitly for inline browser rendering
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Stream actual file content
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error(`[Documents] Stream error for ${filePath}:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'FileStreamError', message: 'Failed to read document' });
    }
  });

  stream.pipe(res);
});

export default router;

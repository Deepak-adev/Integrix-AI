import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';
import { ExtractedAdContent, AuditSubmissionMetadata } from '../../types/index.js';
import type { AuditDataSource } from '../audit-engine/audit-data-source.interface.js';
import { FileAuditDataSource } from '../audit-engine/file-audit-data-source.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ContentExtractor {
  private tesseractWorker: any = null;

  private async getWorker() {
    if (!this.tesseractWorker) {
      this.tesseractWorker = await createWorker('eng');
    }
    return this.tesseractWorker;
  }

  public async extractRawContent(filePath: string, fileType: string): Promise<{ text: string; method: ExtractedAdContent['extractionMethod'] }> {
    const ext = path.extname(filePath).toLowerCase();

    // 1. DOCX extraction
    if (ext === '.docx' || fileType.includes('word') || fileType.includes('document')) {
      const res = await mammoth.extractRawText({ path: filePath });
      return { text: res.value.trim(), method: 'DOCX_TEXT' };
    }

    // 2. PDF extraction
    if (ext === '.pdf' || fileType.includes('pdf')) {
      const dataBuffer = fs.readFileSync(filePath);
      // pdf-parse v2: named class export, getText() returns { text, pages }
      const parser = new PDFParse({ data: dataBuffer });
      const textRes = await parser.getText();
      const extractedText = textRes.text.trim();

      // Check if PDF has real text
      if (extractedText.length > 30) {
        return { text: extractedText, method: 'PDF_TEXT' };
      }

      // If PDF has little or no text, check if there is an accompanying PNG with same base name
      const dir = path.dirname(filePath);
      const base = path.basename(filePath, ext);
      const pngSibling = path.join(dir, `${base}.png`);
      const jpgSibling = path.join(dir, `${base}.jpg`);

      if (fs.existsSync(pngSibling)) {
        const worker = await this.getWorker();
        const ret = await worker.recognize(pngSibling);
        return { text: ret.data.text.trim(), method: 'OCR' };
      } else if (fs.existsSync(jpgSibling)) {
        const worker = await this.getWorker();
        const ret = await worker.recognize(jpgSibling);
        return { text: ret.data.text.trim(), method: 'OCR' };
      }

      return { text: extractedText, method: 'PDF_TEXT' };
    }

    // 3. Image OCR (PNG, JPG, JPEG, WEBP)
    if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext) || fileType.startsWith('image/')) {
      const worker = await this.getWorker();
      const ret = await worker.recognize(filePath);
      return { text: ret.data.text.trim(), method: 'OCR' };
    }

    // Fallback: read as text file
    try {
      const text = fs.readFileSync(filePath, 'utf8');
      return { text: text.trim(), method: 'PDF_TEXT' };
    } catch {
      return { text: '', method: 'PDF_TEXT' };
    }
  }

  public async parseContent(
    rawText: string,
    metadata?: AuditSubmissionMetadata,
    method: ExtractedAdContent['extractionMethod'] = 'HYBRID',
    productSource: AuditDataSource = new FileAuditDataSource()
  ): Promise<ExtractedAdContent> {
    // 1. Run deterministic regex / pattern extraction
    const deterministicData = this.deterministicExtraction(rawText, metadata, productSource);

    // 2. If Gemini API key is available, enrich with Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiEnriched = await this.extractWithGemini(rawText, deterministicData, metadata, apiKey);
        return {
          ...geminiEnriched,
          rawText,
          extractionMethod: 'AI_GEMINI',
        };
      } catch (err: any) {
        console.warn('[ContentExtractor] Gemini extraction failed or skipped, using deterministic extractor:', err.message);
      }
    }

    return {
      ...deterministicData,
      rawText,
      extractionMethod: method,
    };
  }

  private deterministicExtraction(text: string, metadata: AuditSubmissionMetadata | undefined, productSource: AuditDataSource): Omit<ExtractedAdContent, 'rawText' | 'extractionMethod'> {
    const lower = text.toLowerCase();

    // A. Detect SKU
    let detectedSku: string | undefined = metadata?.sku;
    if (!detectedSku) {
      const skuRegex = /\b(NW-[A-Z]{2}-\d{3})\b/i;
      const skuMatch = text.match(skuRegex);
      if (skuMatch) {
        detectedSku = skuMatch[1].toUpperCase();
      }
    }

    // B. Detect Products (scoped to the selected organisation's product source)
    const detectedProducts: string[] = [];
    const products = productSource.getAllProducts();
    const productExists = (name: string) => products.some(p => p.productName.toLowerCase() === name.toLowerCase());
    const skuExists = (sku: string) => products.some(p => p.sku === sku);

    for (const prod of products) {
      if (text.toLowerCase().includes(prod.productName.toLowerCase())) {
        detectedProducts.push(prod.productName);
        if (!detectedSku) detectedSku = prod.sku;
      }
    }

    // Common synonyms / shorthand in ads (only applied when the product exists
    // in the selected organisation's source — never selects an unrelated product)
    if (lower.includes('classic cotton shirt') || lower.includes('cotton shirt')) {
      if (productExists('Classic Cotton Shirt') && !detectedProducts.includes('Classic Cotton Shirt')) detectedProducts.push('Classic Cotton Shirt');
      if (!detectedSku && skuExists('NW-CS-001')) detectedSku = 'NW-CS-001';
    }
    if (lower.includes('everyday oxford shirt') || lower.includes('oxford shirt')) {
      if (productExists('Everyday Oxford Shirt') && !detectedProducts.includes('Everyday Oxford Shirt')) detectedProducts.push('Everyday Oxford Shirt');
      if (!detectedSku && skuExists('NW-CS-002')) detectedSku = 'NW-CS-002';
    }
    if (lower.includes('core crew tee') || lower.includes('core crew t-shirt')) {
      if (productExists('Core Crew T-Shirt') && !detectedProducts.includes('Core Crew T-Shirt')) detectedProducts.push('Core Crew T-Shirt');
      if (!detectedSku && skuExists('NW-TS-003')) detectedSku = 'NW-TS-003';
    }
    if (lower.includes('relaxed weekend tee')) {
      if (productExists('Relaxed Weekend Tee') && !detectedProducts.includes('Relaxed Weekend Tee')) detectedProducts.push('Relaxed Weekend Tee');
      if (!detectedSku && skuExists('NW-TS-004')) detectedSku = 'NW-TS-004';
    }
    if (lower.includes('everyday chino') || lower.includes('chino')) {
      if (productExists('Everyday Chino') && !detectedProducts.includes('Everyday Chino')) detectedProducts.push('Everyday Chino');
      if (!detectedSku && skuExists('NW-TR-005')) detectedSku = 'NW-TR-005';
    }

    // C. Detect Price
    // Strategy: Extract ALL prices from the text, then identify the actual selling
    // price using contextual clues (e.g. "Was X / Now Y", "Original X / Sale Y").
    // The selling price is what the consumer actually pays — typically the lowest
    // price when a Was/Now pattern is present.
    let detectedPrice: number | undefined;
    let advertisedPriceFormatted: string | undefined;

    // Must ignore percentages like 100%, 20%, 60%
    const allPricePattern = /(?:₹|rs\.?|inr)?\s*([0-9]{1,2},[0-9]{3}|[0-9]{3,5})(?!\s*%)/gi;
    const knownPriceValues = new Set([2299, 1899, 1499, 1399, 1299, 1199, 1099, 999, 899, 849, 749, 699, 649, 599]);
    const allPrices: number[] = [];

    let priceMatch: RegExpExecArray | null;
    while ((priceMatch = allPricePattern.exec(text)) !== null) {
      const rawNum = priceMatch[1].replace(/,/g, '');
      const val = parseFloat(rawNum);
      if (!isNaN(val) && val >= 200 && val <= 50000) {
        allPrices.push(val);
      } else if (!isNaN(val) && knownPriceValues.has(val)) {
        allPrices.push(val);
      }
    }

    // Also try standalone known price values (e.g. bare "999" without ₹ prefix)
    for (const kp of knownPriceValues) {
      const barePattern = new RegExp(`\\b${kp}\\b(?!\\s*%)`, 'g');
      if (barePattern.test(text) && !allPrices.includes(kp)) {
        allPrices.push(kp);
      }
    }

    if (allPrices.length > 0) {
      // Detect "Was X / Now Y" or "Original X / Sale Y" or "MRP X / Price Y" patterns
      const wasNowPattern = /(?:was|original|mrp|from|old\s*price|earlier)[^₹\d]*(?:₹\s*)?([0-9]{1,2},[0-9]{3}|[0-9]{3,5})[^₹\d]*(?:now|sale|offer|price|our\s*price|new\s*price|today)[^₹\d]*(?:₹\s*)?([0-9]{1,2},[0-9]{3}|[0-9]{3,5})/i;
      const wasNowMatch = text.match(wasNowPattern);

      if (wasNowMatch) {
        // "Was X Now Y" pattern: Y is the selling price
        const sellingPriceRaw = wasNowMatch[2].replace(/,/g, '');
        const sellingVal = parseFloat(sellingPriceRaw);
        if (!isNaN(sellingVal)) {
          detectedPrice = sellingVal;
        }
      } else if (allPrices.length >= 2) {
        // Multiple prices without explicit Was/Now — the lowest is likely the selling price
        // (common in ad layouts: crossed-out higher price + prominent lower price)
        detectedPrice = Math.min(...allPrices);
      } else {
        // Single price — use it directly
        detectedPrice = allPrices[0];
      }

      if (detectedPrice !== undefined) {
        advertisedPriceFormatted = `₹${detectedPrice.toLocaleString('en-IN')}`;
      }
    }


    // D. Detect Fabric Composition
    let detectedComposition: string | undefined;
    const compRegex = /\b(\d+%\s*cotton(?:\s*,\s*\d+%\s*(?:polyester|elastane|viscose|linen))?|100%\s*cotton|pure\s*cotton|cotton-rich\s*blend|cotton-polyester\s*blend|cotton-stretch\s*blend)\b/i;
    const compMatch = text.match(compRegex);
    if (compMatch) {
      detectedComposition = compMatch[0].trim();
    }

    // E. Detect Fit
    let detectedFit: string | undefined;
    if (lower.includes('regular fit')) detectedFit = 'Regular fit';
    else if (lower.includes('relaxed fit')) detectedFit = 'Relaxed fit';
    else if (lower.includes('slim straight fit')) detectedFit = 'Slim straight fit';

    // F. Detect Performance Claims
    const performanceClaims: string[] = [];
    const claimKeywords = [
      'wrinkle-proof',
      'wrinkle proof',
      'shrink-proof',
      'shrink proof',
      'hypoallergenic',
      'sweat-proof',
      'sweat proof',
      'odour-proof',
      'odour proof',
      'stain-proof',
      'stain proof',
      'waterproof',
      'water proof',
      'fade-proof',
      'fade proof',
      'stays perfectly smooth',
      'breathable',
      'all-weather',
      'thermal'
    ];

    for (const kw of claimKeywords) {
      if (lower.includes(kw)) {
        performanceClaims.push(kw);
      }
    }

    // G. Detect Delivery Statements
    const deliveryStatements: string[] = [];
    if (
      lower.includes('delivered tomorrow') ||
      lower.includes('guaranteed') ||
      lower.includes('next-day delivery') ||
      lower.includes('next day delivery') ||
      lower.includes('order today. delivered tomorrow') ||
      lower.includes('order today')
    ) {
      const deliveryMatch = text.match(/([^\n.!?]*(?:delivered|delivery|dispatch|carrier|tomorrow|guaranteed)[^\n.!?]*[.!?]?)/gi);
      if (deliveryMatch) {
        deliveryMatch.forEach(m => {
          const trimmed = m.trim();
          if (trimmed.length > 5 && !deliveryStatements.includes(trimmed)) {
            deliveryStatements.push(trimmed);
          }
        });
      }
      if (deliveryStatements.length === 0) {
        deliveryStatements.push('Guaranteed next-day delivery');
      }
    }

    // H. Detect Campaign References & Conditions
    const campaignReferences: string[] = [];
    const campRegex = /\b(CMP-\d{2}-\d{3})\b/i;
    const campMatch = text.match(campRegex);
    if (campMatch) {
      campaignReferences.push(campMatch[1].toUpperCase());
    }
    if (metadata?.campaignId && !campaignReferences.includes(metadata.campaignId)) {
      campaignReferences.push(metadata.campaignId);
    }

    let conditionsText: string | undefined;
    if (
      lower.includes('selected sizes only') ||
      lower.includes('price shown at checkout') ||
      lower.includes('while campaign stock lasts') ||
      lower.includes('valid till') ||
      lower.includes('offer ends')
    ) {
      const condLines = text.split('\n').filter(l =>
        l.toLowerCase().includes('selected sizes') ||
        l.toLowerCase().includes('checkout') ||
        l.toLowerCase().includes('campaign price') ||
        l.toLowerCase().includes('offer ends') ||
        l.toLowerCase().includes('valid')
      );
      conditionsText = condLines.join('; ').trim();
    }

    // I. Detect Brand Terms
    const brandTerms: string[] = [];
    if (text.includes('NOVAWEAR')) brandTerms.push('NOVAWEAR');
    if (text.includes('NovaWear')) brandTerms.push('NovaWear');
    if (lower.includes('everyday essentials')) brandTerms.push('Everyday essentials');

    return {
      detectedProducts,
      detectedSku,
      detectedPrice,
      advertisedPriceFormatted,
      detectedComposition,
      detectedFit,
      performanceClaims,
      deliveryStatements,
      campaignReferences,
      conditionsText,
      brandTerms,
      confidence: 0.95,
    };
  }

  private async extractWithGemini(
    text: string,
    fallback: Omit<ExtractedAdContent, 'rawText' | 'extractionMethod'>,
    metadata?: AuditSubmissionMetadata,
    apiKey?: string
  ): Promise<Omit<ExtractedAdContent, 'rawText' | 'extractionMethod'>> {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are the content extraction component of Integrix AI, an advertising governance system.
Analyze the following advertisement text extracted from an advertisement creative for brand NOVAWEAR.
Extract accurate facts into strict JSON format according to this schema.

Rules:
1. Do NOT invent missing values.
2. If SKU is present in text or provided metadata (${metadata?.sku || 'none'}), extract it.
3. Extract fabric composition exactly as stated (e.g. "100% cotton", "60% cotton, 40% polyester").
4. Extract advertised price number.
5. Identify all performance claims (e.g., "wrinkle-proof", "breathable", "stain-proof").
6. Identify all delivery promises (e.g., "Guaranteed next-day delivery", "delivered tomorrow").
7. Identify campaign codes or offer conditions (e.g. "selected sizes only", "price shown at checkout").

Ad text:
"""${text}"""

Return a valid JSON object matching:
{
  "detectedProducts": ["product names"],
  "detectedSku": "SKU or null",
  "detectedPrice": number or null,
  "advertisedPriceFormatted": "₹X,XXX or null",
  "detectedComposition": "composition claim or null",
  "detectedFit": "fit or null",
  "performanceClaims": ["claims"],
  "deliveryStatements": ["delivery statements"],
  "campaignReferences": ["campaign IDs"],
  "conditionsText": "qualification text or null",
  "brandTerms": ["brand terms found"],
  "confidence": 0.98
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      detectedProducts: parsed.detectedProducts?.length ? parsed.detectedProducts : fallback.detectedProducts,
      detectedSku: parsed.detectedSku || fallback.detectedSku,
      detectedPrice: parsed.detectedPrice !== null && parsed.detectedPrice !== undefined ? parsed.detectedPrice : fallback.detectedPrice,
      advertisedPriceFormatted: parsed.advertisedPriceFormatted || fallback.advertisedPriceFormatted,
      detectedComposition: parsed.detectedComposition || fallback.detectedComposition,
      detectedFit: parsed.detectedFit || fallback.detectedFit,
      performanceClaims: parsed.performanceClaims?.length ? parsed.performanceClaims : fallback.performanceClaims,
      deliveryStatements: parsed.deliveryStatements?.length ? parsed.deliveryStatements : fallback.deliveryStatements,
      campaignReferences: parsed.campaignReferences?.length ? parsed.campaignReferences : fallback.campaignReferences,
      conditionsText: parsed.conditionsText || fallback.conditionsText,
      brandTerms: parsed.brandTerms?.length ? parsed.brandTerms : fallback.brandTerms,
      confidence: parsed.confidence || 0.95,
    };
  }
}

export const contentExtractor = new ContentExtractor();

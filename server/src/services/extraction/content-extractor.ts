import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';
import { ExtractedAdContent, AuditSubmissionMetadata } from '../../types/index.js';
import { repositoryLoader } from '../ingestion/repository-loader.js';

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
    method: ExtractedAdContent['extractionMethod'] = 'HYBRID'
  ): Promise<ExtractedAdContent> {
    // 1. Run deterministic regex / pattern extraction
    const deterministicData = this.deterministicExtraction(rawText, metadata);

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

  private deterministicExtraction(text: string, metadata?: AuditSubmissionMetadata): Omit<ExtractedAdContent, 'rawText' | 'extractionMethod'> {
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

    // B. Detect Products
    const detectedProducts: string[] = [];
    const products = repositoryLoader.getAllProducts();

    for (const prod of products) {
      if (text.toLowerCase().includes(prod.productName.toLowerCase())) {
        detectedProducts.push(prod.productName);
        if (!detectedSku) detectedSku = prod.sku;
      }
    }

    // Common synonyms / shorthand in ads
    if (lower.includes('classic cotton shirt') || lower.includes('cotton shirt')) {
      if (!detectedProducts.includes('Classic Cotton Shirt')) detectedProducts.push('Classic Cotton Shirt');
      if (!detectedSku) detectedSku = 'NW-CS-001';
    }
    if (lower.includes('everyday oxford shirt') || lower.includes('oxford shirt')) {
      if (!detectedProducts.includes('Everyday Oxford Shirt')) detectedProducts.push('Everyday Oxford Shirt');
      if (!detectedSku) detectedSku = 'NW-CS-002';
    }
    if (lower.includes('core crew tee') || lower.includes('core crew t-shirt')) {
      if (!detectedProducts.includes('Core Crew T-Shirt')) detectedProducts.push('Core Crew T-Shirt');
      if (!detectedSku) detectedSku = 'NW-TS-003';
    }
    if (lower.includes('relaxed weekend tee')) {
      if (!detectedProducts.includes('Relaxed Weekend Tee')) detectedProducts.push('Relaxed Weekend Tee');
      if (!detectedSku) detectedSku = 'NW-TS-004';
    }
    if (lower.includes('everyday chino') || lower.includes('chino')) {
      if (!detectedProducts.includes('Everyday Chino')) detectedProducts.push('Everyday Chino');
      if (!detectedSku) detectedSku = 'NW-TR-005';
    }

    // C. Detect Price
    let detectedPrice: number | undefined;
    let advertisedPriceFormatted: string | undefined;

    // Must ignore percentages like 100%, 20%, 60%
    const pricePatterns = [
      /(?:₹|rs\.?|inr|(?<=\s|^)n)\s*([0-9]{1,2},[0-9]{3}|[0-9]{3,4})(?!\s*%)/i,
      /\b([0-9]{1,2},[0-9]{3})\b(?!\s*%)/,
      /\b(2299|1899|1499|1399|1299|1199|1099|999|899|849|749|649|599)\b(?!\s*%)/
    ];

    for (const pat of pricePatterns) {
      const match = text.match(pat);
      if (match) {
        const rawNum = match[1].replace(/,/g, '');
        const val = parseFloat(rawNum);
        if (!isNaN(val) && val >= 200 && val <= 50000) {
          detectedPrice = val;
          advertisedPriceFormatted = `₹${val.toLocaleString('en-IN')}`;
          break;
        }
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

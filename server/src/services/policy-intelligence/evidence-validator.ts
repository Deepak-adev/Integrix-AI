import { repositoryLoader } from '../ingestion/repository-loader.js';
import type { PolicyContextItem } from './policy-intelligence.types.js';

/**
 * Validates whether proposed excerpts genuinely exist in source documents.
 */
export class EvidenceValidator {
  /**
   * Verify an evidence excerpt against actual loaded documents.
   * If the text or a substantial fuzzy substring exists in the document, returns verified.
   */
  public static verifyExcerpt(
    documentName: string,
    excerpt: string,
    docTexts?: Map<string, string>
  ): { isVerified: boolean; matchedLocator?: string; confidence: number } {
    if (!excerpt || excerpt.trim().length === 0) {
      return { isVerified: false, confidence: 0 };
    }

    const cleanExcerpt = excerpt
      .replace(/["'“”]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    // Check in-memory passed docTexts first
    if (docTexts) {
      for (const [name, text] of docTexts.entries()) {
        if (
          name.toLowerCase().includes(documentName.toLowerCase()) ||
          documentName.toLowerCase().includes(name.toLowerCase())
        ) {
          const normDoc = text.replace(/\s+/g, ' ').toLowerCase();
          if (normDoc.includes(cleanExcerpt)) {
            return { isVerified: true, confidence: 0.98 };
          }
          // Substring partial match (e.g., first 50 chars)
          const sample = cleanExcerpt.slice(0, Math.min(cleanExcerpt.length, 60));
          if (normDoc.includes(sample)) {
            return { isVerified: true, confidence: 0.9 };
          }
        }
      }
    }

    // Check repository loader policy documents
    const docKeys = ['SRC-NW-001', 'SRC-NW-002', 'SRC-NW-003', 'SRC-NW-004'];
    for (const key of docKeys) {
      const doc = repositoryLoader.getPolicyDocument(key);
      if (doc) {
        if (
          doc.filename.toLowerCase().includes(documentName.toLowerCase()) ||
          documentName.toLowerCase().includes(doc.filename.toLowerCase())
        ) {
          const normFull = doc.fullText.replace(/\s+/g, ' ').toLowerCase();
          if (normFull.includes(cleanExcerpt)) {
            // Find specific page
            const page = doc.pages.find(p =>
              p.text.replace(/\s+/g, ' ').toLowerCase().includes(cleanExcerpt.slice(0, 40))
            );
            return {
              isVerified: true,
              matchedLocator: page ? `Page ${page.pageNum}` : undefined,
              confidence: 0.98,
            };
          }
        }
      }
    }

    // If excerpt contains numbers/percentages/ruleIds, check exact token occurrences
    return { isVerified: false, confidence: 0.4 };
  }

  /**
   * Ensure a finding's evidence is robust; if not, flag as isNeedsVerification.
   */
  public static sanitizeFindingEvidence<T extends {
    sourceDocumentName: string;
    evidenceExcerpts: string[];
    isNeedsVerification: boolean;
    confidence: number;
  }>(finding: T, docTexts?: Map<string, string>): T {
    if (!finding.evidenceExcerpts || finding.evidenceExcerpts.length === 0) {
      return {
        ...finding,
        isNeedsVerification: true,
        confidence: Math.min(finding.confidence, 0.5),
      };
    }

    let anyVerified = false;
    for (const excerpt of finding.evidenceExcerpts) {
      const check = this.verifyExcerpt(finding.sourceDocumentName, excerpt, docTexts);
      if (check.isVerified) {
        anyVerified = true;
        break;
      }
    }

    if (!anyVerified) {
      return {
        ...finding,
        isNeedsVerification: true,
        confidence: Math.min(finding.confidence, 0.65),
      };
    }

    return finding;
  }
}

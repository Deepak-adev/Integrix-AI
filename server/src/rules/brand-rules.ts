import { Finding, ExtractedAdContent, AuditSubmissionMetadata } from '../types/index.js';

export function evaluateBrandVoice(
  extracted: ExtractedAdContent,
  metadata?: AuditSubmissionMetadata
): Finding | null {
  const prohibitedTerms = [
    'luxury',
    'revolutionary',
    'life-changing',
    'premium for everyone',
    'fashion that transforms you'
  ];

  const lower = extracted.rawText.toLowerCase();
  for (const term of prohibitedTerms) {
    if (lower.includes(term)) {
      return {
        id: `FIND-BRD-${Date.now()}`,
        ruleId: 'NW-POL-VOI-002',
        policyName: 'Brand voice restrictions',
        status: 'FAIL',
        severity: 'AMBER',
        observedValue: term,
        expectedValue: 'Practical, modern, calm, helpful and unpretentious tone',
        evidenceExcerpt: '01_Brand_Guidelines.pdf (Section 2 & 5): "Avoid: Luxury, revolutionary, life-changing, guaranteed, premium for everyone, fashion that transforms you. NOVAWEAR speaks like a helpful retail associate who knows the product."',
        sourceFilename: '01_Brand_Guidelines.pdf',
        sourceLocator: 'Section 2: Brand identity; Section 5: Brand voice',
        explanation: `The advertisement uses prohibited exaggerated or transformative language ("${term}"). NOVAWEAR brand voice strictly prohibits exaggerated terminology.`,
        suggestedCorrection: `Remove "${term}" and replace with calm, practical product description.`,
        confidence: 0.95,
      };
    }
  }

  return null;
}


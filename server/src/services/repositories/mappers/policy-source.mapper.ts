import type { PolicySource } from '@prisma/client';
import type { PolicySourceRecord } from '../organisation-data.types.js';

/**
 * Map a Prisma PolicySource row to the repository PolicySourceRecord.
 * Extracted text, pages and metadata are preserved exactly as stored; missing
 * content remains null and is never invented.
 */
export function toPolicySourceRecord(source: PolicySource): PolicySourceRecord {
  return {
    sourceId: source.sourceId,
    title: source.title,
    filename: source.filename,
    sourceType: source.sourceType,
    storagePath: source.storagePath,
    mimeType: source.mimeType,
    extractedText: source.extractedText,
    pages: source.pages,
    metadata: source.metadata,
    status: source.status,
    organisationId: source.organisationId,
  };
}

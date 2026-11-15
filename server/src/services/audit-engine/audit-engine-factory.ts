import type { OrganisationContext } from '../../types/index.js';
import { AuditEngine } from './audit-engine.js';
import { createAuditDataSource, type AuditDataSourceMode } from './audit-data-source.js';
import type { OrganisationDataProvider } from '../repositories/organisation-data.provider.js';

export interface CreateAuditEngineOptions {
  mode: AuditDataSourceMode;
  /** Required for database mode; ignored for file mode. Must be a trusted context. */
  context?: OrganisationContext | null;
  /** Optional provider override (tests). */
  provider?: OrganisationDataProvider;
}

/**
 * Explicitly create an AuditEngine backed by the selected data source.
 *
 * This is the trusted server-side orchestration entry point for choosing the
 * audit data source. It is NOT exposed to frontend request parameters. The
 * default production path remains the file-based singleton `auditEngine`.
 * Database mode requires a trusted OrganisationContext and fails closed on
 * retrieval errors.
 */
export async function createAuditEngine(options: CreateAuditEngineOptions): Promise<AuditEngine> {
  const dataSource = await createAuditDataSource({
    mode: options.mode,
    context: options.context,
    provider: options.provider,
  });
  return new AuditEngine(dataSource);
}

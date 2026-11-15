import type { AuditDataSourceMode } from './audit-data-source.interface.js';

/**
 * Server-side audit data-source selection.
 *
 * The mode is read ONLY from the trusted server environment variable
 * `AUDIT_DATA_SOURCE_MODE` (`file` | `database`). It defaults to `file` for
 * backward compatibility. Frontend request parameters can never select or
 * override this mode, and organisation identity always comes from the resolved
 * `OrganisationContext` — never from request bodies.
 *
 * NOTE: The organisation resolver is currently a single-organisation
 * development resolver (configured via ORGANISATION_SLUG). This is temporary
 * until multi-organisation authentication is introduced.
 */
export function getAuditDataSourceMode(): AuditDataSourceMode {
  const raw = (process.env.AUDIT_DATA_SOURCE_MODE || 'file').trim().toLowerCase();
  if (raw === 'database' || raw === 'db') return 'database';
  if (raw === 'file') return 'file';
  throw new Error(`Invalid AUDIT_DATA_SOURCE_MODE "${raw}". Expected "file" or "database".`);
}

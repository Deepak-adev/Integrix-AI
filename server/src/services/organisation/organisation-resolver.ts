import type { OrganisationContext } from '../../types/index.js';
import type { OrganisationStore } from './organisation-store.js';

export type OrganisationResolutionErrorCode =
  | 'ORG_NOT_CONFIGURED'
  | 'ORG_NOT_FOUND'
  | 'ORG_INACTIVE'
  | 'ORG_STORE_ERROR';

/**
 * Error raised when an organisation cannot be resolved to a trusted context.
 * Messages are intentionally generic so that no information about other
 * organisations is leaked to callers.
 */
export class OrganisationResolutionError extends Error {
  public readonly code: OrganisationResolutionErrorCode;

  constructor(code: OrganisationResolutionErrorCode, message: string) {
    super(message);
    this.name = 'OrganisationResolutionError';
    this.code = code;
  }
}

export interface OrganisationResolverOptions {
  store: OrganisationStore;
  /**
   * Slug of the organisation to resolve. Defaults to the ORGANISATION_SLUG
   * environment variable, falling back to the single-organisation demo value.
   */
  configuredSlug?: string;
  /** Cache lifetime in milliseconds. Use 0 to disable caching. */
  cacheTtlMs?: number;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * TEMPORARY single-organisation development resolver.
 *
 * This resolves the configured organisation server-side and is NOT an
 * authentication or membership mechanism. It exists so the backend can carry a
 * trusted tenant context while authentication is not yet implemented. It must
 * be replaced by membership-based resolution once users and sessions exist.
 *
 * The resolver never reads organisation identifiers from request data; callers
 * supply only the configured slug (server-side configuration).
 */
export class OrganisationResolver {
  private readonly store: OrganisationStore;
  private readonly configuredSlug: string;
  private readonly cacheTtlMs: number;
  private readonly now: () => number;
  private cache: { context: OrganisationContext; expiresAt: number } | null = null;

  constructor(options: OrganisationResolverOptions) {
    this.store = options.store;
    this.configuredSlug = (
      options.configuredSlug ??
      process.env.ORGANISATION_SLUG ??
      'novawear'
    ).trim().toLowerCase();
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    this.now = options.now ?? (() => Date.now());
  }

  /**
   * Resolve the configured organisation to a trusted context.
   * Results are cached for cacheTtlMs to avoid repeated database queries.
   */
  public async resolve(): Promise<OrganisationContext> {
    const now = this.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.context;
    }

    if (!this.configuredSlug) {
      throw new OrganisationResolutionError(
        'ORG_NOT_CONFIGURED',
        'No organisation is configured for resolution.'
      );
    }

    let record;
    try {
      record = await this.store.findBySlug(this.configuredSlug);
    } catch {
      throw new OrganisationResolutionError(
        'ORG_STORE_ERROR',
        'Organisation could not be resolved.'
      );
    }

    if (!record) {
      throw new OrganisationResolutionError(
        'ORG_NOT_FOUND',
        'Organisation could not be resolved.'
      );
    }

    if (record.status !== 'ACTIVE') {
      throw new OrganisationResolutionError(
        'ORG_INACTIVE',
        'Organisation is not active.'
      );
    }

    const context: OrganisationContext = {
      organisationId: record.id,
      organisationSlug: record.slug,
      organisationName: record.name,
    };

    if (this.cacheTtlMs > 0) {
      this.cache = { context, expiresAt: now + this.cacheTtlMs };
    }

    return context;
  }

  /** Clear the cached context (e.g. after organisation status changes). */
  public invalidate(): void {
    this.cache = null;
  }
}

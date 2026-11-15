export type AuditPersistenceErrorCode =
  | 'ORG_CONTEXT_REQUIRED'
  | 'SUBMISSION_CONFLICT'
  | 'RELEASE_NOT_FOUND'
  | 'VALIDATION'
  | 'DATABASE';

/** Typed error for audit persistence failures. Messages are safe to surface. */
export class AuditPersistenceError extends Error {
  public readonly code: AuditPersistenceErrorCode;

  constructor(code: AuditPersistenceErrorCode, message: string) {
    super(message);
    this.name = 'AuditPersistenceError';
    this.code = code;
  }
}

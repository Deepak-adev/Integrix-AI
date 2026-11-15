import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { randomUUID } from 'crypto';
import { AuditPersistenceError } from './audit-persistence.errors.js';

export interface StoredAuditFile {
  storagePath: string;
  contentHash: string;
  fileName: string;
  fileSize: number;
}

export interface StoredFileInfo {
  storagePath: string;
  fileName: string;
  fileSize: number;
  mtime: Date;
  isTempMarker?: boolean;
}

export interface AuditFileStorage {
  save(organisationId: string, submissionId: string, content: Buffer, originalName?: string): Promise<StoredAuditFile>;
  resolve(storagePath: string): string;
  remove(storagePath: string): Promise<boolean>;
  listFiles(organisationId: string): Promise<StoredFileInfo[]>;
  removeEmptyDir(dirRelPath: string): Promise<void>;
  getBaseDir(): string;
}

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp']);
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

function safeExtension(originalName?: string): string {
  const ext = originalName ? path.extname(originalName).toLowerCase() : '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new AuditPersistenceError('VALIDATION', `File type not allowed: ${ext || '(none)'}`);
  }
  return ext;
}

/**
 * Controlled persistent local storage for audit creatives.
 *
 * - Files are stored OUTSIDE any publicly served directory (default
 *   `<cwd>/storage/audits`, not `uploads/` or `public/`).
 * - Storage identifiers are generated (UUID), never derived from user paths.
 * - All resolved paths are verified to stay within the base directory.
 * - Binary content is never stored in PostgreSQL; only storagePath + hash.
 */
export class LocalAuditFileStorage implements AuditFileStorage {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = path.resolve(baseDir ?? path.join(process.cwd(), 'storage', 'audits'));
  }

  getBaseDir(): string {
    return this.baseDir;
  }

  private resolveSafe(storagePath: string): string {
    const resolved = path.resolve(this.baseDir, storagePath);
    if (!resolved.startsWith(this.baseDir + path.sep) && resolved !== this.baseDir) {
      throw new AuditPersistenceError('VALIDATION', 'Invalid storage path.');
    }
    return resolved;
  }

  async save(
    organisationId: string,
    submissionId: string,
    content: Buffer,
    originalName?: string
  ): Promise<StoredAuditFile> {
    if (!content || content.length === 0) {
      throw new AuditPersistenceError('VALIDATION', 'File content is empty.');
    }
    if (content.length > MAX_FILE_SIZE_BYTES) {
      throw new AuditPersistenceError('VALIDATION', 'File exceeds maximum size of 20 MB.');
    }
    const ext = safeExtension(originalName);
    const contentHash = crypto.createHash('sha256').update(content).digest('hex');
    const storageId = randomUUID();
    const relPath = path.join(organisationId, submissionId, `${storageId}${ext}`);
    const absPath = this.resolveSafe(relPath);

    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content);

    return {
      storagePath: relPath.split(path.sep).join('/'),
      contentHash,
      fileName: originalName ? path.basename(originalName) : `${storageId}${ext}`,
      fileSize: content.length,
    };
  }

  resolve(storagePath: string): string {
    return this.resolveSafe(storagePath);
  }

  async remove(storagePath: string): Promise<boolean> {
    const absPath = this.resolveSafe(storagePath);
    try {
      await fs.promises.unlink(absPath);
      return true;
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return false;
      }
      throw err;
    }
  }

  /**
   * List all stored files for a specific organisation.
   * Scoped strictly to <baseDir>/<organisationId>/.
   * Guaranteed never to traverse outside organisation root.
   */
  async listFiles(organisationId: string): Promise<StoredFileInfo[]> {
    if (!organisationId || organisationId.includes('..') || organisationId.includes('/') || organisationId.includes('\\')) {
      throw new AuditPersistenceError('VALIDATION', 'Invalid organisationId for storage listing.');
    }

    const orgDir = this.resolveSafe(organisationId);
    if (!fs.existsSync(orgDir)) {
      return [];
    }

    const results: StoredFileInfo[] = [];

    // Traverse submission subdirectories within orgDir
    const entries = await fs.promises.readdir(orgDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const subDir = path.join(orgDir, entry.name);
        const subFiles = await fs.promises.readdir(subDir, { withFileTypes: true });
        for (const file of subFiles) {
          if (file.isFile()) {
            const filePath = path.join(subDir, file.name);
            const stat = await fs.promises.stat(filePath);
            const rel = path.relative(this.baseDir, filePath).split(path.sep).join('/');
            results.push({
              storagePath: rel,
              fileName: file.name,
              fileSize: stat.size,
              mtime: stat.mtime,
              isTempMarker: file.name.endsWith('.tmp') || file.name.endsWith('.part'),
            });
          }
        }
      } else if (entry.isFile()) {
        // Files placed directly in org root
        const filePath = path.join(orgDir, entry.name);
        const stat = await fs.promises.stat(filePath);
        const rel = path.relative(this.baseDir, filePath).split(path.sep).join('/');
        results.push({
          storagePath: rel,
          fileName: entry.name,
          fileSize: stat.size,
          mtime: stat.mtime,
          isTempMarker: entry.name.endsWith('.tmp') || entry.name.endsWith('.part'),
        });
      }
    }

    return results;
  }

  /**
   * Safely removes empty submission directories inside an organisation directory.
   */
  async removeEmptyDir(dirRelPath: string): Promise<void> {
    const absPath = this.resolveSafe(dirRelPath);
    try {
      const contents = await fs.promises.readdir(absPath);
      if (contents.length === 0) {
        await fs.promises.rmdir(absPath);
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT' && err.code !== 'ENOTEMPTY') throw err;
    }
  }
}

/** Default persistent storage rooted at <cwd>/storage/audits (outside public dirs). */
export const auditFileStorage = new LocalAuditFileStorage();

import fs from 'fs';

/**
 * Asynchronously removes a temporary file (best-effort).
 * Silently ignores ENOENT (already deleted).
 */
export function cleanupTempFile(filePath: string | undefined): void {
  if (!filePath) return;
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      console.warn(`[Cleanup] Failed to remove temp file ${filePath}:`, err.message);
    }
  });
}

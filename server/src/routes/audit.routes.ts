import { Router, Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { auditController } from '../controllers/audit.controller.js';
import { cleanupTempFile } from '../utils/file-cleanup.js';
import { resolveOrganisation } from '../middleware/organisation.middleware.js';

// ─── Upload directory ────────────────────────────────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ─── Security: allowed MIME types and extensions ────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/png',
  'image/jpeg',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg', '.webp']);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function fileFilter(req: Request, file: Express.Multer.File, cb: FileFilterCallback): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    cb(new Error(`File type not allowed. Permitted types: PDF, DOCX, PNG, JPG, WEBP`));
    return;
  }
  cb(null, true);
}

// ─── Multer storage ──────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    // Sanitise original filename: strip directory separators, keep extension
    const safeOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// ─── Multer error handler middleware ─────────────────────────────────────────
function handleUploadError(err: any, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  if (err) {
    res.status(400).json({ error: err.message || 'Upload failed.' });
    return;
  }
  next();
}

// cleanupTempFile is imported from utils/file-cleanup.ts and used by audit.controller.ts
export { cleanupTempFile };

const router = Router();

// Resolve the trusted organisation context for all audit endpoints.
// Client-supplied organisation identifiers are ignored by the middleware.
router.use(resolveOrganisation);

// POST /api/audit/upload — upload advertisement file and execute audit
router.post(
  '/upload',
  (req: Request, res: Response, next: NextFunction) => upload.single('file')(req, res, next),
  handleUploadError,
  (req: Request, res: Response) => auditController.uploadAndAudit(req, res)
);

// POST /api/audit/verify-text — direct text verification
router.post('/verify-text', (req: Request, res: Response) => auditController.auditRawText(req, res));

// POST /api/audit/analyze — AI-powered semantic audit (for Audit Studio frontend)
router.post('/analyze', (req: Request, res: Response) => auditController.analyzeWithAI(req, res));

// GET /api/audit/repository — repository statistics and indexed facts
router.get('/repository', (req: Request, res: Response) => auditController.getRepositoryStats(req, res));

// GET /api/audit/scenarios — acceptance test scenario definitions
router.get('/scenarios', (req: Request, res: Response) => auditController.getAcceptanceScenarios(req, res));

// POST /api/audit/scenarios/run/:id — run a single acceptance scenario
router.post('/scenarios/run/:id', (req: Request, res: Response) => auditController.runScenario(req, res));

// POST /api/audit/scenarios/run-all — run all 7 acceptance scenarios
router.post('/scenarios/run-all', (req: Request, res: Response) => auditController.runAllScenarios(req, res));

// GET /api/audit/sample-files/:filename — serve sample creative files
router.get('/sample-files/:filename', (req: Request, res: Response) => auditController.getSampleCreativeFile(req, res));

export default router;

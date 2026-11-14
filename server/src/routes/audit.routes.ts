import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auditController } from '../controllers/audit.controller.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB limit
});

const router = Router();

// Upload advertisement and execute audit
router.post('/upload', upload.single('file'), (req, res) => auditController.uploadAndAudit(req, res));

// Direct text verification
router.post('/verify-text', (req, res) => auditController.auditRawText(req, res));

// Repository statistics and indexed facts
router.get('/repository', (req, res) => auditController.getRepositoryStats(req, res));

// Acceptance test scenarios definitions
router.get('/scenarios', (req, res) => auditController.getAcceptanceScenarios(req, res));

// Run single acceptance scenario
router.post('/scenarios/run/:id', (req, res) => auditController.runScenario(req, res));

// Run all 7 acceptance scenarios
router.post('/scenarios/run-all', (req, res) => auditController.runAllScenarios(req, res));

// Serve sample creative files
router.get('/sample-files/:filename', (req, res) => auditController.getSampleCreativeFile(req, res));

export default router;


import { Router } from 'express';
import { resolveOrganisation } from '../middleware/organisation.middleware.js';
import { policyIntelligenceController } from '../controllers/policy-intelligence.controller.js';

const router = Router();

// Resolve trusted organisation context for all policy intelligence endpoints.
// Client-supplied organisation identifiers in body, headers, or query are strictly ignored.
router.use(resolveOrganisation);

// POST /api/policy-intelligence/analyze — Trigger policy intelligence analysis
router.post('/analyze', (req, res) => policyIntelligenceController.analyze(req, res));

// GET /api/policy-intelligence/runs — Analysis runs history
router.get('/runs', (req, res) => policyIntelligenceController.getRuns(req, res));

// GET /api/policy-intelligence/runs/:runId — Analysis run details & findings
router.get('/runs/:runId', (req, res) => policyIntelligenceController.getRunById(req, res));

// GET /api/policy-intelligence/findings — Findings list with category, severity, status filters
router.get('/findings', (req, res) => policyIntelligenceController.getFindings(req, res));

// GET /api/policy-intelligence/staged — Staged recommendations awaiting administrator sign-off
router.get('/staged', (req, res) => policyIntelligenceController.getStagedFindings(req, res));

// POST /api/policy-intelligence/findings/:findingId/review — Review finding (ACCEPT, REJECT, EDIT, DEFER)
router.post('/findings/:findingId/review', (req, res) =>
  policyIntelligenceController.reviewFinding(req, res)
);

// POST /api/policy-intelligence/findings/:findingId/approve-rule — Formal administrator approval/rejection into active rulebook
router.post('/findings/:findingId/approve-rule', (req, res) =>
  policyIntelligenceController.formallyApproveRule(req, res)
);

export default router;

import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { auditEngine, AuditEngine } from '../services/audit-engine/audit-engine.js';
import { createAuditEngine } from '../services/audit-engine/audit-engine-factory.js';
import { getAuditDataSourceMode } from '../services/audit-engine/audit-source-config.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';
import { getProviderStatus } from '../services/ai/ai-provider-factory.js';
import {
  ACCEPTANCE_SCENARIOS,
  runAcceptanceScenario,
  runAllAcceptanceScenarios,
} from '../services/audit-engine/acceptance-scenarios.js';
import { cleanupTempFile } from '../utils/file-cleanup.js';
import { auditPersistenceService } from '../services/audit-persistence/audit-persistence.service.js';
import { AuditPersistenceError } from '../services/audit-persistence/audit-persistence.errors.js';
import { auditFileStorage } from '../services/audit-persistence/file-storage.js';

export class AuditController {
  /**
   * Resolve the audit engine for the current request using the trusted
   * server-side data-source mode and the organisation context attached by the
   * resolveOrganisation middleware. Database mode builds a per-request engine
   * (isolated bundle); file mode reuses the shared file-backed engine.
   */
  private async resolveEngine(req: Request): Promise<AuditEngine> {
    const mode = getAuditDataSourceMode();
    if (mode === 'database') {
      const org = req.organisation;
      if (!org) {
        throw new Error('Organisation context is required for database audit mode.');
      }
      return createAuditEngine({ mode: 'database', context: org });
    }
    await repositoryLoader.initialize();
    return auditEngine;
  }

  public async uploadAndAudit(req: Request, res: Response): Promise<void> {
    const file = req.file;
    try {
      if (!file) {
        res.status(400).json({ error: 'No advertisement file provided.' });
        return;
      }

      const mode = getAuditDataSourceMode();
      const engine = await this.resolveEngine(req);
      const metadata = {
        organisation: req.organisation?.organisationName || 'NOVAWEAR',
        publicationChannel: req.body.publicationChannel,
        publicationDate: req.body.publicationDate || '2026-11-13',
        sku: req.body.sku,
        campaignId: req.body.campaignId,
        submissionId: req.body.submissionId,
      };

      // Validate Target Product SKU if supplied
      const targetSku = metadata.sku;
      if (targetSku) {
        const prod = engine.dataSource.getProductBySku(targetSku);
        if (!prod) {
          res.status(400).json({
            error: `Target product with SKU '${targetSku}' does not exist in the active organisation catalogue.`,
          });
          return;
        }
      }

      // Canonical demo scenario validation: verify scenario & SKU consistency
      const submissionId = metadata.submissionId;
      const scenarioId = req.body.scenarioId;
      const CANONICAL_SCENARIO_MAP: Record<string, string | null> = {
        'SCENARIO-1': 'NW-CS-001',
        'SCENARIO-2': 'NW-CS-001',
        'SCENARIO-3': 'NW-CS-002',
        'SCENARIO-4': 'NW-TS-003',
        'SCENARIO-5': 'NW-TR-005',
        'SCENARIO-6': 'NW-CS-001',
        'SCENARIO-7': null,
        'AD-NW-001': 'NW-CS-001',
        'AD-NW-002': 'NW-CS-001',
        'AD-NW-003': 'NW-CS-002',
        'AD-NW-004': 'NW-TS-003',
        'AD-NW-005': 'NW-TR-005',
        'AD-NW-006': 'NW-CS-001',
        'AD-NW-007': null,
      };

      const matchedKey = scenarioId || (submissionId && CANONICAL_SCENARIO_MAP.hasOwnProperty(submissionId) ? submissionId : null);
      if (matchedKey && CANONICAL_SCENARIO_MAP.hasOwnProperty(matchedKey)) {
        const expectedSku = CANONICAL_SCENARIO_MAP[matchedKey];
        if (expectedSku === null && targetSku) {
          res.status(400).json({
            error: `Scenario '${matchedKey}' is a General Campaign with no product constraint, but SKU '${targetSku}' was provided.`,
          });
          return;
        } else if (expectedSku !== null && targetSku && targetSku !== expectedSku) {
          res.status(400).json({
            error: `Scenario '${matchedKey}' expects target SKU '${expectedSku}', but received '${targetSku}'.`,
          });
          return;
        }
      }

      // Database mode: persist creative + audit transactionally with idempotent replay.
      if (mode === 'database' && req.organisation) {
        const fileBuffer = await fs.promises.readFile(file.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        const submissionId = metadata.submissionId;

        // Idempotent replay: return existing completed audit without re-running OCR/audit.
        if (submissionId) {
          let existing;
          try {
            existing = await auditPersistenceService.getCompletedAuditResult(req.organisation, submissionId, fileHash);
          } catch (err) {
            if (err instanceof AuditPersistenceError && err.code === 'SUBMISSION_CONFLICT') {
              res.status(409).json({ error: 'Submission conflict: submissionId already exists with different content.' });
              return;
            }
            throw err;
          }
          if (existing) {
            res.status(200).json({ ...existing, persisted: true, idempotentReplay: true, submissionId });
            return;
          }
        }

        const result = await engine.auditFile(file.path, file.mimetype, file.originalname, metadata);

        // Preserve the original creative in controlled persistent storage.
        let stored;
        try {
          stored = await auditFileStorage.save(req.organisation.organisationId, result.submissionId, fileBuffer, file.originalname);
        } catch (err) {
          console.error('[AuditController] Creative storage failed:', err);
          res.status(500).json({ error: 'Creative storage failed' });
          return;
        }

        let persisted;
        try {
          persisted = await auditPersistenceService.persistAudit(req.organisation, {
            result,
            content: fileBuffer,
            dataSourceMode: 'database',
            metadata,
            file: {
              fileName: stored.fileName,
              fileType: path.extname(file.originalname).toLowerCase(),
              fileSize: stored.fileSize,
              mimeType: file.mimetype,
              storagePath: stored.storagePath,
            },
          });
        } catch (err) {
          // DB failed after storage succeeded: remove the unreferenced creative.
          await auditFileStorage.remove(stored.storagePath).catch((cleanupErr) => {
            console.error('[AuditController] Creative cleanup after DB failure failed:', cleanupErr);
          });
          if (err instanceof AuditPersistenceError && err.code === 'SUBMISSION_CONFLICT') {
            res.status(409).json({ error: 'Submission conflict: submissionId already exists with different content.' });
            return;
          }
          console.error('[AuditController] Audit persistence failed:', err);
          res.status(500).json({ error: 'Audit persistence failed' });
          return;
        }

        // Concurrent duplicate: our stored file is unreferenced; remove it safely.
        if (persisted.idempotentReplay) {
          await auditFileStorage.remove(stored.storagePath).catch((cleanupErr) => {
            console.warn('[AuditController] Cleanup of duplicate stored file failed:', cleanupErr);
          });
        }

        res.status(200).json({
          ...result,
          persisted: true,
          idempotentReplay: persisted.idempotentReplay,
          submissionId: persisted.submissionId,
        });
        return;
      }

      const result = await engine.auditFile(
        file.path,
        file.mimetype,
        file.originalname,
        metadata
      );

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[AuditController] Error during audit:', err);
      res.status(500).json({ error: 'Audit execution failed', details: err.message });
    } finally {
      // Always clean up the temporary upload file
      cleanupTempFile(file?.path);
    }
  }

  public async auditRawText(req: Request, res: Response): Promise<void> {
    try {
      const { text, metadata } = req.body;
      if (!text) {
        res.status(400).json({ error: 'Text content is required.' });
        return;
      }

      const engine = await this.resolveEngine(req);
      const { contentExtractor } = await import('../services/extraction/content-extractor.js');
      const extracted = await contentExtractor.parseContent(text, metadata, 'PDF_TEXT', engine.dataSource);
      const result = engine.evaluateExtractedContent(extracted, 'manual_submission.txt', metadata);

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[AuditController] Error during raw text audit:', err);
      res.status(500).json({ error: 'Text audit execution failed', details: err.message });
    }
  }

  /**
   * AI-powered audit analysis endpoint.
   * Runs deterministic rules + optional AI semantic analysis.
   * Falls back to deterministic-only if AI provider is unavailable.
   */
  public async analyzeWithAI(req: Request, res: Response): Promise<void> {
    try {
      const { text, metadata } = req.body;
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'Text content is required. Provide { text: string, metadata?: object }' });
        return;
      }

      const mode = getAuditDataSourceMode();
      const engine = await this.resolveEngine(req);

      // Validate Target Product SKU if supplied
      const targetSku = metadata?.sku;
      if (targetSku) {
        const prod = engine.dataSource.getProductBySku(targetSku);
        if (!prod) {
          res.status(400).json({
            error: `Target product with SKU '${targetSku}' does not exist in the active organisation catalogue.`,
          });
          return;
        }
      }

      // Canonical demo scenario validation: verify scenario & SKU consistency
      const submissionId = metadata?.submissionId;
      const scenarioId = metadata?.scenarioId;
      const CANONICAL_SCENARIO_MAP: Record<string, string | null> = {
        'SCENARIO-1': 'NW-CS-001',
        'SCENARIO-2': 'NW-CS-001',
        'SCENARIO-3': 'NW-CS-002',
        'SCENARIO-4': 'NW-TS-003',
        'SCENARIO-5': 'NW-TR-005',
        'SCENARIO-6': 'NW-CS-001',
        'SCENARIO-7': null,
        'AD-NW-001': 'NW-CS-001',
        'AD-NW-002': 'NW-CS-001',
        'AD-NW-003': 'NW-CS-002',
        'AD-NW-004': 'NW-TS-003',
        'AD-NW-005': 'NW-TR-005',
        'AD-NW-006': 'NW-CS-001',
        'AD-NW-007': null,
      };

      const matchedKey = scenarioId || (submissionId && CANONICAL_SCENARIO_MAP.hasOwnProperty(submissionId) ? submissionId : null);
      if (matchedKey && CANONICAL_SCENARIO_MAP.hasOwnProperty(matchedKey)) {
        const expectedSku = CANONICAL_SCENARIO_MAP[matchedKey];
        if (expectedSku === null && targetSku) {
          res.status(400).json({
            error: `Scenario '${matchedKey}' is a General Campaign with no product constraint, but SKU '${targetSku}' was provided.`,
          });
          return;
        } else if (expectedSku !== null && targetSku && targetSku !== expectedSku) {
          res.status(400).json({
            error: `Scenario '${matchedKey}' expects target SKU '${expectedSku}', but received '${targetSku}'.`,
          });
          return;
        }
      }

      // Database mode: idempotent replay for an identical completed submission.
      const subId = metadata?.submissionId;
      const contentHash = crypto.createHash('sha256').update(text.trim()).digest('hex');
      if (mode === 'database' && subId && req.organisation) {
        let existing;
        try {
          existing = await auditPersistenceService.getCompletedAuditResult(req.organisation, subId, contentHash);
        } catch (err) {
          if (err instanceof AuditPersistenceError && err.code === 'SUBMISSION_CONFLICT') {
            res.status(409).json({ error: 'Submission conflict: submissionId already exists with different content.' });
            return;
          }
          throw err;
        }
        if (existing) {
          const providerStatus = getProviderStatus();
          res.status(200).json({
            ...existing,
            persisted: true,
            idempotentReplay: true,
            submissionId: subId,
            providerStatus: {
              auditProvider: providerStatus.auditProvider,
              auditAvailable: providerStatus.auditAvailable,
              mode: providerStatus.auditAvailable ? 'ai_enhanced' : 'deterministic_only',
            },
          });
          return;
        }
      }

      const result = await engine.analyzeText(text.trim(), metadata);

      // Database mode: persist the completed audit transactionally.
      if (mode === 'database' && req.organisation) {
        let persisted;
        try {
          persisted = await auditPersistenceService.persistAudit(req.organisation, {
            result,
            content: text.trim(),
            dataSourceMode: 'database',
            metadata,
          });
        } catch (err) {
          if (err instanceof AuditPersistenceError && err.code === 'SUBMISSION_CONFLICT') {
            res.status(409).json({ error: 'Submission conflict: submissionId already exists with different content.' });
            return;
          }
          console.error('[AuditController] Audit persistence failed:', err);
          res.status(500).json({ error: 'Audit persistence failed' });
          return;
        }
        const providerStatus = getProviderStatus();
        res.status(200).json({
          ...result,
          persisted: true,
          idempotentReplay: persisted.idempotentReplay,
          submissionId: persisted.submissionId,
          providerStatus: {
            auditProvider: providerStatus.auditProvider,
            auditAvailable: providerStatus.auditAvailable,
            mode: providerStatus.auditAvailable ? 'ai_enhanced' : 'deterministic_only',
          },
        });
        return;
      }

      // Include provider status in response (no secrets)
      const providerStatus = getProviderStatus();
      res.status(200).json({
        ...result,
        providerStatus: {
          auditProvider: providerStatus.auditProvider,
          auditAvailable: providerStatus.auditAvailable,
          mode: providerStatus.auditAvailable ? 'ai_enhanced' : 'deterministic_only',
        },
      });
    } catch (err: any) {
      console.error('[AuditController] Error during AI analysis:', err);
      res.status(500).json({ error: 'Audit analysis failed', details: err.message });
    }
  }

  public async getRepositoryStats(req: Request, res: Response): Promise<void> {
    // File-mode-only endpoint: it reads the global NOVAWEAR file repository.
    // In database mode we isolate it rather than return misleading cross-org data.
    if (getAuditDataSourceMode() === 'database') {
      res.status(501).json({ error: 'Repository statistics endpoint is file-mode only in this phase.' });
      return;
    }
    try {
      await repositoryLoader.initialize();
      res.status(200).json({
        organisation: 'NOVAWEAR (NovaWear Retail Private Limited)',
        referenceDate: '2026-11-13',
        products: repositoryLoader.getAllProducts(),
        campaigns: repositoryLoader.getAllCampaigns(),
        rules: repositoryLoader.getAllRules(),
        indexedPolicies: [
          { id: 'SRC-NW-001', name: '01_Brand_Guidelines.pdf', status: 'Indexed' },
          { id: 'SRC-NW-002', name: '02_Company_Profile.pdf', status: 'Indexed' },
          { id: 'SRC-NW-003', name: '03_Marketing_and_Communication_Policy.pdf', status: 'Indexed' },
          { id: 'SRC-NW-004', name: '04_Product_and_Customer_Information_Policy.pdf', status: 'Indexed' },
          { id: 'SRC-NW-005', name: '05_Product_Catalogue_and_Campaigns.xlsx', status: 'Indexed' },
        ],
        aiProvider: getProviderStatus(),
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve repository stats', details: err.message });
    }
  }

  public getAcceptanceScenarios(req: Request, res: Response): void {
    res.status(200).json({
      scenarios: ACCEPTANCE_SCENARIOS,
      discrepancyDocumentation: {
        issue: 'Discrepancy in Advertisement ID assignments between Sample Advertisement Test Pack (PDF) and Expected Audit Results (DOCX)',
        detail: 'The Sample Advertisement Test Pack v0.1 defines AD-NW-001 as Compliant Product Ad and AD-NW-007 as Delivery Guarantee. In contrast, Expected Audit Results v0.1 defines AD-NW-001 as Price Mismatch and AD-NW-007 as Compliant Product Ad.',
        solution: 'Integrix AI preserves both ID spaces, maps them explicitly, and deterministically audits content against actual repository facts.',
      },
    });
  }

  public async runScenario(req: Request, res: Response): Promise<void> {
    // Canonical acceptance scenarios are file-mode-only (they assert the
    // file-based NOVAWEAR rulebook). Isolate in database mode.
    if (getAuditDataSourceMode() === 'database') {
      res.status(501).json({ error: 'Acceptance scenario execution is file-mode only in this phase.' });
      return;
    }
    try {
      const scenarioId = req.params.id;
      const result = await runAcceptanceScenario(scenarioId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  public async runAllScenarios(req: Request, res: Response): Promise<void> {
    if (getAuditDataSourceMode() === 'database') {
      res.status(501).json({ error: 'Acceptance scenario execution is file-mode only in this phase.' });
      return;
    }
    try {
      const results = await runAllAcceptanceScenarios();
      res.status(200).json(results);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to run all scenarios', details: err.message });
    }
  }

  public async getSampleCreativeFile(req: Request, res: Response): Promise<void> {
    const filename = req.params.filename;
    // Sanitize: basename only, then verify the resolved path stays within docsDir
    const safeName = path.basename(filename);
    const docsDir = path.join(process.cwd(), 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives');
    const filePath = path.resolve(docsDir, safeName);

    // Path traversal guard
    if (!filePath.startsWith(path.resolve(docsDir))) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Sample creative file not found.' });
    }
  }
}

export const auditController = new AuditController();


import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { auditEngine } from '../services/audit-engine/audit-engine.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';
import {
  ACCEPTANCE_SCENARIOS,
  runAcceptanceScenario,
  runAllAcceptanceScenarios,
} from '../services/audit-engine/acceptance-scenarios.js';

export class AuditController {
  public async uploadAndAudit(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'No advertisement file provided.' });
        return;
      }

      const metadata = {
        organisation: req.body.organisation || 'NOVAWEAR',
        publicationChannel: req.body.publicationChannel,
        publicationDate: req.body.publicationDate || '2026-11-13',
        sku: req.body.sku,
        campaignId: req.body.campaignId,
        submissionId: req.body.submissionId,
      };

      const result = await auditEngine.auditFile(
        file.path,
        file.mimetype,
        file.originalname,
        metadata
      );

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[AuditController] Error during audit:', err);
      res.status(500).json({ error: 'Audit execution failed', details: err.message });
    }
  }

  public async auditRawText(req: Request, res: Response): Promise<void> {
    try {
      const { text, metadata } = req.body;
      if (!text) {
        res.status(400).json({ error: 'Text content is required.' });
        return;
      }

      await repositoryLoader.initialize();
      const { contentExtractor } = await import('../services/extraction/content-extractor.js');
      const extracted = await contentExtractor.parseContent(text, metadata, 'PDF_TEXT');
      const result = auditEngine.evaluateExtractedContent(extracted, 'manual_submission.txt', metadata);

      res.status(200).json(result);
    } catch (err: any) {
      console.error('[AuditController] Error during raw text audit:', err);
      res.status(500).json({ error: 'Text audit execution failed', details: err.message });
    }
  }

  public async getRepositoryStats(req: Request, res: Response): Promise<void> {
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
    try {
      const scenarioId = req.params.id;
      const result = await runAcceptanceScenario(scenarioId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }

  public async runAllScenarios(req: Request, res: Response): Promise<void> {
    try {
      const results = await runAllAcceptanceScenarios();
      res.status(200).json(results);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to run all scenarios', details: err.message });
    }
  }

  public async getSampleCreativeFile(req: Request, res: Response): Promise<void> {
    const filename = req.params.filename;
    // Sanitize filename
    const safeName = path.basename(filename);
    const docsDir = path.join(process.cwd(), 'docs', 'NOVAWEAR_Seven_Individual_Ad_Creatives');
    const filePath = path.join(docsDir, safeName);

    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: 'Sample creative file not found.' });
    }
  }
}

export const auditController = new AuditController();


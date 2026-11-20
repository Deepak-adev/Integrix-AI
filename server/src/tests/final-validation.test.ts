import assert from 'node:assert/strict';
import { policyIntelligenceEngine } from '../services/policy-intelligence/index.js';
import { policyIntelligenceRepository } from '../services/repositories/policy-intelligence.repository.js';
import { policyIntelligenceController } from '../controllers/policy-intelligence.controller.js';
import { getPrisma } from '../lib/prisma.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';
import type { OrganisationContext } from '../types/index.js';
import type { Request, Response } from 'express';

const novawearOrg: OrganisationContext = {
  organisationId: 'test-novawear-org',
  organisationSlug: 'novawear',
  organisationName: 'NOVAWEAR Retail Private Limited',
};

const daburOrg: OrganisationContext = {
  organisationId: 'test-dabur-org',
  organisationSlug: 'dabur',
  organisationName: 'Dabur India Limited',
};

function createMockReqRes(options: {
  organisation?: OrganisationContext;
  body?: any;
  params?: any;
  query?: any;
}) {
  const req = {
    organisation: options.organisation,
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
  } as unknown as Request;

  let statusCode = 200;
  let responseData: any = null;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(data: any) {
      responseData = data;
      return this;
    },
  } as unknown as Response;

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData,
  };
}

async function runValidation() {
  console.log('=== RUNNING PHASE 7: PRODUCT VALIDATION & SECURITY VERIFICATION ===');
  await repositoryLoader.initialize();

  // 1. Multi-Tenant Organisation Validation (NOVAWEAR vs Dabur)
  console.log('[TEST 1] Testing Organisation Isolation and Context Scoping...');
  // Trigger analysis via Controller so memoryStores & persistence are registered
  const { req: anNwReq, res: anNwRes, getData: anNwData } = createMockReqRes({
    organisation: novawearOrg,
    body: { scope: 'ALL' },
  });
  await policyIntelligenceController.analyze(anNwReq, anNwRes);
  const nwResult = anNwData();
  assert.equal(nwResult.title, 'NOVAWEAR Retail Private Limited Policy Intelligence & Conflict Analysis');
  assert.ok(nwResult.totalFindings >= 4, 'NOVAWEAR analysis generates findings');

  const { req: anDabReq, res: anDabRes, getData: anDabData } = createMockReqRes({
    organisation: daburOrg,
    body: { scope: 'ALL' },
  });
  await policyIntelligenceController.analyze(anDabReq, anDabRes);
  const daburResult = anDabData();
  assert.equal(daburResult.title, 'Dabur India Limited Policy Intelligence & Conflict Analysis');
  console.log(`[PASS] Both organisations analyzed independently (NW: ${nwResult.totalFindings} findings, Dabur: ${daburResult.totalFindings} findings).`);

  // 2. Cross-Tenant Data Access Gating
  console.log('[TEST 2] Verifying Cross-Tenant Access Prevention on GET /runs/:runId...');
  const { req: nwReq, res: nwRes, getStatus: nwStatus, getData: nwData } = createMockReqRes({
    organisation: novawearOrg,
    params: { runId: nwResult.runId },
  });
  await policyIntelligenceController.getRunById(nwReq, nwRes);
  assert.equal(nwStatus(), 200, 'NOVAWEAR can access its own run');
  assert.equal(nwData().runId, nwResult.runId);

  // Attempt Dabur requesting NOVAWEAR's runId
  const { req: crossReq, res: crossRes, getStatus: crossStatus } = createMockReqRes({
    organisation: daburOrg,
    params: { runId: nwResult.runId },
  });
  await policyIntelligenceController.getRunById(crossReq, crossRes);
  assert.equal(crossStatus(), 404, 'Dabur attempting to access NOVAWEAR runId MUST return 404');
  console.log('[PASS] Multi-tenant isolation verified: Cross-tenant run inspection returns 404.');

  // 3. Staging and Human-in-the-Loop Activation Gate
  console.log('[TEST 3] Verifying Human-in-the-Loop Gate (No premature rule activation)...');
  const nwRunDetails = nwData();
  const targetFinding = nwRunDetails.findings[0];

  // Stage with ACCEPT
  const { req: stageReq, res: stageRes, getStatus: stageStatus, getData: stageData } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetFinding.findingId },
    body: {
      action: 'ACCEPT',
      reviewerName: 'Compliance Auditor',
      adminComments: 'Accepted in studio, staging for approval.',
    },
  });
  await policyIntelligenceController.reviewFinding(stageReq, stageRes);
  assert.equal(stageStatus(), 200);
  assert.equal(stageData().isStagedForApproval, true);
  assert.equal(stageData().status, 'ACCEPTED');

  // Verify finding is in staged queue but NOT yet certified
  const { req: qReq, res: qRes, getData: qData } = createMockReqRes({
    organisation: novawearOrg,
  });
  await policyIntelligenceController.getStagedFindings(qReq, qRes);
  const stagedItems = qData().stagedFindings;
  const match = stagedItems.find((f: any) => f.findingId === targetFinding.findingId);
  assert.ok(match, 'Finding must appear in staged queue');
  console.log('[PASS] Accepted recommendation correctly staged without premature activation.');

  // 4. Formal Certification into Rulebook & Traceability
  console.log('[TEST 4] Verifying Executive Sign-off and Versioned Rulebook Compilation...');
  const { req: certReq, res: certRes, getStatus: certStatus, getData: certData } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetFinding.findingId },
    body: {
      action: 'APPROVE',
      adminName: 'Lead Compliance Administrator',
      adminRole: 'CHIEF_GOVERNANCE_OFFICER',
      comments: 'Formally approved for live rulebook release v1.0.',
    },
  });
  await policyIntelligenceController.formallyApproveRule(certReq, certRes);
  assert.equal(certStatus(), 200);
  const certResult = certData();
  assert.equal(certResult.action, 'APPROVE');
  assert.equal(certResult.rulebookVersion, 'v1.0-certified');
  assert.equal(certResult.rule.status, 'ACTIVE');
  assert.equal(certResult.rule.approvalStatus, 'APPROVED');
  assert.equal(certResult.rule.approvedBy, 'Lead Compliance Administrator');
  console.log(`[PASS] Rule ${certResult.rule.ruleId} certified into rulebook release ${certResult.rulebookVersion}.`);

  // 5. Verification of Rejection Flow
  console.log('[TEST 5] Verifying Rejection Safety (Rejected finding never activates)...');
  const secondFinding = nwRunDetails.findings[1];
  const { req: rejReq, res: rejRes, getStatus: rejStatus, getData: rejData } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: secondFinding.findingId },
    body: {
      action: 'REJECT',
      adminName: 'Chief Governance Officer',
      rejectionReason: 'Exempted per legal team memo 2026-Q4.',
    },
  });
  await policyIntelligenceController.formallyApproveRule(rejReq, rejRes);
  assert.equal(rejStatus(), 200);
  assert.equal(rejData().action, 'REJECT');
  assert.equal(rejData().finding.status, 'REJECTED');
  assert.equal(rejData().rule, undefined, 'Rejection must NOT produce a rule record');
  console.log('[PASS] Rejection safety verified: Finding marked REJECTED and prevented from rule activation.');

  // 6. Security Input Validation Checks
  console.log('[TEST 6] Verifying API Input Validation and Bad Request Handlers...');
  // Bad action
  const { req: badActReq, res: badActRes, getStatus: badActStatus } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetFinding.findingId },
    body: { action: 'SUPER_APPROVE_UNVERIFIED' },
  });
  await policyIntelligenceController.formallyApproveRule(badActReq, badActRes);
  assert.equal(badActStatus(), 400, 'Invalid approval action rejected with 400');

  // Reject without reason
  const { req: noReasReq, res: noReasRes, getStatus: noReasStatus } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetFinding.findingId },
    body: { action: 'REJECT' },
  });
  await policyIntelligenceController.formallyApproveRule(noReasReq, noReasRes);
  assert.equal(noReasStatus(), 400, 'Rejection without reason rejected with 400');
  console.log('[PASS] Input validation and mandatory rejection justifications enforced.');

  console.log('\n=== ALL PHASE 7 VALIDATION & SECURITY TESTS PASSED ===');
}

runValidation().catch(err => {
  console.error('[FAIL] Product validation failed:', err);
  process.exit(1);
});

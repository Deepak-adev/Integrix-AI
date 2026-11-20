import assert from 'node:assert/strict';
import { policyIntelligenceController } from '../controllers/policy-intelligence.controller.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';
import type { Request, Response } from 'express';
import type { OrganisationContext } from '../types/index.js';

const novawearOrg: OrganisationContext = {
  organisationId: 'test-novawear-org',
  organisationSlug: 'novawear',
  organisationName: 'NOVAWEAR Retail Private Limited',
};

const otherOrg: OrganisationContext = {
  organisationId: 'test-other-org',
  organisationSlug: 'other',
  organisationName: 'Other Co',
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

async function runLifecycleTests() {
  console.log('=== RUNNING COMPLETE END-TO-END GOVERNANCE LIFECYCLE TESTS ===');
  await repositoryLoader.initialize();

  // 1. Policy Intelligence Analysis Execution
  console.log('[STEP 1] Running Policy Intelligence Analysis...');
  const { req: reqAn, res: resAn, getStatus: getStatusAn, getData: getDataAn } = createMockReqRes({
    organisation: novawearOrg,
    body: { scope: 'ALL' },
  });
  await policyIntelligenceController.analyze(reqAn, resAn);
  assert.equal(getStatusAn(), 200);
  const analysisData = getDataAn();
  assert.ok(analysisData.totalFindings >= 4, 'Should detect policy findings');
  console.log(`[PASS] Step 1: Policy analysis run generated ${analysisData.totalFindings} findings.`);

  // 2. Fetch Findings & Inspect Conflict
  console.log('[STEP 2] Fetching Findings & selecting Conflict for Review...');
  const { req: reqFind, res: resFind, getStatus: getStatusFind, getData: getDataFind } = createMockReqRes({
    organisation: novawearOrg,
    query: { category: 'CONFLICT' },
  });
  await policyIntelligenceController.getFindings(reqFind, resFind);
  assert.equal(getStatusFind(), 200);
  const findings = getDataFind().findings;
  assert.ok(findings.length >= 1, 'Should have at least 1 conflict finding');
  const targetConflict = findings[0];
  console.log(`[PASS] Step 2: Selected conflict '${targetConflict.findingId}' with status ${targetConflict.status}`);

  // 3. Stage Finding (EDIT action)
  console.log('[STEP 3] Reviewing & Staging Finding with EDITED wording...');
  const customWording = 'All scheduled promotional rates require explicit central merchandising sign-off token.';
  const { req: reqRev, res: resRev, getStatus: getStatusRev, getData: getDataRev } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetConflict.findingId },
    body: {
      action: 'EDIT',
      reviewerName: 'Policy Intelligence Auditor',
      modifiedWording: customWording,
      adminComments: 'Refined wording to mandate approval tokens.',
    },
  });
  await policyIntelligenceController.reviewFinding(reqRev, resRev);
  assert.equal(getStatusRev(), 200);
  const stagedResult = getDataRev();
  assert.equal(stagedResult.status, 'EDITED');
  assert.equal(stagedResult.isStagedForApproval, true);
  console.log('[PASS] Step 3: Finding staged for formal approval without activating prematurely.');

  // 4. Verify Staged Finding Appears in Staged Queue
  console.log('[STEP 4] Querying GET /staged endpoint for Administrator Approval Center...');
  const { req: reqStaged, res: resStaged, getStatus: getStatusStaged, getData: getDataStaged } = createMockReqRes({
    organisation: novawearOrg,
  });
  await policyIntelligenceController.getStagedFindings(reqStaged, resStaged);
  assert.equal(getStatusStaged(), 200);
  const stagedQueue = getDataStaged().stagedFindings;
  const inQueue = stagedQueue.find((f: any) => f.findingId === targetConflict.findingId);
  assert.ok(inQueue, 'Staged finding must be returned in staged queue');
  assert.equal(inQueue.recommendedWording, customWording, 'Must retain administrator-edited wording');
  console.log(`[PASS] Step 4: Staged queue contains ${stagedQueue.length} items. Target finding verified.`);

  // 5. Test Rejection from Approval Center
  console.log('[STEP 5] Testing Formal Rejection in Approval Center...');
  // Second finding for reject test
  const secondFinding = findings.length > 1 ? findings[1] : null;
  if (secondFinding) {
    // Stage it first
    const { req: reqStage2, res: resStage2 } = createMockReqRes({
      organisation: novawearOrg,
      params: { findingId: secondFinding.findingId },
      body: { action: 'ACCEPT', adminComments: 'Awaiting executive sign-off' },
    });
    await policyIntelligenceController.reviewFinding(reqStage2, resStage2);

    // Formally reject it
    const { req: reqRej, res: resRej, getStatus: getStatusRej, getData: getDataRej } = createMockReqRes({
      organisation: novawearOrg,
      params: { findingId: secondFinding.findingId },
      body: {
        action: 'REJECT',
        adminName: 'Chief Governance Officer',
        rejectionReason: 'Exempted by legal counsel for seasonal period.',
      },
    });
    await policyIntelligenceController.formallyApproveRule(reqRej, resRej);
    assert.equal(getStatusRej(), 200);
    const rejData = getDataRej();
    assert.equal(rejData.action, 'REJECT');
    assert.equal(rejData.finding.status, 'REJECTED');
    console.log('[PASS] Step 5: Formally rejected finding marked REJECTED and prevented from activation.');
  }

  // 6. Formally Certify & Approve First Finding into Active Rulebook
  console.log('[STEP 6] Formally Certifying & Approving Rule into Live Rulebook...');
  const { req: reqApprove, res: resApprove, getStatus: getStatusApprove, getData: getDataApprove } = createMockReqRes({
    organisation: novawearOrg,
    params: { findingId: targetConflict.findingId },
    body: {
      action: 'APPROVE',
      adminName: 'Lead Compliance Officer',
      comments: 'Formally certified for live 2026 rulebook v1.0.',
    },
  });
  await policyIntelligenceController.formallyApproveRule(reqApprove, resApprove);
  assert.equal(getStatusApprove(), 200);
  const approveData = getDataApprove();
  assert.equal(approveData.action, 'APPROVE');
  assert.ok(approveData.rule, 'Must produce created/compiled rule record');
  assert.equal(approveData.rule.status, 'ACTIVE');
  assert.equal(approveData.rule.approvalStatus, 'APPROVED');
  assert.equal(approveData.rulebookVersion, 'v1.0-certified');
  assert.equal(approveData.rule.policyStatement, customWording, 'Rule statement matches edited wording');
  console.log(`[PASS] Step 6: Rule ${approveData.rule.ruleId} certified into Rulebook (v1.0-certified).`);

  // 7. Multi-Tenant Isolation for Approval Endpoints
  console.log('[STEP 7] Verifying Multi-Tenant Isolation on Approval Endpoints...');
  const { req: reqIso, res: resIso, getStatus: getStatusIso } = createMockReqRes({
    organisation: otherOrg,
    params: { findingId: targetConflict.findingId },
    body: { action: 'APPROVE' },
  });
  await policyIntelligenceController.formallyApproveRule(reqIso, resIso);
  assert.equal(getStatusIso(), 404, 'Cross-tenant approval attempt must return 404');
  console.log('[PASS] Step 7: Cross-tenant approval request rejected with 404.');

  console.log('\n=== ALL END-TO-END GOVERNANCE LIFECYCLE TESTS PASSED ===');
}

runLifecycleTests().catch(err => {
  console.error('[FAIL] Lifecycle test failed:', err);
  process.exit(1);
});

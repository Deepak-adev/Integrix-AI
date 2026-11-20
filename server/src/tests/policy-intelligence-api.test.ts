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
  organisationName: 'Other Tenant Co',
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

async function runApiTests() {
  console.log('=== RUNNING POLICY INTELLIGENCE API ENDPOINT TESTS ===');
  await repositoryLoader.initialize();

  let createdRunId = '';
  let sampleFindingId = '';

  // 1. POST /api/policy-intelligence/analyze - Validation & Execution
  console.log('[TEST 1] Testing POST /analyze...');
  {
    // 1A. Invalid scope test
    const { req, res, getStatus, getData } = createMockReqRes({
      organisation: novawearOrg,
      body: { scope: 'INVALID_SCOPE' },
    });
    await policyIntelligenceController.analyze(req, res);
    assert.equal(getStatus(), 400, 'Should reject invalid scope with 400');
    assert.ok(getData().error.includes('Invalid analysis scope'), 'Should state invalid scope error');
    console.log('[PASS] Invalid scope rejected with 400');

    // 1B. Missing organisation context
    const { req: reqNoOrg, res: resNoOrg, getStatus: getStatusNoOrg } = createMockReqRes({
      body: { scope: 'ALL' },
    });
    await policyIntelligenceController.analyze(reqNoOrg, resNoOrg);
    assert.equal(getStatusNoOrg(), 400, 'Missing organisation should return 400');
    console.log('[PASS] Missing organisation rejected with 400');

    // 1C. Successful analysis execution
    const { req: reqValid, res: resValid, getStatus: getStatusValid, getData: getDataValid } =
      createMockReqRes({
        organisation: novawearOrg,
        body: { scope: 'ALL' },
      });
    await policyIntelligenceController.analyze(reqValid, resValid);
    assert.equal(getStatusValid(), 200, 'Valid analysis should return 200');
    const data = getDataValid();
    assert.ok(data.runId.startsWith('RUN-PI-'), 'Should return valid runId');
    assert.equal(data.status, 'COMPLETED');
    assert.ok(data.totalFindings >= 4, 'Should return at least 4 findings');
    assert.ok(data.summary.length > 0, 'Should include analysis summary');
    createdRunId = data.runId;
    console.log(`[PASS] Analysis executed successfully (RunId: ${createdRunId}, Findings: ${data.totalFindings})`);
  }

  // 2. GET /api/policy-intelligence/runs - History & Pagination
  console.log('[TEST 2] Testing GET /runs...');
  {
    const { req, res, getStatus, getData } = createMockReqRes({
      organisation: novawearOrg,
      query: { page: '1', limit: '10' },
    });
    await policyIntelligenceController.getRuns(req, res);
    assert.equal(getStatus(), 200);
    const data = getData();
    assert.ok(Array.isArray(data.runs), 'runs should be an array');
    assert.ok(data.total >= 1, 'Total runs should be >= 1');
    assert.ok(data.runs.some((r: any) => r.runId === createdRunId), 'Should include newly created run');
    console.log(`[PASS] Retrieved runs history (Total: ${data.total}, Page: ${data.page})`);
  }

  // 3. GET /api/policy-intelligence/runs/:runId - Details & Isolation
  console.log('[TEST 3] Testing GET /runs/:runId and Tenant Isolation...');
  {
    // 3A. Valid lookup
    const { req, res, getStatus, getData } = createMockReqRes({
      organisation: novawearOrg,
      params: { runId: createdRunId },
    });
    await policyIntelligenceController.getRunById(req, res);
    assert.equal(getStatus(), 200);
    const data = getData();
    assert.equal(data.runId, createdRunId);
    assert.ok(Array.isArray(data.findings), 'Should include findings array');
    assert.ok(data.findings.length > 0, 'Run should have findings');
    sampleFindingId = data.findings[0].findingId;
    console.log(`[PASS] Retrieved run details with ${data.findings.length} findings`);

    // 3B. Cross-tenant isolation check
    const { req: reqOther, res: resOther, getStatus: getStatusOther } = createMockReqRes({
      organisation: otherOrg,
      params: { runId: createdRunId },
    });
    await policyIntelligenceController.getRunById(reqOther, resOther);
    assert.equal(getStatusOther(), 404, 'Cross-tenant request must return 404');
    console.log('[PASS] Multi-tenant isolation verified (Cross-tenant access returned 404)');

    // 3C. Non-existent runId
    const { req: req404, res: res404, getStatus: getStatus404 } = createMockReqRes({
      organisation: novawearOrg,
      params: { runId: 'NON_EXISTENT_RUN_999' },
    });
    await policyIntelligenceController.getRunById(req404, res404);
    assert.equal(getStatus404(), 404);
    console.log('[PASS] Non-existent runId returned 404');
  }

  // 4. GET /api/policy-intelligence/findings - Filters & Pagination
  console.log('[TEST 4] Testing GET /findings with Category & Severity Filters...');
  {
    // 4A. Filter by category=CONFLICT
    const { req: reqConf, res: resConf, getStatus: getStatusConf, getData: getDataConf } =
      createMockReqRes({
        organisation: novawearOrg,
        query: { category: 'CONFLICT' },
      });
    await policyIntelligenceController.getFindings(reqConf, resConf);
    assert.equal(getStatusConf(), 200);
    const confData = getDataConf();
    assert.ok(confData.findings.length >= 1, 'Should find CONFLICT items');
    assert.ok(confData.findings.every((f: any) => f.category === 'CONFLICT'), 'All items must be CONFLICT');
    console.log(`[PASS] Filter by category=CONFLICT passed (${confData.findings.length} items)`);

    // 4B. Filter by severity=HIGH
    const { req: reqHigh, res: resHigh, getStatus: getStatusHigh, getData: getDataHigh } =
      createMockReqRes({
        organisation: novawearOrg,
        query: { severity: 'HIGH' },
      });
    await policyIntelligenceController.getFindings(reqHigh, resHigh);
    assert.equal(getStatusHigh(), 200);
    const highData = getDataHigh();
    assert.ok(highData.findings.every((f: any) => f.severity === 'HIGH'), 'All items must be HIGH severity');
    console.log(`[PASS] Filter by severity=HIGH passed (${highData.findings.length} items)`);

    // 4C. Invalid category filter validation
    const { req: reqBadCat, res: resBadCat, getStatus: getStatusBadCat } = createMockReqRes({
      organisation: novawearOrg,
      query: { category: 'NON_EXISTENT_CAT' },
    });
    await policyIntelligenceController.getFindings(reqBadCat, resBadCat);
    assert.equal(getStatusBadCat(), 400);
    console.log('[PASS] Invalid category filter rejected with 400');
  }

  // 5. POST /api/policy-intelligence/findings/:findingId/review - ACCEPT, REJECT, EDIT, DEFER
  console.log('[TEST 5] Testing POST /findings/:findingId/review (ACCEPT, REJECT, EDIT, DEFER)...');
  {
    // 5A. Invalid action test
    const { req: reqBadAct, res: resBadAct, getStatus: getStatusBadAct } = createMockReqRes({
      organisation: novawearOrg,
      params: { findingId: sampleFindingId },
      body: { action: 'INVALID_ACTION' },
    });
    await policyIntelligenceController.reviewFinding(reqBadAct, resBadAct);
    assert.equal(getStatusBadAct(), 400);
    console.log('[PASS] Invalid action rejected with 400');

    // 5B. REJECT without comment test
    const { req: reqBadReject, res: resBadReject, getStatus: getStatusBadReject } =
      createMockReqRes({
        organisation: novawearOrg,
        params: { findingId: sampleFindingId },
        body: { action: 'REJECT' },
      });
    await policyIntelligenceController.reviewFinding(reqBadReject, resBadReject);
    assert.equal(getStatusBadReject(), 400);
    console.log('[PASS] REJECT without reason rejected with 400');

    // 5C. EDIT action with modified wording
    const { req: reqEdit, res: resEdit, getStatus: getStatusEdit, getData: getDataEdit } =
      createMockReqRes({
        organisation: novawearOrg,
        params: { findingId: sampleFindingId },
        body: {
          action: 'EDIT',
          reviewerName: 'Lead Policy Auditor',
          reviewerRole: 'COMPLIANCE_LEAD',
          modifiedWording: 'Custom revised wording approved by legal team.',
          adminComments: 'Refined language to match 2026 legal framework.',
        },
      });
    await policyIntelligenceController.reviewFinding(reqEdit, resEdit);
    assert.equal(getStatusEdit(), 200);
    const editData = getDataEdit();
    assert.equal(editData.status, 'EDITED');
    assert.equal(editData.finding.recommendedWording, 'Custom revised wording approved by legal team.');
    assert.equal(editData.isStagedForApproval, true);
    console.log('[PASS] EDIT action successfully staged modified wording');

    // 5D. ACCEPT action
    const { req: reqAccept, res: resAccept, getStatus: getStatusAccept, getData: getDataAccept } =
      createMockReqRes({
        organisation: novawearOrg,
        params: { findingId: sampleFindingId },
        body: {
          action: 'ACCEPT',
          reviewerName: 'Head of Compliance',
          adminComments: 'Approved for draft stage integration.',
        },
      });
    await policyIntelligenceController.reviewFinding(reqAccept, resAccept);
    assert.equal(getStatusAccept(), 200);
    const acceptData = getDataAccept();
    assert.equal(acceptData.status, 'ACCEPTED');
    assert.equal(acceptData.isStagedForApproval, true);
    console.log('[PASS] ACCEPT action staged finding without premature activation');

    // 5E. DEFER action
    const { req: reqDefer, res: resDefer, getStatus: getStatusDefer, getData: getDataDefer } =
      createMockReqRes({
        organisation: novawearOrg,
        params: { findingId: sampleFindingId },
        body: {
          action: 'DEFER',
          reviewerName: 'Head of Compliance',
          adminComments: 'Pending review with operations leadership.',
        },
      });
    await policyIntelligenceController.reviewFinding(reqDefer, resDefer);
    assert.equal(getStatusDefer(), 200);
    const deferData = getDataDefer();
    assert.equal(deferData.status, 'DEFERRED');
    assert.equal(deferData.isStagedForApproval, false);
    console.log('[PASS] DEFER action recorded successfully');

    // 5F. REJECT action with reason
    const { req: reqReject, res: resReject, getStatus: getStatusReject, getData: getDataReject } =
      createMockReqRes({
        organisation: novawearOrg,
        params: { findingId: sampleFindingId },
        body: {
          action: 'REJECT',
          reviewerName: 'Head of Compliance',
          rejectionReason: 'Intentional policy boundary exemption.',
        },
      });
    await policyIntelligenceController.reviewFinding(reqReject, resReject);
    assert.equal(getStatusReject(), 200);
    const rejectData = getDataReject();
    assert.equal(rejectData.status, 'REJECTED');
    assert.equal(rejectData.isStagedForApproval, false);
    console.log('[PASS] REJECT action recorded successfully');
  }

  console.log('\n=== ALL POLICY INTELLIGENCE API TESTS PASSED ===');
}

runApiTests().catch(err => {
  console.error('[FAIL] API test failed:', err);
  process.exit(1);
});

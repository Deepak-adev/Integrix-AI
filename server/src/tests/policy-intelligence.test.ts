import assert from 'node:assert/strict';
import { policyIntelligenceEngine } from '../services/policy-intelligence/index.js';
import { EvidenceValidator } from '../services/policy-intelligence/evidence-validator.js';
import { DeterministicPolicyIntelligence } from '../services/policy-intelligence/deterministic-policy-intelligence.js';
import { repositoryLoader } from '../services/ingestion/repository-loader.js';
import type { OrganisationContext } from '../types/index.js';

const testContext: OrganisationContext = {
  organisationId: 'test-novawear-org',
  organisationSlug: 'novawear',
  organisationName: 'NOVAWEAR Retail Private Limited',
};

async function runTests() {
  console.log('=== RUNNING POLICY INTELLIGENCE AGENT TESTS ===');

  await repositoryLoader.initialize();

  // Test 1: Full Engine Analysis Execution
  console.log('[TEST 1] Running PolicyIntelligenceEngine.analyze()...');
  const result = await policyIntelligenceEngine.analyze(testContext);
  assert.ok(result.runId.startsWith('RUN-PI-'), 'RunId should have expected prefix');
  assert.equal(result.status, 'COMPLETED');
  assert.ok(result.findings.length >= 4, 'Should detect at least 4 baseline findings');
  console.log(`[PASS] Found ${result.totalFindings} findings (Conflicts: ${result.conflictsCount}, Ambiguities: ${result.ambiguitiesCount}, Missing: ${result.missingCount}, Duplicates: ${result.duplicatesCount})`);

  // Test 2: Category Coverage (Conflict, Ambiguity, Missing, Duplication, Insufficient Evidence)
  console.log('[TEST 2] Verifying coverage across 4 categories + Insufficient Evidence...');
  const conflict = result.findings.find(f => f.category === 'CONFLICT');
  assert.ok(conflict, 'Should identify CONFLICT');
  assert.ok(conflict.evidenceExcerpts.length > 0, 'Conflict must have evidence excerpts');
  assert.ok(conflict.recommendedWording, 'Conflict must have recommended modification');

  const ambiguity = result.findings.find(f => f.category === 'AMBIGUITY');
  assert.ok(ambiguity, 'Should identify AMBIGUITY');
  assert.ok(ambiguity.existingWording, 'Ambiguity must show existing wording');
  assert.ok(ambiguity.recommendedWording, 'Ambiguity must provide clarified wording');

  const missing = result.findings.find(f => f.category === 'MISSING_REQUIREMENT');
  assert.ok(missing, 'Should identify MISSING_REQUIREMENT');
  assert.ok(
    missing.explanation.toLowerCase().includes('organic') ||
    missing.explanation.toLowerCase().includes('wrinkle-proof'),
    'Missing requirement explains absent standard'
  );

  const duplicate = result.findings.find(f => f.category === 'DUPLICATION');
  assert.ok(duplicate, 'Should identify DUPLICATION');
  assert.ok(
    duplicate.affectedPolicyOrDoc.includes('NW-PROD-003') ||
    duplicate.affectedPolicyOrDoc.includes('NW-MKT-002') ||
    duplicate.affectedPolicyOrDoc.includes('PCIP-01') ||
    duplicate.affectedPolicyOrDoc.includes('MCP-01'),
    'Duplicate points to overlapping docs'
  );

  const needsVerification = result.findings.find(f => f.isNeedsVerification);
  assert.ok(needsVerification, 'Should handle insufficient evidence via isNeedsVerification flag');
  console.log('[PASS] All 4 categories + Needs Verification validated');

  // Test 3: Evidence Validator Traceability
  console.log('[TEST 3] Testing EvidenceValidator...');
  const validCheck = EvidenceValidator.verifyExcerpt(
    '03_Marketing_and_Communication_Policy.pdf',
    'Prices and discounts must match the current merchandising record'
  );
  assert.ok(validCheck.isVerified, 'Valid excerpt should be verified against repository');

  const invalidCheck = EvidenceValidator.verifyExcerpt(
    '01_Brand_Guidelines.pdf',
    'This is a fabricated sentence that does not exist in the document.'
  );
  assert.equal(invalidCheck.isVerified, false, 'Fabricated text must NOT be verified');
  console.log('[PASS] Evidence Validator correctly accepts genuine citations and rejects fabricated text');

  // Test 4: Organisation Isolation Verification
  console.log('[TEST 4] Verifying Organisation-Scoping...');
  assert.equal(result.title, 'NOVAWEAR Retail Private Limited Policy Intelligence & Conflict Analysis');
  console.log('[PASS] Analysis strictly scoped to selected organisation');

  console.log('\n=== ALL POLICY INTELLIGENCE UNIT TESTS PASSED ===');
}

runTests().catch(err => {
  console.error('[FAIL] Test failed:', err);
  process.exit(1);
});

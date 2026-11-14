import { repositoryLoader } from '../server/src/services/ingestion/repository-loader.js';
import { runAllAcceptanceScenarios } from '../server/src/services/audit-engine/acceptance-scenarios.js';

async function main() {
  console.log('===============================================================');
  console.log(' INTEGRIX AI — 7 ACCEPTANCE TEST SCENARIOS VERIFICATION');
  console.log(' CodeNova India 2026 Round 2 — NOVAWEAR Audit Engine');
  console.log('===============================================================\n');

  await repositoryLoader.initialize();
  const summary = await runAllAcceptanceScenarios();

  console.log(`Executed ${summary.scenariosRun} acceptance tests:`);
  console.log(`PASSED: ${summary.passedCount} / ${summary.scenariosRun}`);
  console.log(`FAILED: ${summary.failedCount} / ${summary.scenariosRun}\n`);

  for (const item of summary.results) {
    const s = item.scenario;
    const r = item.result;
    const statusMatch = item.matchesExpected ? '✓ PASS' : '✗ MISMATCH';

    console.log(`---------------------------------------------------------------`);
    console.log(`[${statusMatch}] ${s.id}: ${s.title}`);
    console.log(`  Test Pack ID:         ${s.testPackId}`);
    console.log(`  Expected Results ID:  ${s.expectedAuditDocId}`);
    console.log(`  Target SKU:           ${s.sku || 'N/A'}`);
    console.log(`  Expected Status:      ${s.expectedOutcome}`);
    console.log(`  Actual Audit Status:  ${r.overallStatus}`);
    console.log(`  Findings Count:       ${r.findings.length}`);

    r.findings.forEach((f, idx) => {
      console.log(`    Finding #${idx + 1}:`);
      console.log(`      Rule:       ${f.ruleId} (${f.policyName})`);
      console.log(`      Status:     ${f.status} [Severity: ${f.severity}]`);
      console.log(`      Observed:   ${f.observedValue}`);
      console.log(`      Expected:   ${f.expectedValue}`);
      console.log(`      Source:     ${f.sourceFilename} (${f.sourceLocator})`);
      console.log(`      Reason:     ${f.explanation}`);
      console.log(`      Correction: ${f.suggestedCorrection}`);
    });
    console.log('');
  }

  if (summary.failedCount === 0) {
    console.log('===============================================================');
    console.log(' SUCCESS: ALL 7 ACCEPTANCE SCENARIOS PASSED WITH 100% ACCURACY!');
    console.log('===============================================================');
  } else {
    console.error('FAILURE: Some scenarios failed verification.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running acceptance tests:', err);
  process.exit(1);
});


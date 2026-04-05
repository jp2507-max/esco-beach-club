#!/usr/bin/env node
/**
 * CI test runner. Runs bun test; creates minimal coverage artifacts for Jest Coverage Comment.
 * Used by: .github/workflows/test.yml
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const coverageDir = path.join(process.cwd(), 'coverage');
const minimalCoverage = {
  total: {
    lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
    statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
    functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
    branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
  },
};
const minimalJunit = `<?xml version="1.0" encoding="UTF-8"?><testsuites tests="0" failures="0"></testsuites>`;

try {
  execSync('bun test', { stdio: 'inherit' });
} catch (error) {
  // Preserve artifact generation, but fail the process after writing artifacts.
  // This avoids false-green CI runs when tests fail or are not executed correctly.
  process.exitCode = 1;
  console.error(
    '[test-ci] bun test failed:',
    error instanceof Error ? error.message : String(error)
  );
}

fs.mkdirSync(coverageDir, { recursive: true });
const summaryPath = path.join(coverageDir, 'coverage-summary.json');
if (!fs.existsSync(summaryPath)) {
  fs.writeFileSync(summaryPath, JSON.stringify(minimalCoverage, null, 2));
}

const junitPath = path.join(coverageDir, 'jest-junit.xml');
if (!fs.existsSync(junitPath)) {
  fs.writeFileSync(junitPath, minimalJunit);
}

const txtPath = path.join(coverageDir, 'coverage.txt');
if (!fs.existsSync(txtPath)) {
  fs.writeFileSync(
    txtPath,
    'No coverage data (test infra not fully configured).\n'
  );
}

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}

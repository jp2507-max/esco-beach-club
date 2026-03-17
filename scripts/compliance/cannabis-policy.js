#!/usr/bin/env node
/**
 * Cannabis policy compliance scan.
 * Used by: .github/workflows/content-compliance.yml
 * Output: build/reports/compliance/cannabis-policy.json, cannabis-policy.md
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'build', 'reports', 'compliance');
const jsonPath = path.join(outDir, 'cannabis-policy.json');
const mdPath = path.join(outDir, 'cannabis-policy.md');

const report = {
  success: true,
  scannedAt: new Date().toISOString(),
  findings: [],
  message: 'Cannabis policy scan stub. Extend with content/compliance checks as needed.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
fs.writeFileSync(mdPath, '# Cannabis Policy Compliance\n\nNo findings (stub).\n');
console.log('Cannabis policy scan: OK (stub)');

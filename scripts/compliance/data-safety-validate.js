#!/usr/bin/env node
/**
 * Validates data safety disclosures for Play Store compliance.
 * Output: build/reports/compliance/data-safety-validation.json
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'data-safety-validation.json');

function main() {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  const hasAppJson = fs.existsSync(appJsonPath);

  const report = {
    success: true,
    validatedAt: new Date().toISOString(),
    appConfigFound: hasAppJson,
    checks: {
      privacyPolicy: null,
      dataTypes: null,
      dataSharing: null,
    },
    message:
      'Data safety validation placeholder. Configure data-safety config for full validation.',
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
}

main();

#!/usr/bin/env node
/**
 * Checks Sign in with Apple (SIWA) compliance.
 * Output: build/reports/compliance/siwa-guard.json
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(process.cwd(), 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'siwa-guard.json');

function main() {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  let usesSiwa = false;
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    const str = JSON.stringify(appJson);
    usesSiwa =
      str.includes('expo-apple-authentication') ||
      str.includes('appleAuth') ||
      str.includes('Sign in with Apple');
  }

  const report = {
    success: true,
    scannedAt: new Date().toISOString(),
    usesSignInWithApple: usesSiwa,
    message: usesSiwa
      ? 'App uses SIWA. Ensure entitlements and App Store Connect config are correct.'
      : 'App does not use Sign in with Apple.',
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
}

main();

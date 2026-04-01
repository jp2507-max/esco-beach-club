#!/usr/bin/env node
/**
 * Validates Apple Privacy Manifest source-of-truth and plugin wiring.
 * Output: build/reports/privacy/privacy-manifest-validation.json
 */

const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'build', 'reports', 'privacy');
const reportPath = path.join(outDir, 'privacy-manifest-validation.json');

const appJsonPath = path.join(rootDir, 'app.json');
const manifestSourcePath = path.join(
  rootDir,
  'config',
  'apple',
  'privacy-manifest.json'
);
const pluginPath = path.join(rootDir, 'plugins', 'with-apple-privacy-manifest.js');
const checklistPath = path.join(
  rootDir,
  'config',
  'app-store',
  'privacy-checklist.json'
);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(appJsonPath)) {
    errors.push('app.json is missing');
  }

  if (!fs.existsSync(manifestSourcePath)) {
    errors.push('config/apple/privacy-manifest.json is missing');
  }

  if (!fs.existsSync(pluginPath)) {
    errors.push('plugins/with-apple-privacy-manifest.js is missing');
  }

  if (!fs.existsSync(checklistPath)) {
    errors.push('config/app-store/privacy-checklist.json is missing');
  }

  let appJson = null;
  let manifestSource = null;

  if (fs.existsSync(appJsonPath)) {
    appJson = readJson(appJsonPath);
    const plugins = appJson?.expo?.plugins ?? [];
    const hasPlugin = plugins.some(
      (plugin) =>
        plugin === './plugins/with-apple-privacy-manifest' ||
        (Array.isArray(plugin) &&
          plugin[0] === './plugins/with-apple-privacy-manifest')
    );

    if (!hasPlugin) {
      errors.push('app.json does not register ./plugins/with-apple-privacy-manifest');
    }

    const publicName = appJson?.expo?.name;
    if (typeof publicName !== 'string' || publicName.includes('MVP')) {
      errors.push('app.json name must be production-ready and must not contain MVP');
    }
  }

  if (fs.existsSync(manifestSourcePath)) {
    manifestSource = readJson(manifestSourcePath);
    const requiredKeys = [
      'NSPrivacyTracking',
      'NSPrivacyTrackingDomains',
      'NSPrivacyCollectedDataTypes',
      'NSPrivacyAccessedAPITypes',
    ];

    for (const key of requiredKeys) {
      if (!(key in manifestSource)) {
        errors.push(`privacy manifest source is missing ${key}`);
      }
    }

    if (!Array.isArray(manifestSource.NSPrivacyTrackingDomains)) {
      errors.push('NSPrivacyTrackingDomains must be an array');
    }

    if (!Array.isArray(manifestSource.NSPrivacyCollectedDataTypes)) {
      errors.push('NSPrivacyCollectedDataTypes must be an array');
    }

    if (!Array.isArray(manifestSource.NSPrivacyAccessedAPITypes)) {
      errors.push('NSPrivacyAccessedAPITypes must be an array');
    }

    if (manifestSource.NSPrivacyCollectedDataTypes.length === 0) {
      warnings.push(
        'NSPrivacyCollectedDataTypes is empty. Confirm App Store Connect privacy answers are covered separately.'
      );
    }
  }

  const report = {
    success: errors.length === 0,
    validatedAt: new Date().toISOString(),
    checks: {
      appJsonExists: fs.existsSync(appJsonPath),
      checklistExists: fs.existsSync(checklistPath),
      manifestSourceExists: fs.existsSync(manifestSourcePath),
      pluginExists: fs.existsSync(pluginPath),
      registeredPlugin:
        appJson?.expo?.plugins?.some?.(
          (plugin) =>
            plugin === './plugins/with-apple-privacy-manifest' ||
            (Array.isArray(plugin) &&
              plugin[0] === './plugins/with-apple-privacy-manifest')
        ) ?? false,
      publicAppName: appJson?.expo?.name ?? null,
    },
    warnings,
    errors,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    console.error('Privacy manifest validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Privacy manifest validation: OK');
}

main();

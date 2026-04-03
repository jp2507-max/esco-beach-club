#!/usr/bin/env node
/**
 * Validates iOS App Store submission readiness.
 * Output: build/reports/compliance/ios-submission-readiness.json
 */

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'ios-submission-readiness.json');

const requireReviewArtifacts =
  process.env.REQUIRE_APP_REVIEW_ARTIFACTS === 'true';
const requireIosReleaseEnv = process.env.REQUIRE_IOS_RELEASE_ENV === 'true';
const requireAscAppId = process.env.REQUIRE_ASC_APP_ID === 'true';

function readJson(filePath, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    errors.push(
      `Failed to parse ${path.relative(rootDir, filePath)}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
}

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const values = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    values[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return values;
}

function getMergedEnv() {
  return {
    ...loadDotEnvFile(path.join(rootDir, '.env')),
    ...loadDotEnvFile(path.join(rootDir, '.env.local')),
    ...process.env,
  };
}

function getConfiguredValue(env, key) {
  const value = env[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null;
}

function isGitTracked(relativePath) {
  try {
    execSync(`git ls-files --error-unmatch -- ${relativePath}`, {
      cwd: rootDir,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function addMissingEnvErrors(params) {
  const { env, errors, names, label } = params;
  const missing = names.filter((name) => !getConfiguredValue(env, name));
  if (missing.length > 0) {
    errors.push(`${label} missing: ${missing.join(', ')}`);
  }
  return missing;
}

function main() {
  const errors = [];
  const warnings = [];
  const env = getMergedEnv();

  const appJsonPath = path.join(rootDir, 'app.json');
  const easJsonPath = path.join(rootDir, 'eas.json');
  const storeConfigPath = path.join(rootDir, 'store.config.json');
  const manifestPath = path.join(
    rootDir,
    'config',
    'apple',
    'privacy-manifest.json'
  );
  const privacyChecklistPath = path.join(
    rootDir,
    'config',
    'app-store',
    'privacy-checklist.json'
  );
  const reviewNotesPath = path.join(
    rootDir,
    'docs',
    'app-review',
    'review-notes-template.md'
  );
  const privacyMatrixPath = path.join(
    rootDir,
    'docs',
    'app-review',
    'app-store-privacy-matrix.md'
  );
  const sampleQrPath = path.join(
    rootDir,
    'docs',
    'app-review',
    'sample-member-qr.txt'
  );
  const envPath = path.join(rootDir, '.env');

  if (!fs.existsSync(appJsonPath)) errors.push('app.json is missing');
  if (!fs.existsSync(easJsonPath)) errors.push('eas.json is missing');
  if (!fs.existsSync(storeConfigPath))
    errors.push('store.config.json is missing');
  if (!fs.existsSync(manifestPath)) {
    errors.push('config/apple/privacy-manifest.json is missing');
  }
  if (!fs.existsSync(privacyChecklistPath)) {
    errors.push('config/app-store/privacy-checklist.json is missing');
  }
  if (!fs.existsSync(reviewNotesPath)) {
    errors.push('docs/app-review/review-notes-template.md is missing');
  }
  if (!fs.existsSync(privacyMatrixPath)) {
    errors.push('docs/app-review/app-store-privacy-matrix.md is missing');
  }
  if (!fs.existsSync(sampleQrPath)) {
    errors.push('docs/app-review/sample-member-qr.txt is missing');
  }

  const appJson = fs.existsSync(appJsonPath)
    ? readJson(appJsonPath, errors)
    : null;
  const easJson = fs.existsSync(easJsonPath)
    ? readJson(easJsonPath, errors)
    : null;
  const storeConfig = fs.existsSync(storeConfigPath)
    ? readJson(storeConfigPath, errors)
    : null;
  const privacyManifest = fs.existsSync(manifestPath)
    ? readJson(manifestPath, errors)
    : null;
  const privacyChecklist = fs.existsSync(privacyChecklistPath)
    ? readJson(privacyChecklistPath, errors)
    : null;

  const ascAppId = easJson?.submit?.production?.ios?.ascAppId ?? null;
  const hasAscAppId =
    typeof ascAppId === 'string' && ascAppId.trim().length > 0;
  const hasAscAppIdPlaceholder =
    typeof ascAppId === 'string' && /REPLACE|TODO/i.test(ascAppId);

  if (hasAscAppIdPlaceholder) {
    errors.push(
      'eas.json submit.production.ios.ascAppId still contains a placeholder'
    );
  }

  if (requireAscAppId && !hasAscAppId) {
    errors.push(
      'App Store Connect Apple ID (ascAppId) is required for final automated iOS submit'
    );
  }

  const collectedDataTypes = Array.isArray(
    privacyManifest?.NSPrivacyCollectedDataTypes
  )
    ? privacyManifest.NSPrivacyCollectedDataTypes
    : [];

  if (collectedDataTypes.length === 0) {
    errors.push(
      'iOS privacy manifest does not declare any collected data types'
    );
  }

  const reviewNotes = readText(reviewNotesPath);
  const hasReviewPlaceholders =
    /TODO_[A-Z0-9_]+/i.test(reviewNotes) ||
    /REPLACE_BEFORE_SUBMIT_[A-Z0-9_]+/i.test(reviewNotes);
  if (requireReviewArtifacts && hasReviewPlaceholders) {
    errors.push('App Review notes still contain submit-time placeholders');
  } else if (hasReviewPlaceholders) {
    warnings.push('App Review notes still contain submit-time placeholders');
  }

  const sampleQr = readText(sampleQrPath).trim();
  if (sampleQr && !/^esco:member:v\d+:/i.test(sampleQr)) {
    errors.push('Sample member QR payload is invalid');
  }

  const clientReleaseEnvNames = [
    'EXPO_PUBLIC_ACCOUNT_API_BASE_URL',
    'EXPO_PUBLIC_REFERRAL_API_BASE_URL',
    'EXPO_PUBLIC_INSTANT_APP_ID',
    'EXPO_PUBLIC_SENTRY_DSN',
  ];
  const serverReleaseEnvNames = [
    'INSTANT_APP_ADMIN_TOKEN',
    'APPLE_TEAM_ID',
    'APPLE_KEY_ID',
    'APPLE_PRIVATE_KEY',
    'SENTRY_AUTH_TOKEN',
  ];

  const clientEnvMissing = requireIosReleaseEnv
    ? addMissingEnvErrors({
        env,
        errors,
        names: clientReleaseEnvNames,
        label: 'Client release env',
      })
    : clientReleaseEnvNames.filter((name) => !getConfiguredValue(env, name));

  const serverEnvMissing = requireIosReleaseEnv
    ? addMissingEnvErrors({
        env,
        errors,
        names: serverReleaseEnvNames,
        label: 'Server/build release env',
      })
    : serverReleaseEnvNames.filter((name) => !getConfiguredValue(env, name));

  const hasAppleClientId =
    Boolean(getConfiguredValue(env, 'APPLE_CLIENT_ID')) ||
    Boolean(getConfiguredValue(env, 'APPLE_SERVICES_ID'));

  if (requireIosReleaseEnv && !hasAppleClientId) {
    errors.push(
      'Server/build release env missing one of APPLE_CLIENT_ID or APPLE_SERVICES_ID'
    );
  } else if (!hasAppleClientId) {
    warnings.push(
      'Neither APPLE_CLIENT_ID nor APPLE_SERVICES_ID is configured'
    );
  }

  const sensitiveKeysInEnv = [];
  if (fs.existsSync(envPath)) {
    const envFileText = readText(envPath);
    const sensitiveKeys = [
      'INSTANT_APP_ADMIN_TOKEN',
      'APPLE_PRIVATE_KEY',
      'SENTRY_AUTH_TOKEN',
    ];
    for (const key of sensitiveKeys) {
      const pattern = new RegExp(`^${key}=.+$`, 'm');
      if (pattern.test(envFileText)) sensitiveKeysInEnv.push(key);
    }
  }

  const trackedEnvFile = fs.existsSync(envPath) && isGitTracked('.env');
  if (trackedEnvFile && sensitiveKeysInEnv.length > 0) {
    const message = `.env is git-tracked and contains sensitive keys: ${sensitiveKeysInEnv.join(', ')}`;
    if (requireIosReleaseEnv) {
      errors.push(message);
    } else {
      warnings.push(message);
    }
  }

  const report = {
    success: errors.length === 0,
    validatedAt: new Date().toISOString(),
    checks: {
      appName: appJson?.expo?.name ?? null,
      bundleIdentifier: appJson?.expo?.ios?.bundleIdentifier ?? null,
      hasAscAppId,
      hasAscAppIdPlaceholder,
      appStoreMetadataTitle: storeConfig?.apple?.info?.['en-US']?.title ?? null,
      privacyManifestCollectedDataTypes: collectedDataTypes.length,
      reviewNotesHasPlaceholders: hasReviewPlaceholders,
      privacyChecklistReviewed:
        privacyChecklist?.publicAppName === 'Esco Beach Club',
      trackedEnvFile,
      sensitiveKeysInTrackedEnv: sensitiveKeysInEnv,
      missingClientReleaseEnv: clientEnvMissing,
      missingServerReleaseEnv: serverEnvMissing,
      hasAppleClientId,
    },
    warnings,
    errors,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    console.error('iOS submission readiness failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('iOS submission readiness: OK');
}

main();

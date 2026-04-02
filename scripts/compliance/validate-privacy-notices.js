#!/usr/bin/env node
/**
 * Validates privacy notices, legal links, and App Review artifacts.
 * Used by: .github/workflows/validate-privacy-notices.yml
 *
 * Network probes (legal/support URLs + AASA) run only when
 * RUN_PUBLIC_ENDPOINT_PROBES=true — avoids hitting production URLs from local
 * or unset-env runs.
 */

const fs = require('node:fs');
const path = require('node:path');

const rootDir = process.cwd();
const outDir = path.join(rootDir, 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'privacy-notices-validation.json');

const defaults = {
  privacyPolicyUrl: 'https://escolife.app/privacy',
  supportUrl: 'https://escolife.app/support',
  termsOfServiceUrl: 'https://escolife.app/terms',
};

function loadDotEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};

  const result = {};
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    result[key] = value.replace(/^['"]|['"]$/g, '');
  }

  return result;
}

function getConfiguredValue(key, fallback) {
  const mergedEnv = {
    ...loadDotEnvFile(path.join(rootDir, '.env')),
    ...loadDotEnvFile(path.join(rootDir, '.env.local')),
    ...process.env,
  };

  const value = mergedEnv[key];
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

const FETCH_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Validates Apple App Site Association JSON (Universal Links).
 * Accepts legacy (appID + paths) and modern (appIDs + components) detail shapes.
 * @param {unknown} data
 * @returns {{ valid: true } | { valid: false; message: string; detail: string }}
 */
function validateAasaStructure(data) {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    return {
      valid: false,
      message: 'invalid_aasa_structure',
      detail: 'root_not_object',
    };
  }

  const applinks = data.applinks;
  if (!applinks || typeof applinks !== 'object' || Array.isArray(applinks)) {
    return {
      valid: false,
      message: 'invalid_aasa_structure',
      detail: 'applinks_missing_or_invalid',
    };
  }

  const details = applinks.details;
  if (!Array.isArray(details) || details.length === 0) {
    return {
      valid: false,
      message: 'invalid_aasa_structure',
      detail: 'details_missing_or_empty',
    };
  }

  for (const detail of details) {
    if (!detail || typeof detail !== 'object' || Array.isArray(detail)) {
      continue;
    }

    const hasAppId =
      (typeof detail.appID === 'string' && detail.appID.trim().length > 0) ||
      (Array.isArray(detail.appIDs) &&
        detail.appIDs.some(
          (id) => typeof id === 'string' && id.trim().length > 0
        ));

    const hasPaths =
      (Array.isArray(detail.paths) && detail.paths.length > 0) ||
      (Array.isArray(detail.components) && detail.components.length > 0);

    if (hasAppId && hasPaths) {
      return { valid: true };
    }
  }

  return {
    valid: false,
    message: 'invalid_aasa_structure',
    detail: 'no_detail_with_appid_and_paths',
  };
}

/**
 * @param {string} url
 * @param {{ expectAasa?: boolean }} [options]
 */
async function fetchUrlStatus(url, options = {}) {
  const { expectAasa = false } = options;
  const controller = new AbortController();
  let timeoutId;

  try {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        url,
        message: `http_${response.status}`,
      };
    }

    if (!expectAasa) {
      return {
        ok: true,
        status: response.status,
        url,
      };
    }

    let text;
    try {
      text = await response.text();
    } catch (readError) {
      const readMessage =
        readError instanceof Error ? readError.message : String(readError);
      return {
        ok: false,
        status: response.status,
        url,
        message: 'aasa_body_read_error',
        detail: readMessage,
      };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      const parseMessage =
        parseError instanceof Error ? parseError.message : String(parseError);
      return {
        ok: false,
        status: response.status,
        url,
        message: 'aasa_parse_error',
        detail: parseMessage,
      };
    }

    const validation = validateAasaStructure(data);
    if (!validation.valid) {
      return {
        ok: false,
        status: response.status,
        url,
        message: validation.message,
        detail: validation.detail,
      };
    }

    return {
      ok: true,
      status: response.status,
      url,
    };
  } catch (error) {
    const isAborted =
      error instanceof DOMException && error.name === 'AbortError';
    const message = isAborted
      ? 'fetch_timeout'
      : error instanceof Error
        ? error.message
        : 'network_error';

    return {
      ok: false,
      status: null,
      url,
      message,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function main() {
  const requireReviewArtifacts =
    process.env.REQUIRE_APP_REVIEW_ARTIFACTS === 'true';
  const runPublicEndpointProbes =
    process.env.RUN_PUBLIC_ENDPOINT_PROBES === 'true';
  const appJsonPath = path.join(rootDir, 'app.json');

  let appJson = null;
  const appJsonErrors = [];

  if (!fs.existsSync(appJsonPath)) {
    appJsonErrors.push('app.json not found');
  } else {
    try {
      appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      appJsonErrors.push(`Failed to parse app.json: ${errorMessage}`);
    }
  }

  // If app.json loading failed, write failure report and exit
  if (appJsonErrors.length > 0) {
    const failureReport = {
      success: false,
      validatedAt: new Date().toISOString(),
      checks: {
        appJsonValid: false,
      },
      errors: appJsonErrors,
    };

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(failureReport, null, 2));

    console.error('Privacy notices validation failed:');
    for (const error of appJsonErrors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  const associatedDomains = appJson?.expo?.ios?.associatedDomains ?? [];
  const privacyPolicyUrl = getConfiguredValue(
    'EXPO_PUBLIC_PRIVACY_POLICY_URL',
    defaults.privacyPolicyUrl
  );
  const termsOfServiceUrl = getConfiguredValue(
    'EXPO_PUBLIC_TERMS_OF_SERVICE_URL',
    defaults.termsOfServiceUrl
  );
  const supportUrl = getConfiguredValue(
    'EXPO_PUBLIC_SUPPORT_URL',
    defaults.supportUrl
  );

  const reviewNotesPath = path.join(
    rootDir,
    'docs',
    'app-review',
    'review-notes-template.md'
  );
  const sampleQrPath = path.join(
    rootDir,
    'docs',
    'app-review',
    'sample-member-qr.txt'
  );
  const deleteAccountScreenPath = path.join(
    rootDir,
    'app',
    '(tabs)',
    'profile',
    'delete-account.tsx'
  );

  const urls = [privacyPolicyUrl, termsOfServiceUrl, supportUrl];
  const urlChecks = runPublicEndpointProbes
    ? await Promise.all(urls.map(fetchUrlStatus))
    : [];
  const domainChecks = runPublicEndpointProbes
    ? await Promise.all(
        associatedDomains
          .filter(
            (domain) =>
              typeof domain === 'string' && domain.startsWith('applinks:')
          )
          .map((domain) =>
            fetchUrlStatus(
              `https://${domain.replace(/^applinks:/, '')}/.well-known/apple-app-site-association`,
              { expectAasa: true }
            )
          )
      )
    : [];

  const errors = [];

  for (const result of urlChecks) {
    if (!result.ok) {
      errors.push(`Unreachable legal/support URL: ${result.url}`);
    }
  }

  for (const result of domainChecks) {
    if (!result.ok) {
      const reason =
        result.message != null
          ? ` (${result.message}${
              result.detail != null ? `: ${result.detail}` : ''
            })`
          : '';
      errors.push(
        `Associated domain verification failed: ${result.url}${reason}`
      );
    }
  }

  if (!fs.existsSync(reviewNotesPath)) {
    errors.push('docs/app-review/review-notes-template.md is missing');
  } else if (requireReviewArtifacts) {
    const reviewNotes = fs.readFileSync(reviewNotesPath, 'utf8');
    if (/TODO_[A-Z0-9_]+/i.test(reviewNotes)) {
      errors.push('App Review notes template still contains TODO placeholders');
    }
  }

  if (!fs.existsSync(sampleQrPath)) {
    errors.push('docs/app-review/sample-member-qr.txt is missing');
  } else {
    const sampleQr = fs.readFileSync(sampleQrPath, 'utf8').trim();
    if (!/^esco:member:v\d+:/i.test(sampleQr)) {
      errors.push('Sample member QR payload is invalid');
    } else if (/TODO/i.test(sampleQr)) {
      errors.push('Sample member QR payload still contains placeholder values');
    }
  }

  if (!fs.existsSync(deleteAccountScreenPath)) {
    errors.push('In-app delete-account screen is missing');
  }

  const report = {
    success: errors.length === 0,
    validatedAt: new Date().toISOString(),
    checks: {
      associatedDomains,
      deleteAccountScreenExists: fs.existsSync(deleteAccountScreenPath),
      reviewNotesExists: fs.existsSync(reviewNotesPath),
      sampleQrExists: fs.existsSync(sampleQrPath),
      supportUrl,
      termsOfServiceUrl,
      privacyPolicyUrl,
      urlChecks,
      domainChecks,
    },
    errors,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    console.error('Privacy notices validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Privacy notices validation: OK');
}

void main();

#!/usr/bin/env node
/**
 * Checks Sign in with Apple (SIWA) compliance.
 * Output: build/reports/compliance/siwa-guard.json
 */

const fs = require('node:fs');
const path = require('node:path');

const outDir = path.join(process.cwd(), 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'siwa-guard.json');

function readText(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

function main() {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  const appConfigPath = path.join(process.cwd(), 'app.config.js');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const authProviderPath = path.join(
    process.cwd(),
    'providers',
    'AuthProvider.tsx'
  );
  const socialAuthPath = path.join(
    process.cwd(),
    'src',
    'lib',
    'auth',
    'social-auth.ts'
  );

  let appJson = null;
  const parseErrors = [];

  if (fs.existsSync(appJsonPath)) {
    try {
      appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    } catch (error) {
      parseErrors.push(
        `Failed to parse app.json: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  let packageJson = null;
  if (fs.existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    } catch (error) {
      parseErrors.push(
        `Failed to parse package.json: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const appJsonText = appJson ? JSON.stringify(appJson) : '';
  const appConfigText = readText(appConfigPath);
  const authProviderText = readText(authProviderPath);
  const socialAuthText = readText(socialAuthPath);

  const hasDependency = Boolean(
    packageJson?.dependencies?.['expo-apple-authentication']
  );
  const hasPluginConfig =
    appJsonText.includes('expo-apple-authentication') ||
    /usesAppleSignIn\s*:\s*true/.test(appConfigText);
  const hasSourceUsage =
    /signInWithAppleFlow/.test(authProviderText) ||
    /expo-apple-authentication/.test(socialAuthText) ||
    /AppleAuthentication\./.test(socialAuthText);
  const usesSiwa = hasDependency || hasPluginConfig || hasSourceUsage;

  const errors = [];

  if (usesSiwa && !hasDependency) {
    errors.push(
      'Sign in with Apple is used in source/config but expo-apple-authentication dependency is missing.'
    );
  }

  if (usesSiwa && !hasPluginConfig) {
    errors.push(
      'Sign in with Apple is used in source but iOS usesAppleSignIn / plugin config is missing.'
    );
  }

  if (parseErrors.length > 0) {
    errors.push(...parseErrors);
  }

  const report = {
    success: errors.length === 0,
    scannedAt: new Date().toISOString(),
    checks: {
      hasDependency,
      hasPluginConfig,
      hasSourceUsage,
      usesSignInWithApple: usesSiwa,
    },
    message: usesSiwa
      ? 'App uses SIWA. Dependency, source usage, and iOS config were checked together.'
      : 'App does not appear to use Sign in with Apple.',
    errors,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    console.error('SIWA compliance failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
}

main();

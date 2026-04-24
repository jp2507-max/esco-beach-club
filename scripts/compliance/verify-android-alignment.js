#!/usr/bin/env node
/**
 * Verifies 16 KB page alignment for .so entries inside an Android APK or AAB.
 * Google Play requires this for apps targeting Android 15+ (enforced since
 * Nov 1, 2025). React Native 0.79+ aligns core binaries correctly; this script
 * catches regressions in third-party native libraries before Play Console does.
 *
 * Usage:
 *   node scripts/compliance/verify-android-alignment.js <path-to-apk-or-aab>
 *
 * Env overrides:
 *   ZIPALIGN           absolute path to zipalign binary
 *   ANDROID_SDK_ROOT   Android SDK root (falls back to ANDROID_HOME)
 *
 * Output: build/reports/compliance/android-alignment.json
 * Exit codes: 0 pass · 1 misalignment detected · 2 usage/tool error
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(process.cwd(), 'build', 'reports', 'compliance');
const OUT_PATH = path.join(OUT_DIR, 'android-alignment.json');

function writeReport(report) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
}

function findZipalign() {
  if (process.env.ZIPALIGN) {
    if (fs.existsSync(process.env.ZIPALIGN)) return process.env.ZIPALIGN;
    throw new Error(
      `ZIPALIGN is set but path does not exist: ${process.env.ZIPALIGN}`
    );
  }
  const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
  if (!sdkRoot) return null;
  const buildToolsDir = path.join(sdkRoot, 'build-tools');
  if (!fs.existsSync(buildToolsDir)) return null;
  const exe = process.platform === 'win32' ? 'zipalign.exe' : 'zipalign';
  const versions = fs
    .readdirSync(buildToolsDir)
    .map((name) => ({
      name,
      parts: name.split('.').map((p) => parseInt(p, 10) || 0),
    }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.parts.length, b.parts.length); i++) {
        const diff = (b.parts[i] || 0) - (a.parts[i] || 0);
        if (diff !== 0) return diff;
      }
      return 0;
    })
    .map((v) => v.name);
  for (const v of versions) {
    const candidate = path.join(buildToolsDir, v, exe);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function main() {
  const target = process.argv[2];
  if (!target) {
    const msg =
      'Missing argument. Usage: node scripts/compliance/verify-android-alignment.js <apk-or-aab>';
    writeReport({
      success: false,
      error: msg,
      scannedAt: new Date().toISOString(),
    });
    console.error(msg);
    process.exit(2);
  }

  const absTarget = path.resolve(target);
  if (!fs.existsSync(absTarget)) {
    const msg = `File not found: ${absTarget}`;
    writeReport({
      success: false,
      error: msg,
      scannedAt: new Date().toISOString(),
    });
    console.error(msg);
    process.exit(2);
  }

  let zipalign;
  try {
    zipalign = findZipalign();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    writeReport({
      success: false,
      error: msg,
      target: absTarget,
      scannedAt: new Date().toISOString(),
    });
    console.error(msg);
    process.exit(2);
  }
  if (!zipalign) {
    const msg =
      'zipalign not found. Install Android SDK build-tools and set ANDROID_SDK_ROOT (or ANDROID_HOME), or pass ZIPALIGN=/abs/path.';
    writeReport({
      success: false,
      skipped: true,
      reason: msg,
      target: absTarget,
      scannedAt: new Date().toISOString(),
    });
    console.error(msg);
    process.exit(2);
  }

  const result = spawnSync(zipalign, ['-c', '-P', '16', '-v', '4', absTarget], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });

  if (result.error) {
    const msg = `Failed to execute zipalign: ${result.error.message}`;
    writeReport({
      success: false,
      error: msg,
      target: absTarget,
      zipalign,
      scannedAt: new Date().toISOString(),
    });
    console.error(msg);
    process.exit(2);
  }

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const combined = stdout + stderr;

  const misaligned = combined
    .split(/\r?\n/)
    .filter((line) => /\.so\b.*BAD/i.test(line))
    .map((line) => line.trim());

  const passed =
    result.status === 0 &&
    misaligned.length === 0 &&
    !/Verification FAILED/i.test(combined);

  writeReport({
    success: passed,
    target: absTarget,
    zipalign,
    exitCode: result.status,
    misaligned,
    scannedAt: new Date().toISOString(),
  });

  if (!passed) {
    console.error(combined);
    console.error(`\nAlignment verification FAILED. Report: ${OUT_PATH}`);
    process.exit(1);
  }

  console.log(`Alignment verification passed (16 KB). Report: ${OUT_PATH}`);
}

main();

#!/usr/bin/env node
/**
 * Scans Android manifest for restricted permissions and writes a compliance report.
 * Output: build/reports/compliance/android-manifest-scan.json
 */

const fs = require('fs');
const path = require('path');

const manifestPath = path.join(
  process.cwd(),
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml'
);
const outDir = path.join(process.cwd(), 'build', 'reports', 'compliance');
const outPath = path.join(outDir, 'android-manifest-scan.json');

const restrictedPermissions = [
  'android.permission.READ_SMS',
  'android.permission.RECEIVE_SMS',
  'android.permission.SEND_SMS',
  'android.permission.READ_CALL_LOG',
  'android.permission.WRITE_CALL_LOG',
  'android.permission.READ_CONTACTS',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_BACKGROUND_LOCATION',
  'android.permission.CAMERA',
  'android.permission.RECORD_AUDIO',
];

function extractPermissions(manifestContent) {
  const re = /android:name="([^"]+)"/g;
  const perms = [];
  let m;
  while ((m = re.exec(manifestContent)) !== null) {
    if (m[1].startsWith('android.permission.')) perms.push(m[1]);
  }
  return [...new Set(perms)];
}

function main() {
  if (!fs.existsSync(manifestPath)) {
    const report = {
      success: false,
      error: 'AndroidManifest.xml not found. Run prebuild first.',
      path: manifestPath,
      scannedAt: new Date().toISOString(),
    };
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const content = fs.readFileSync(manifestPath, 'utf8');
  const declared = extractPermissions(content);
  const restricted = declared.filter((p) => restrictedPermissions.includes(p));

  const report = {
    success: restricted.length === 0,
    scannedAt: new Date().toISOString(),
    manifestPath,
    declaredPermissions: declared,
    restrictedPermissionsFound: restricted,
    restrictedPermissionsList: restrictedPermissions,
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  if (restricted.length > 0) {
    console.error('Restricted permissions found:', restricted.join(', '));
    process.exit(1);
  }
}

main();

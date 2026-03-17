#!/usr/bin/env node
/**
 * App release script: bump version, prebuild, create tag, push.
 * Usage: bun run app-release <patch|minor|major>
 * Used by: .github/workflows/new-app-version.yml
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const releaseType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(releaseType)) {
  console.error('Usage: bun run app-release <patch|minor|major>');
  process.exit(1);
}

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const current = pkg.version;

// Bump version in package.json
const [major, minor, patch] = current.split('.').map(Number);
let next;
if (releaseType === 'major') next = `${major + 1}.0.0`;
else if (releaseType === 'minor') next = `${major}.${minor + 1}.0`;
else next = `${major}.${minor}.${patch + 1}`;

pkg.version = next;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`Bumped version ${current} -> ${next}`);

// Prebuild to align native code with new version
console.log('Running prebuild...');
execSync('bun run prebuild:staging', { stdio: 'inherit' });

// Commit, tag, push (add only existing paths)
const toAdd = ['package.json'];
if (fs.existsSync(path.join(process.cwd(), 'android'))) toAdd.push('android');
if (fs.existsSync(path.join(process.cwd(), 'ios'))) toAdd.push('ios');
execSync(`git add ${toAdd.join(' ')}`, { stdio: 'inherit' });
execSync(`git commit -m "chore: release ${next}"`, { stdio: 'inherit' });
execSync(`git tag v${next}`, { stdio: 'inherit' });
execSync('git push && git push --tags', { stdio: 'inherit' });
console.log(`Released v${next}`);

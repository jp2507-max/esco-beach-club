const fs = require('node:fs');
const path = require('node:path');

const { IOSConfig, withDangerousMod, withXcodeProject } = require('expo/config-plugins');

const PLUGIN_NAME = 'with-apple-privacy-manifest';
const MANIFEST_SOURCE = path.join(
  __dirname,
  '..',
  'config',
  'apple',
  'privacy-manifest.json'
);

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toPlistValue(value, depth = 0) {
  const indent = '  '.repeat(depth);
  const childIndent = '  '.repeat(depth + 1);

  if (typeof value === 'boolean') {
    return `${indent}<${value ? 'true' : 'false'}/>`;
  }

  if (typeof value === 'string') {
    return `${indent}<string>${escapeXml(value)}</string>`;
  }

  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? `${indent}<integer>${value}</integer>`
      : `${indent}<real>${value}</real>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${indent}<array/>`;
    }

    const items = value
      .map((entry) => toPlistValue(entry, depth + 1))
      .join('\n');
    return `${indent}<array>\n${items}\n${indent}</array>`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${indent}<dict/>`;
    }

    const lines = entries
      .map(
        ([key, entry]) =>
          `${childIndent}<key>${escapeXml(key)}</key>\n${toPlistValue(
            entry,
            depth + 1
          )}`
      )
      .join('\n');

    return `${indent}<dict>\n${lines}\n${indent}</dict>`;
  }

  return `${indent}<string/>`;
}

function buildPrivacyManifestPlist(source) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
${toPlistValue(source, 0)}
</plist>
`;
}

module.exports = function withApplePrivacyManifest(config) {
  config = withDangerousMod(config, [
    'ios',
    async (nextConfig) => {
      const projectName = nextConfig.modRequest.projectName;
      const source = JSON.parse(fs.readFileSync(MANIFEST_SOURCE, 'utf8'));
      const outputPath = path.join(
        nextConfig.modRequest.platformProjectRoot,
        projectName,
        'PrivacyInfo.xcprivacy'
      );

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, buildPrivacyManifestPlist(source));

      return nextConfig;
    },
  ]);

  config = withXcodeProject(config, (nextConfig) => {
    const projectName = nextConfig.modRequest.projectName;

    IOSConfig.XcodeUtils.addResourceFileToGroup({
      filepath: `${projectName}/PrivacyInfo.xcprivacy`,
      groupName: projectName,
      isBuildFile: true,
      project: nextConfig.modResults,
      verbose: true,
    });

    return nextConfig;
  });

  return config;
};

module.exports.pluginName = PLUGIN_NAME;

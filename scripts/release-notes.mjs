// Writes the English release notes of one version as Markdown, from
// src/i18n/releases.ts and src/i18n/en/changelog.ts. The release workflow puts
// them on the GitHub release.
//
// Usage: node scripts/release-notes.mjs v1.9.2 > release-notes.md

import { build } from 'esbuild';

const tag = process.argv[2] ?? '';
const version = tag.replace(/^v/, '');
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.error(`Give a version such as v1.9.2, not "${tag}".`);
  process.exit(1);
}

const out = await build({
  stdin: { contents: "export { RELEASES } from './src/i18n/releases.ts'; export { en } from './src/i18n/en/index.ts';", resolveDir: process.cwd(), loader: 'ts' },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'node',
  logLevel: 'silent',
});
const { RELEASES, en } = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString('base64')}`);

const release = RELEASES.find((r) => r.version === version);
if (!release) {
  console.error(`There are no release notes for ${version}. Add them to src/i18n/releases.ts and src/i18n/en/changelog.ts.`);
  process.exit(1);
}
process.stdout.write(`## What's new in ${version}\n\n${release.notes.map((key) => `- ${en[key]}`).join('\n')}\n`);

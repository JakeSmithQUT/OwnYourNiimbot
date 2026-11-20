// Writes THIRD_PARTY_LICENSES.txt with the licence of every package that is
// bundled into the app: the renderer libraries, the fonts and the MCP SDK.
// The app shows this file in Settings, About.

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = [
  'react', 'react-dom', 'fabric', 'bwip-js', 'lucide-react', 'papaparse', 'read-excel-file',
  '@modelcontextprotocol/sdk', 'zod',
  ...readdirSync('node_modules/@fontsource').map((f) => `@fontsource/${f}`),
];

const seen = new Map();

function visit(name) {
  if (seen.has(name)) return;
  const dir = join('node_modules', name);
  const pkgFile = join(dir, 'package.json');
  if (!existsSync(pkgFile)) return;
  const pkg = JSON.parse(readFileSync(pkgFile, 'utf8'));
  const file = readdirSync(dir).find((f) => /^(licen[cs]e|copying)(\.(md|txt))?$/i.test(f));
  seen.set(name, {
    name,
    version: pkg.version,
    license: typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'see text'),
    text: file ? readFileSync(join(dir, file), 'utf8').trim() : '',
  });
  for (const dep of Object.keys(pkg.dependencies ?? {})) visit(dep);
}

ROOTS.forEach(visit);

const entries = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
const out = [
  'OwnYourNiimbot includes the following open-source software and fonts.',
  '',
  ...entries.flatMap((e) => [
    '='.repeat(72),
    `${e.name} ${e.version} (${e.license})`,
    '='.repeat(72),
    e.text || `Licence: ${e.license}. No licence file was included in the package.`,
    '',
  ]),
].join('\n');

// Some packages have Windows line endings in their licence files. Use one style.
writeFileSync('THIRD_PARTY_LICENSES.txt', out.replace(/\r\n?/g, '\n'));
console.log(`Wrote THIRD_PARTY_LICENSES.txt (${entries.length} packages)`);

#!/usr/bin/env node
// Fails if the repository contains files or text that must not be published:
// app packages, decompiled code, credentials, tokens and private keys.
//
// Usage:
//   node scripts/check-secrets.mjs           checks all tracked files
//   node scripts/check-secrets.mjs --staged  checks only staged files (pre-commit hook)

import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';

const staged = process.argv.includes('--staged');
const args = staged ? ['diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z'] : ['ls-files', '-z'];
const files = execFileSync('git', args, { encoding: 'utf8' }).split('\0').filter(Boolean);

const BLOCKED_FILES = [
  { re: /\.(apk|apks|xapk|aab|dex|so|smali|jar|ipa)$/i, why: 'app package or compiled code' },
  { re: /(^|\/)(re|decompiled|jadx[^/]*|apktool[^/]*)\//i, why: 'reverse engineering output folder' },
  { re: /(^|\/)\.env(\.|$)/i, why: 'environment file' },
  { re: /\.(pem|p12|pfx|keystore|jks|mobileprovision)$/i, why: 'key or certificate file' },
  { re: /(^|\/)(printerList|DevicesModule_[a-z]+|language_online_[A-Za-z-]+)\.json$/, why: 'file copied from the official app' },
];

const PATTERNS = [
  { re: /AIza[0-9A-Za-z_-]{35}/, why: 'Google API key' },
  { re: /AKIA[0-9A-Z]{16}/, why: 'AWS access key' },
  { re: /LTAI[0-9A-Za-z]{12,20}/, why: 'Alibaba Cloud access key' },
  { re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/, why: 'private key' },
  { re: /\bgh[pousr]_[0-9A-Za-z]{36,}\b/, why: 'GitHub token' },
  { re: /\bxox[abprs]-[0-9A-Za-z-]{10,}/, why: 'Slack token' },
  { re: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/, why: 'JSON web token' },
  { re: /https:\/\/[0-9a-f]{32}@[a-z0-9.-]*sentry\.io/i, why: 'Sentry DSN' },
  { re: /(api[_-]?key|app[_-]?secret|client[_-]?secret|access[_-]?token|password)\s*[:=]\s*['"][^'"\s]{12,}['"]/i, why: 'hard-coded credential' },
];

const MAX_BYTES = 5 * 1024 * 1024;
const problems = [];

for (const file of files) {
  for (const b of BLOCKED_FILES) if (b.re.test(file)) problems.push(`${file}: ${b.why}`);
  let size = 0;
  try {
    size = statSync(file).size;
  } catch {
    continue;
  }
  if (size > MAX_BYTES) problems.push(`${file}: larger than 5 MB`);
  if (/\.(png|ico|icns|jpg|jpeg|gif|woff2?|ttf|otf)$/i.test(file) || size > MAX_BYTES) continue;
  const text = readFileSync(file, 'utf8');
  for (const p of PATTERNS) {
    const m = text.match(p.re);
    if (m) problems.push(`${file}: possible ${p.why} (${m[0].slice(0, 12)}…)`);
  }
}

if (problems.length) {
  console.error('Secret check failed:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
console.log(`Secret check passed (${files.length} files).`);

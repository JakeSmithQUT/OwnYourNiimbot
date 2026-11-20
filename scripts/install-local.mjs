#!/usr/bin/env node
// Builds the Windows installer and installs it for the current user, then
// checks that the installed app starts. Use it to keep a development
// machine on the latest build.
//
// Usage:
//   npm run install:local            stops if the app is open
//   npm run install:local -- --force closes the app first (unsaved changes are lost)

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

if (process.platform !== 'win32') {
  console.error('This script installs the Windows build only. On macOS or Linux, run "npm run dist" and open the file in release/.');
  process.exit(1);
}

const force = process.argv.includes('--force');
const { version, productName } = JSON.parse(readFileSync('package.json', 'utf8'));
const exeName = `${productName}.exe`;
const installDir = join(process.env.LOCALAPPDATA ?? '', 'Programs', productName.toLowerCase());
const installer = join('release', `${productName}-${version}-windows-x64-setup.exe`);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`Failed: ${cmd} ${args.join(' ')}`);
    process.exit(r.status ?? 1);
  }
}

function appIsRunning() {
  const out = execFileSync('tasklist', ['/FI', `IMAGENAME eq ${exeName}`, '/NH'], { encoding: 'utf8' });
  return out.toLowerCase().includes(exeName.toLowerCase());
}

if (appIsRunning()) {
  if (!force) {
    console.error(`${productName} is open. Close it and run the script again, or add --force to close it.`);
    process.exit(1);
  }
  spawnSync('taskkill', ['/IM', exeName, '/F'], { stdio: 'ignore' });
}

console.log('Building the installer…');
run('npm', ['run', 'build']);
rmSync(installer, { force: true });
run('npx', ['electron-builder', '--win', 'nsis:x64', '--publish', 'never']);
if (!existsSync(installer)) {
  console.error(`The installer was not found at ${installer}`);
  process.exit(1);
}

console.log(`Installing ${productName} ${version}…`);
const install = spawnSync(installer, ['/S', '/currentuser'], { stdio: 'inherit' });
if (install.status !== 0) {
  console.error(`The installer stopped with exit code ${install.status}`);
  process.exit(install.status ?? 1);
}

const installedExe = [join(installDir, exeName), join(process.env.LOCALAPPDATA ?? '', 'Programs', productName, exeName)].find(existsSync);
if (!installedExe) {
  console.error(`The installed app was not found in ${installDir}`);
  process.exit(1);
}

console.log('Checking that the installed app starts…');
const screenshot = join(tmpdir(), `${productName}-install-check.png`);
const check = spawnSync(installedExe, [], {
  env: { ...process.env, OYN_SMOKE_TEST: screenshot },
  encoding: 'utf8',
  timeout: 60000,
});
const result = (check.stdout ?? '').split('\n').find((l) => l.startsWith('{"rendered"'));
if (check.status !== 0) {
  console.error(`The installed app did not start correctly. ${result ?? check.stderr ?? ''}`);
  process.exit(1);
}
console.log(`Installed ${productName} ${version} to ${installedExe}`);

// Starts the Vite dev server and opens Electron against it.
import { spawn } from 'node:child_process';
import { createServer } from 'vite';

const server = await createServer({ configFile: 'vite.config.mts' });
await server.listen();
const url = server.resolvedUrls?.local?.[0] ?? 'http://localhost:5173/';

const buildMain = spawn(process.execPath, ['scripts/build-main.mjs'], { stdio: 'inherit' });
await new Promise((resolve, reject) => buildMain.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('Main build failed')))));

const electronPath = (await import('electron')).default;
const child = spawn(electronPath, ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
});
child.on('exit', async (code) => {
  await server.close();
  process.exit(code ?? 0);
});

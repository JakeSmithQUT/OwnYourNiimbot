// Bundles the Electron main process and the preload script.
import { build } from 'esbuild';

const watch = process.argv.includes('--watch');
const common = {
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: watch ? 'inline' : false,
  external: ['electron'],
  logLevel: 'info',
};

await build({ ...common, entryPoints: ['src/main/main.ts'], outfile: 'dist/main/main.js' });
await build({ ...common, entryPoints: ['src/main/preload.ts'], outfile: 'dist/main/preload.js' });
await build({ ...common, entryPoints: ['src/main/updaterPreload.ts'], outfile: 'dist/main/updaterPreload.js' });
// Stdio bridge for MCP clients. Runs in Node mode, so it must not use Electron.
await build({ ...common, external: [], entryPoints: ['src/main/mcp/bridge.ts'], outfile: 'dist/main/mcp-bridge.js' });

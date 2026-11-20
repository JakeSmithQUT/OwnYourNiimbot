import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// The production build gets a strict Content Security Policy. The dev server
// does not, because React Fast Refresh adds an inline script.
const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'";

function contentSecurityPolicy(): Plugin {
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

export default defineConfig({
  root: resolve(root, 'src/renderer'),
  base: './',
  plugins: [react(), contentSecurityPolicy()],
  build: {
    outDir: resolve(root, 'dist/renderer'),
    emptyOutDir: true,
    target: 'chrome130',
    chunkSizeWarningLimit: 4000,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    root,
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

import { timingSafeEqual } from 'node:crypto';

export interface IncomingCheck {
  method?: string;
  url?: string;
  remoteAddress?: string;
  headers: Record<string, string | string[] | undefined>;
}

export type CheckResult = { ok: true } | { ok: false; status: number; message: string };

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function header(h: IncomingCheck['headers'], name: string): string | undefined {
  const v = h[name];
  return Array.isArray(v) ? v[0] : v;
}

function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Checks a request to the MCP endpoint before the MCP layer sees it.
 * - Only loopback connections.
 * - The Host header must be this server, which stops DNS rebinding.
 * - No Origin header, so that web pages in a browser cannot call the server.
 * - The bearer token must match.
 */
export function checkRequest(req: IncomingCheck, port: number, token: string): CheckResult {
  if (!req.remoteAddress || !LOOPBACK.has(req.remoteAddress)) return { ok: false, status: 403, message: 'Only local connections are accepted.' };
  const host = header(req.headers, 'host')?.toLowerCase();
  if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) return { ok: false, status: 403, message: 'Unexpected Host header.' };
  if (header(req.headers, 'origin') !== undefined) return { ok: false, status: 403, message: 'Requests from web pages are not accepted.' };
  const path = (req.url ?? '').split('?')[0];
  if (path !== '/mcp') return { ok: false, status: 404, message: 'Not found.' };
  const auth = header(req.headers, 'authorization') ?? '';
  const match = /^Bearer\s+(\S+)$/i.exec(auth);
  if (!match || !sameToken(match[1], token)) return { ok: false, status: 401, message: 'Missing or wrong token.' };
  if (req.method !== 'POST') return { ok: false, status: 405, message: 'Use POST.' };
  return { ok: true };
}

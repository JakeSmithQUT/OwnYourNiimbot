import { describe, expect, it } from 'vitest';
import { checkRequest } from '../src/main/mcp/guard';

const TOKEN = 'a'.repeat(43);
const base = {
  method: 'POST',
  url: '/mcp',
  remoteAddress: '127.0.0.1',
  headers: { host: '127.0.0.1:47821', authorization: `Bearer ${TOKEN}` } as Record<string, string | undefined>,
};
const check = (patch: Partial<typeof base> & { headers?: Record<string, string | undefined> }) =>
  checkRequest({ ...base, ...patch, headers: { ...base.headers, ...(patch.headers ?? {}) } }, 47821, TOKEN);

describe('MCP request guard', () => {
  it('accepts a local request with the right token', () => {
    expect(check({})).toEqual({ ok: true });
    expect(check({ headers: { host: 'localhost:47821' } })).toEqual({ ok: true });
    expect(check({ remoteAddress: '::1' })).toEqual({ ok: true });
  });

  it('refuses connections that are not local', () => {
    expect(check({ remoteAddress: '192.168.1.20' })).toMatchObject({ ok: false, status: 403 });
  });

  it('refuses a different Host header (DNS rebinding)', () => {
    expect(check({ headers: { host: 'evil.example:47821' } })).toMatchObject({ ok: false, status: 403 });
    expect(check({ headers: { host: '127.0.0.1:9999' } })).toMatchObject({ ok: false, status: 403 });
  });

  it('refuses requests from web pages', () => {
    expect(check({ headers: { origin: 'https://evil.example' } })).toMatchObject({ ok: false, status: 403 });
    expect(check({ headers: { origin: 'null' } })).toMatchObject({ ok: false, status: 403 });
  });

  it('needs the right token', () => {
    expect(check({ headers: { authorization: undefined } })).toMatchObject({ ok: false, status: 401 });
    expect(check({ headers: { authorization: 'Bearer wrong' } })).toMatchObject({ ok: false, status: 401 });
    expect(check({ headers: { authorization: `Basic ${TOKEN}` } })).toMatchObject({ ok: false, status: 401 });
  });

  it('accepts only POST on /mcp', () => {
    expect(check({ url: '/other' })).toMatchObject({ ok: false, status: 404 });
    expect(check({ method: 'GET' })).toMatchObject({ ok: false, status: 405 });
  });
});

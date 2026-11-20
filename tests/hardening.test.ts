import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { strToU8, zipSync } from 'fflate';
import { validateTemplate } from '../src/renderer/editor/validate';
import { formatSerial } from '../src/renderer/editor/placeholders';
import { checkXlsxSize, DATA_LIMITS, DataFileError, parseDelimited, toDataset } from '../src/renderer/dataImport';
import { isAllowedExternal } from '../src/main/links';
import { startMcp, stopMcp } from '../src/main/mcp/server';

function label(objects: unknown[]) {
  return { name: 'Test', widthMm: 50, heightMm: 30, labelType: 1, canvas: { version: '7', objects } };
}

describe('editor data in label files', () => {
  it('limits serial number settings', () => {
    const t = validateTemplate(
      label([{ type: 'Textbox', text: 'x', oyn: { kind: 'serial', serial: { start: 1, step: 1, digits: 100_000_000, prefix: 'P'.repeat(500), suffix: '' } } }]),
    );
    const data = (t.canvas.objects![0] as { oyn: { serial: { digits: number; prefix: string } } }).oyn;
    expect(data.serial.digits).toBe(12);
    expect(data.serial.prefix).toHaveLength(20);
  });

  it('keeps known keys and drops the others', () => {
    const t = validateTemplate(label([{ type: 'Textbox', text: 'x', oyn: { kind: 'datetime', format: 'DD/MM/YYYY', offsetDays: 7, locked: true, other: 'x'.repeat(100) } }]));
    expect((t.canvas.objects![0] as { oyn: unknown }).oyn).toEqual({ kind: 'datetime', format: 'DD/MM/YYYY', offsetDays: 7, locked: true });
  });

  it('drops editor data that is not an object, and unknown kinds', () => {
    const t = validateTemplate(label([{ type: 'Textbox', text: 'x', oyn: 'bad' }, { type: 'Rect', oyn: { kind: 'script' } }]));
    expect(t.canvas.objects![0]).not.toHaveProperty('oyn');
    expect((t.canvas.objects![1] as { oyn: unknown }).oyn).toEqual({});
  });

  it('formatSerial limits the digits even without the file check', () => {
    expect(formatSerial({ start: 7, step: 1, digits: 1e8, prefix: '', suffix: '' }, 0)).toBe('000000000007');
    expect(formatSerial({ start: 7, step: 1, digits: Number.NaN, prefix: 'A', suffix: '' }, 2)).toBe('A9');
  });
});

describe('data file import', () => {
  it('reads CSV and TSV text', () => {
    expect(parseDelimited('Name,Code\nA,1\nB,2\n', '')).toEqual([['Name', 'Code'], ['A', '1'], ['B', '2']]);
    expect(parseDelimited('Name\tCode\nA\t1\n', '\t')).toEqual([['Name', 'Code'], ['A', '1']]);
  });

  it('stops at too many rows, too many columns or a long cell', () => {
    const rows = `H\n${'x\n'.repeat(DATA_LIMITS.rows + 1)}`;
    expect(() => parseDelimited(rows, '')).toThrow(DataFileError);
    expect(() => parseDelimited(`${Array.from({ length: DATA_LIMITS.cols + 1 }, (_, i) => `c${i}`).join(',')}\n`, ',')).toThrow(/columns/);
    expect(() => parseDelimited(`H\n${'y'.repeat(DATA_LIMITS.cellChars + 1)}\n`, '')).toThrow(/characters/);
    expect(() => toDataset('x', [['H'], ['z'.repeat(DATA_LIMITS.cellChars + 1)]])).toThrow(/characters/);
  });

  it('accepts a small .xlsx file and refuses one that unpacks to too much', () => {
    const zip = zipSync({ '[Content_Types].xml': strToU8('<Types/>'), 'xl/worksheets/sheet1.xml': strToU8('<worksheet/>') });
    expect(() => checkXlsxSize(zip)).not.toThrow();
    // Change the size that the directory gives for one part to 100 MB.
    const bomb = zip.slice();
    const view = new DataView(bomb.buffer);
    for (let i = bomb.length - 22; i >= 0; i--) {
      if (view.getUint32(i, true) === 0x02014b50) {
        view.setUint32(i + 24, 100 * 1024 * 1024, true);
        break;
      }
    }
    expect(() => checkXlsxSize(bomb)).toThrow(/too large/);
    expect(() => checkXlsxSize(strToU8('not a zip file at all, just some text for the test'))).toThrow(/not a valid/);
  });
});

describe('external links', () => {
  it('opens only the project on GitHub', () => {
    expect(isAllowedExternal('https://github.com/JakeSmithQUT/OwnYourNiimbot')).toBe(true);
    expect(isAllowedExternal('https://github.com/JakeSmithQUT/OwnYourNiimbot/releases')).toBe(true);
    expect(isAllowedExternal('https://github.com/JakeSmithQUT/OwnYourNiimbotEvil')).toBe(false);
    expect(isAllowedExternal('https://github.com.example.com/JakeSmithQUT/OwnYourNiimbot')).toBe(false);
    expect(isAllowedExternal('http://github.com/JakeSmithQUT/OwnYourNiimbot')).toBe(false);
    expect(isAllowedExternal('https://example.com/')).toBe(false);
    expect(isAllowedExternal('not a url')).toBe(false);
  });
});

describe('MCP server', () => {
  const TOKEN = 'b'.repeat(43);
  let port = 0;
  const post = (body: string) =>
    fetch(`http://127.0.0.1:${port}/mcp`, {
      method: 'POST',
      headers: { authorization: `Bearer ${TOKEN}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body,
    });

  beforeAll(async () => {
    const bridge = { call: async () => ({}), confirm: async () => true, confirmPrint: () => false };
    port = await startMcp({ enabled: true, token: TOKEN, port: 47960, confirmPrint: true }, bridge as never, 'test');
  });
  afterAll(() => stopMcp());

  it('answers 413 to a request that is too large and keeps running', async () => {
    const big = await post(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping', params: { pad: 'x'.repeat(2 * 1024 * 1024) } })).catch(() => undefined);
    expect(big?.status).toBe(413);
    const init = await post(
      JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } }),
    );
    expect(init.status).toBe(200);
    const json = (await init.json()) as { result?: { serverInfo?: { name?: string } } };
    expect(json.result?.serverInfo?.name).toBe('ownyourniimbot');
  });

  it('answers 400 to a request that is not JSON', async () => {
    const r = await post('{not json');
    expect(r.status).toBe(400);
  });
});

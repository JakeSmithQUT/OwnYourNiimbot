import { describe, expect, it } from 'vitest';
import { LabelFileError, LIMITS, validateTemplate } from '../src/renderer/editor/validate';
import { parseRfid } from '../src/printer/client';

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

function label(objects: unknown[], extra: Record<string, unknown> = {}) {
  return { name: 'Test', widthMm: 50, heightMm: 30, labelType: 1, canvas: { version: '7', objects }, ...extra };
}

const text = { type: 'Textbox', left: 10, top: 10, width: 200, fontSize: 30, text: 'Hello', fill: '#000000' };

describe('label file validation', () => {
  it('accepts a normal label and keeps only the object list', () => {
    const t = validateTemplate(label([text], { canvas: { version: '7', objects: [text], backgroundImage: { type: 'Image', src: 'file:///etc/passwd' } } }));
    expect(t.widthMm).toBe(50);
    expect(t.canvas.objects).toHaveLength(1);
    expect(t.canvas).not.toHaveProperty('backgroundImage');
  });

  it('rejects sizes that are out of range or not numbers', () => {
    expect(() => validateTemplate(label([], { widthMm: 1e9 }))).toThrow(LabelFileError);
    expect(() => validateTemplate(label([], { heightMm: '30' }))).toThrow(LabelFileError);
    expect(() => validateTemplate(label([], { widthMm: Number.NaN }))).toThrow(LabelFileError);
  });

  it('accepts embedded images and rejects links to files or websites', () => {
    expect(() => validateTemplate(label([{ type: 'Image', src: PNG, width: 10, height: 10 }]))).not.toThrow();
    expect(() => validateTemplate(label([{ type: 'Image', src: 'file:///C:/Users/me/secret.png' }]))).toThrow(/embedded image/);
    expect(() => validateTemplate(label([{ type: 'Image', src: 'https://example.com/x.png' }]))).toThrow(/embedded image/);
    expect(() => validateTemplate(label([{ type: 'Image', src: PNG, oyn: { original: 'file:///x.jpg' } }]))).toThrow(/embedded image/);
  });

  it('rejects unknown element types and pattern fills', () => {
    expect(() => validateTemplate(label([{ type: 'Video', src: PNG }]))).toThrow(/unknown type/);
    expect(() => validateTemplate(label([{ ...text, fill: { type: 'pattern', source: 'https://example.com/x.png' } }]))).toThrow(/colour/);
  });

  it('rejects too many elements and deep nesting', () => {
    const many = Array.from({ length: LIMITS.maxObjects + 1 }, () => ({ ...text }));
    expect(() => validateTemplate(label(many))).toThrow(/more than/);
    let group: Record<string, unknown> = { ...text };
    for (let i = 0; i < 6; i++) group = { type: 'Group', objects: [group] };
    expect(() => validateTemplate(label([group]))).toThrow(/nested/);
  });

  it('rejects tables that are too large', () => {
    expect(() => validateTemplate(label([{ type: 'LabelTable', rows: 500, cols: 2, cells: [] }]))).toThrow(LabelFileError);
  });

  it('drops effects that the editor does not use', () => {
    const t = validateTemplate(label([{ ...text, shadow: { color: 'red' }, filters: [{ type: 'Blur' }] }]));
    expect(t.canvas.objects?.[0]).not.toHaveProperty('shadow');
    expect(t.canvas.objects?.[0]).not.toHaveProperty('filters');
  });

  it('does not change Object.prototype through a "__proto__" key', () => {
    const parsed = JSON.parse('{"name":"x","widthMm":50,"heightMm":30,"canvas":{"objects":[]},"__proto__":{"polluted":true}}');
    validateTemplate(parsed);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
});

describe('RFID text from the printer', () => {
  it('keeps printable characters only and limits the length', () => {
    const enc = new TextEncoder();
    const barcode = new Uint8Array([...enc.encode('6972'), 0x00, 0x1b, ...enc.encode('843')]);
    const serial = enc.encode('S'.repeat(100));
    const d = new Uint8Array([1, 0, 0, 0, 0, 0, 0, 0, barcode.length, ...barcode, serial.length, ...serial, 0, 10, 0, 1, 1]);
    const info = parseRfid(d);
    expect(info.barcode).toBe('6972843');
    expect(info.serial).toHaveLength(64);
  });
});

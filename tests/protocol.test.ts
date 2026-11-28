import { describe, expect, it } from 'vitest';
import { encodePacket, PacketParser, Req } from '../src/printer/protocol';
import { imageToRowPackets, rgbaToMono, rotateMono, fitToPrinthead, rowDotCounts, getPixel } from '../src/printer/encoder';
import { parseHeartbeat, parseRfid } from '../src/printer/client';
import { defaultVariant, findModelById, findModelByName, printheadDots, MODELS } from '../src/printer/models';

describe('packet encoding', () => {
  it('encodes a heartbeat request', () => {
    expect(Array.from(encodePacket(Req.Heartbeat, [1]))).toEqual([0x55, 0x55, 0xdc, 0x01, 0x01, 0xdc, 0xaa, 0xaa]);
  });

  it('adds the 0x03 prefix to the connect request', () => {
    expect(Array.from(encodePacket(Req.Connect, [1], true))).toEqual([0x03, 0x55, 0x55, 0xc1, 0x01, 0x01, 0xc1, 0xaa, 0xaa]);
  });

  it('encodes a model ID request', () => {
    // 0x40 ^ 0x01 ^ 0x08 = 0x49
    expect(Array.from(encodePacket(Req.PrinterInfo, [8]))).toEqual([0x55, 0x55, 0x40, 0x01, 0x08, 0x49, 0xaa, 0xaa]);
  });
});

describe('packet parsing', () => {
  it('joins packets split across notifications', () => {
    const parser = new PacketParser();
    const bytes = encodePacket(0x48, [0x09, 0x00]);
    expect(parser.push(bytes.slice(0, 3))).toEqual([]);
    const out = parser.push(bytes.slice(3));
    expect(out).toHaveLength(1);
    expect(out[0].command).toBe(0x48);
    expect(Array.from(out[0].data)).toEqual([0x09, 0x00]);
  });

  it('reads two packets from one notification and skips noise', () => {
    const parser = new PacketParser();
    const a = encodePacket(0x31, [1]);
    const b = encodePacket(0x33, [1]);
    const merged = new Uint8Array([0x00, 0x12, ...a, ...b]);
    const out = parser.push(merged);
    expect(out.map((p) => p.command)).toEqual([0x31, 0x33]);
  });

  it('rejects a packet with a bad checksum', () => {
    const parser = new PacketParser();
    const bad = encodePacket(0x31, [1]);
    bad[5] ^= 0xff;
    expect(parser.push(bad)).toEqual([]);
  });
});

describe('image encoding', () => {
  function makeImage(width: number, height: number, black: (x: number, y: number) => boolean) {
    const rgba = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const v = black(x, y) ? 0 : 255;
        rgba[i] = rgba[i + 1] = rgba[i + 2] = v;
        rgba[i + 3] = 255;
      }
    }
    return rgbaToMono(rgba, width, height);
  }

  it('packs pixels most significant bit first', () => {
    const img = makeImage(16, 1, (x) => x === 0 || x === 9);
    expect(Array.from(img.data)).toEqual([0x80, 0x40]);
  });

  it('treats transparent pixels as white', () => {
    const rgba = new Uint8ClampedArray([0, 0, 0, 0]);
    expect(rgbaToMono(rgba, 1, 1).data[0]).toBe(0);
  });

  it('rotates clockwise by 90 degrees', () => {
    const img = makeImage(3, 2, (x, y) => x === 0 && y === 0);
    const r = rotateMono(img, 90);
    expect(r.cols).toBe(2);
    expect(r.rows).toBe(3);
    expect(getPixel(r, 1, 0)).toBe(true);
  });

  it('crops a wide image to the print head from the centre', () => {
    const img = makeImage(24, 1, (x) => x === 4 || x === 19);
    const fit = fitToPrinthead(img, 16, 'center');
    expect(fit.cols).toBe(16);
    expect(getPixel(fit, 0, 0)).toBe(true);
    expect(getPixel(fit, 15, 0)).toBe(true);
  });

  it('counts dots per head third', () => {
    const row = new Uint8Array([0xff, 0x00, 0x01]);
    expect(rowDotCounts(row, 24)).toEqual([8, 0, 1]);
  });

  it('groups repeated rows and blank rows', () => {
    const img = makeImage(8, 6, (_x, y) => y >= 2 && y < 5);
    const packets = imageToRowPackets(img, 8);
    expect(packets).toHaveLength(3);
    // blank rows 0-1
    expect(Array.from(packets[0].slice(2, 8))).toEqual([0x84, 0x03, 0x00, 0x00, 0x02, 0x84 ^ 0x03 ^ 0x00 ^ 0x00 ^ 0x02]);
    // black rows 2-4, sent once with a repeat count of 3
    expect(packets[1][2]).toBe(0x85);
    expect(packets[1][4]).toBe(0x00);
    expect(packets[1][5]).toBe(0x02);
    expect(packets[1][9]).toBe(3);
    expect(packets[1][10]).toBe(0xff);
    // blank row 5
    expect(packets[2][2]).toBe(0x84);
  });
});

describe('status parsing', () => {
  it('reads a 13-byte heartbeat', () => {
    const d = new Uint8Array(13);
    d[9] = 0;
    d[10] = 4;
    d[11] = 0;
    d[12] = 1;
    expect(parseHeartbeat(d)).toMatchObject({ lidClosed: true, batteryLevel: 4, paperLoaded: true, rfidRead: true });
  });

  it('reads the cover the other way round for the D110 and similar models', () => {
    // A 10-byte heartbeat from a D110 (model ID 2304): 1 in byte 8 means that the cover is closed.
    const d = new Uint8Array(10);
    d[8] = 1;
    d[9] = 4;
    expect(parseHeartbeat(d, 2304).lidClosed).toBe(true);
    d[8] = 0;
    expect(parseHeartbeat(d, 2304).lidClosed).toBe(false);
    // The B1 (4096) and a printer without a known model use 0 for closed.
    expect(parseHeartbeat(d, 4096).lidClosed).toBe(true);
    expect(parseHeartbeat(d).lidClosed).toBe(true);
    // A heartbeat without a cover byte gives no cover state.
    expect(parseHeartbeat(new Uint8Array(20), 2304).lidClosed).toBeUndefined();
  });

  it('reads RFID label data', () => {
    const enc = new TextEncoder();
    const barcode = enc.encode('6972842743589');
    const serial = enc.encode('PZ1234');
    const d = new Uint8Array([
      1, 2, 3, 4, 5, 6, 7, 8,
      barcode.length, ...barcode,
      serial.length, ...serial,
      0x00, 0xa0, 0x00, 0x14, 0x01,
    ]);
    expect(parseRfid(d)).toMatchObject({ present: true, barcode: '6972842743589', serial: 'PZ1234', totalLabels: 160, usedLabels: 20, type: 1 });
  });

  it('reports no RFID tag', () => {
    expect(parseRfid(new Uint8Array([0]))).toEqual({ present: false });
  });
});

describe('model table', () => {
  it('finds models by ID', () => {
    expect(findModelById(4096)?.name).toBe('B1');
    expect(findModelById(2304)?.name).toBe('D110');
    expect(findModelById(512)?.name).toMatch(/D11/);
  });

  it('computes print head width in dots', () => {
    expect(printheadDots(findModelByName('B1')!)).toBe(384);
    expect(printheadDots(findModelByName('D11')!)).toBe(96);
    expect(printheadDots(findModelByName('B3S')!)).toBe(576);
  });

  it('picks a print variant for every model', () => {
    for (const m of MODELS) expect(['legacy', 'd110', 'modern']).toContain(defaultVariant(m));
    expect(defaultVariant(findModelByName('B1'))).toBe('modern');
    expect(defaultVariant(findModelByName('D11'))).toBe('legacy');
    expect(defaultVariant(findModelByName('D110'))).toBe('d110');
  });
});

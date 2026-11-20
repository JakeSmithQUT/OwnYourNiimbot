import { describe, expect, it } from 'vitest';
import { NiimbotClient } from '../src/printer/client';
import { rgbaToMono, getPixel, type MonoImage } from '../src/printer/encoder';
import { encodePacket, PacketParser, readU16, Req } from '../src/printer/protocol';
import type { Transport } from '../src/printer/transports';
import type { PrintVariant } from '../src/printer/models';

/** Simulated printer that answers requests the way the hardware does and rebuilds the printed image. */
class FakePrinter implements Transport {
  readonly kind = 'serial' as const;
  readonly name = 'Fake printer';
  readonly packetIntervalMs = 0;
  onData?: (data: Uint8Array) => void;
  onClose?: () => void;

  commands: number[] = [];
  pages: { rows: number; cols: number; copies: number; pixels: Set<string> }[] = [];
  printed = 0;
  private parser = new PacketParser();
  private current?: { rows: number; cols: number; copies: number; pixels: Set<string> };
  private quantity = 1;

  constructor(private modelId = 4096) {}

  private reply(cmd: number, data: number[]) {
    setTimeout(() => this.onData?.(encodePacket(cmd, data)), 1);
  }

  async write(bytes: Uint8Array): Promise<void> {
    const data = bytes[0] === 0x03 ? bytes.slice(1) : bytes;
    for (const p of this.parser.push(data)) {
      this.commands.push(p.command);
      const d = p.data;
      switch (p.command) {
        case Req.Connect: this.reply(0xc2, [1]); break;
        case Req.PrinterInfo: {
          const key = d[0];
          const values: Record<number, number[]> = { 8: [this.modelId >> 8, this.modelId & 0xff], 9: [0x01, 0x2c], 12: [0x00, 0xc8], 10: [4], 1: [3], 3: [1], 7: [2], 11: [...new TextEncoder().encode('H123')] };
          this.reply(0x40 + key, values[key] ?? [0]);
          break;
        }
        case Req.Heartbeat: this.reply(0xdd, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 1]); break;
        case Req.RfidInfo: this.reply(0x1b, [0]); break;
        case Req.SetDensity: this.reply(0x31, [1]); break;
        case Req.SetLabelType: this.reply(0x33, [1]); break;
        case Req.PrintStart: this.reply(0x02, [1]); break;
        case Req.PrintClear: this.reply(0x30, [1]); break;
        case Req.PageStart: this.reply(0x04, [1]); break;
        case Req.SetPageSize:
          this.current = { rows: readU16(d, 0), cols: readU16(d, 2), copies: d.length >= 6 ? readU16(d, 4) : 1, pixels: new Set() };
          this.reply(0x14, [1]);
          break;
        case Req.PrintQuantity:
          this.quantity = readU16(d, 0);
          if (this.current) this.current.copies = this.quantity;
          this.reply(0x16, [1]);
          break;
        case Req.PrintBitmapRow: {
          const row = readU16(d, 0);
          const repeat = d[5];
          const bits = d.slice(6);
          for (let r = 0; r < repeat; r++) {
            for (let x = 0; x < bits.length * 8; x++) {
              if (bits[x >> 3] & (0x80 >> (x & 7))) this.current?.pixels.add(`${x},${row + r}`);
            }
          }
          break;
        }
        case Req.PrintEmptyRow: break;
        case Req.PageEnd:
          if (this.current) {
            this.pages.push(this.current);
            this.printed += this.current.copies;
          }
          this.current = undefined;
          this.reply(0xe4, [1]);
          break;
        case Req.PrintStatus: this.reply(0xb3, [this.printed >> 8, this.printed & 0xff, 100, 100]); break;
        case Req.PrintEnd: this.reply(0xf4, [1]); break;
        case Req.CancelPrint: this.reply(0xd0, [1]); break;
        default: this.reply(0x00, [0]);
      }
    }
  }

  async close(): Promise<void> {
    this.onClose?.();
  }
}

function testImage(): MonoImage {
  const w = 40;
  const h = 12;
  const rgba = new Uint8ClampedArray(w * h * 4).fill(255);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if ((x + y) % 7 === 0 || y === 5) {
        const i = (y * w + x) * 4;
        rgba[i] = rgba[i + 1] = rgba[i + 2] = 0;
      }
    }
  }
  return rgbaToMono(rgba, w, h);
}

async function runJob(variant: PrintVariant, modelId: number) {
  const fake = new FakePrinter(modelId);
  const client = new NiimbotClient();
  await client.connect(fake);
  const image = testImage();
  await client.print({ pages: [{ image, copies: 2 }, { image, copies: 1 }], density: 3, labelType: 1, variant, headDots: 384 });
  await client.disconnect();
  return { fake, client, image };
}

describe('print job against a simulated printer', () => {
  it('reads the printer details on connect', async () => {
    const fake = new FakePrinter(2304);
    const client = new NiimbotClient();
    const info = await client.connect(fake);
    expect(info.model?.name).toBe('D110');
    expect(info.firmware).toBe('3.00');
    expect(info.serialNumber).toBe('H123');
    expect(client.status.batteryLevel).toBe(4);
    await client.disconnect();
  });

  for (const [variant, modelId] of [['modern', 4096], ['d110', 2304], ['legacy', 512]] as const) {
    it(`prints with the ${variant} command set`, async () => {
      const { fake, image } = await runJob(variant, modelId);
      expect(fake.pages).toHaveLength(2);
      expect(fake.printed).toBe(3);
      expect(fake.pages[0].copies).toBe(2);
      expect(fake.pages[0].rows).toBe(image.rows);
      expect(fake.pages[0].cols).toBe(image.cols);
      for (let y = 0; y < image.rows; y++) {
        for (let x = 0; x < image.cols; x++) {
          expect(fake.pages[0].pixels.has(`${x},${y}`)).toBe(getPixel(image, x, y));
        }
      }
      const start = fake.commands.indexOf(Req.PrintStart);
      expect(start).toBeGreaterThan(0);
      expect(fake.commands.includes(Req.PrintClear)).toBe(variant === 'd110');
      expect(fake.commands.includes(Req.PrintQuantity)).toBe(variant !== 'modern');
      expect(fake.commands[fake.commands.length - 1]).toBe(Req.PrintEnd);
    });
  }

  it('stops when the printer reports an error', async () => {
    const fake = new FakePrinter(4096);
    const client = new NiimbotClient();
    await client.connect(fake);
    const original = fake.write.bind(fake);
    fake.write = async (bytes: Uint8Array) => {
      await original(bytes);
      if (bytes[2] === Req.PageStart) setTimeout(() => fake.onData?.(encodePacket(0xdb, [1])), 2);
    };
    await expect(
      client.print({ pages: [{ image: testImage(), copies: 1 }], density: 3, labelType: 1, variant: 'modern', headDots: 384 }),
    ).rejects.toThrow(/cover is open/i);
    expect(client.printing).toBe(false);
    await client.disconnect();
  });
});

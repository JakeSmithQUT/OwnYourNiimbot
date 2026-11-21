import { describe, expect, it } from 'vitest';
import { toSVG } from 'bwip-js/browser';
import { BARCODE_FORMATS, bwipName } from '../src/renderer/editor/objects';

describe('barcode formats', () => {
  it('keeps the Codabar id that saved labels and the assistant tools use', () => {
    expect(BARCODE_FORMATS.map((f) => f.id)).toContain('codabar');
    expect(bwipName('codabar')).toBe('rationalizedCodabar');
    expect(bwipName('code128')).toBe('code128');
  });

  it('gives bwip-js an encoder that draws the sample value of each format', () => {
    for (const f of BARCODE_FORMATS) {
      const draw = () => toSVG({ bcid: bwipName(f.id), text: f.sample, parse: f.id === 'gs1-128' });
      expect(draw, f.id).not.toThrow();
    }
  });
});

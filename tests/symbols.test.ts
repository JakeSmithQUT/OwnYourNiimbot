import { describe, expect, it } from 'vitest';
import { COMMON_ICONS, ICON_GROUPS, ICONS, iconSvg, searchIcons } from '../src/renderer/editor/icons';
import * as ornaments from '../src/renderer/templates/ornaments';
import * as motifs from '../src/renderer/templates/motifs';

describe('symbol library', () => {
  it('gives each symbol a different lower-case name', () => {
    const names = ICONS.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z][a-z ]*[a-z]$/);
  });

  it('puts each symbol in a group', () => {
    expect(ICON_GROUPS.length).toBeGreaterThan(10);
    for (const i of ICONS) expect(ICON_GROUPS).toContain(i.group);
  });

  it('keeps the names that saved labels and the assistant tools use', () => {
    const names = new Set(ICONS.map((i) => i.name));
    for (const name of ['warning', 'stop', 'high voltage', 'fragile', 'keep dry', 'this way up', 'recycle', 'food', 'book', 'leaf', 'tools', 'bike']) expect(names.has(name)).toBe(true);
  });

  it('shows 24 common symbols before the full list', () => {
    expect(COMMON_ICONS).toHaveLength(24);
  });

  it('finds symbols by name and by group', () => {
    expect(searchIcons('tree').map((i) => i.name)).toContain('pine tree');
    expect(searchIcons('laundry')).toHaveLength(9);
    expect(searchIcons('  ')).toHaveLength(ICONS.length);
    expect(searchIcons('no such symbol')).toHaveLength(0);
  });

  it('has a group of cute animals with four expressions for each face', () => {
    const cute = ICONS.filter((i) => i.group === 'Cute animals').map((i) => i.name);
    expect(cute.length).toBeGreaterThan(100);
    for (const animal of ['cat', 'dog', 'bunny', 'koala', 'wombat', 'quokka', 'kangaroo', 'platypus', 'tasmanian devil']) {
      for (const name of [`cute ${animal}`, `happy ${animal}`, `sleepy ${animal}`, `${animal} with heart`]) expect(cute).toContain(name);
    }
    for (const name of ['joey in pouch', 'emu', 'echidna', 'kookaburra']) expect(cute).toContain(name);
  });

  it('draws each symbol as an SVG image', () => {
    for (const { name, Icon } of ICONS) {
      const svg = iconSvg(Icon);
      expect(svg.startsWith('<svg'), name).toBe(true);
      expect(svg, name).toMatch(/<(path|circle|rect|line|polyline|polygon|ellipse)/);
      expect(svg, name).not.toMatch(/NaN|undefined/);
    }
  });
});

describe('template ornaments', () => {
  const sizes: [number, number][] = [[50, 30], [22, 12], [20, 20], [50, 80], [35, 1.2], [3, 3]];
  const skip = new Set(['svg', 'n', 'flip', 'tagCut']);
  const all = [...Object.entries(ornaments), ...Object.entries(motifs)].filter(([name, fn]) => typeof fn === 'function' && !skip.has(name)) as [string, (w: number, h: number) => string][];

  it('has ornaments to test', () => {
    expect(all.length).toBeGreaterThan(40);
  });

  it.each(all)('%s gives a valid image at each size', (_name, fn) => {
    for (const [w, h] of sizes) {
      const out = fn(w, h);
      expect(out.startsWith('<svg')).toBe(true);
      expect(out).not.toMatch(/NaN|undefined|Infinity/);
    }
  });

  it('swaps black and white', () => {
    expect(motifs.flip('<a fill="#000"/><b stroke="#fff"/>')).toBe('<a fill="#fff"/><b stroke="#000"/>');
  });
});

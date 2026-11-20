#!/usr/bin/env node
// Converts the printer list from an extracted copy of the official app into the
// model table used by this project (src/printer/models.json).
//
// Usage:
//   node tools/import-printer-list.mjs <path to printerList.json> [output path]
//
// The input file is in assets/flutter_assets/assets/config/ inside base.apk.
// Only factual hardware data is kept: model names, model IDs, resolution,
// print widths, density ranges and supported paper types.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const [, , inputPath, outputArg] = process.argv;
if (!inputPath) {
  console.error('Usage: node tools/import-printer-list.mjs <printerList.json> [output]');
  process.exit(1);
}
const outputPath = resolve(outputArg ?? 'src/printer/models.json');

const PROTOCOL_BY_INTERFACE = { 1: 'niimbot', 2: 'zicox', 3: 'daozhen', 4: 'snbc' };
const ALIGN_BY_METHOD = { 1: 'left', 2: 'center', 3: 'right' };
const SERIES_NAMES = { '萌印': 'B16', '一小台H1': 'H1', '一小台H1S': 'H1S', 'B2系列': 'B2', 'B21系列': 'B21' };

function seriesName(raw, fallback) {
  if (!raw) return fallback;
  if (SERIES_NAMES[raw]) return SERIES_NAMES[raw];
  return raw.replace(/\s*系列$/u, '').trim() || fallback;
}

const source = JSON.parse(readFileSync(inputPath, 'utf8'));
const models = source
  .map((p) => {
    const paperTypes = new Set();
    for (const c of p.consumables ?? []) {
      for (const child of c.childProperties ?? []) paperTypes.add(child.code);
    }
    for (const code of String(p.paperType ?? '').split(',')) {
      const n = Number(code);
      if (Number.isInteger(n) && n > 0) paperTypes.add(n);
    }
    return {
      name: p.name.replace(/_/g, ' '),
      ids: [...(p.codes ?? [])].sort((a, b) => a - b),
      series: seriesName(p.seriesName, p.name),
      protocol: PROTOCOL_BY_INTERFACE[p.interfaceType] ?? 'unknown',
      dpi: Number(p.paccuracyName) || 203,
      printDirection: Number(p.printDirection) || 0,
      align: ALIGN_BY_METHOD[p.printMethodCode] ?? 'center',
      printWidthMm: { min: p.widthSetStart ?? null, max: p.widthSetEnd ?? null },
      maxLabelMm: { width: p.maxPrintWidth ?? null, length: p.maxPrintHeight ?? null },
      density: {
        min: p.solubilitySetStart ?? 1,
        max: p.solubilitySetEnd ?? 5,
        default: p.solubilitySetDefault ?? 3,
      },
      paperTypes: [...paperTypes].sort((a, b) => a - b),
      defaultLabelMm: { width: p.defaultWidth ?? 50, height: p.defaultHeigth ?? 30 },
      rfid: (p.rfidType ?? 0) > 0,
      wifi: Boolean(p.isSupportWifi),
      cutter: p.cutterType && p.cutterType !== 'NONE' ? p.cutterType.toLowerCase() : null,
      calibration: Boolean(p.isSupportCalibration),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

writeFileSync(outputPath, JSON.stringify(models, null, 2) + '\n');
console.log(`Wrote ${models.length} models to ${outputPath}`);

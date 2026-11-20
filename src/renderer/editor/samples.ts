import { Line, Rect, Textbox, type FabricObject } from 'fabric';
import { LabelBarcode, LabelTable } from './objects';
import { emptyTemplate, type LabelTemplate } from './template';
import { mmToUnits as mm, ptToUnits as pt } from './units';
import { LabelType } from '../../printer/protocol';
import { formatDate } from './placeholders';

function text(value: string, opts: Record<string, unknown>, data: Record<string, unknown> = { kind: 'text' }): Textbox {
  const t = new Textbox(value, { fontFamily: 'Arial', fill: '#000000', textAlign: 'left', lineHeight: 1.1, ...opts });
  (t as unknown as { oyn: unknown }).oyn = data;
  return t;
}

function build(name: string, w: number, h: number, objects: FabricObject[], labelType: number = LabelType.Gap): LabelTemplate {
  const t = emptyTemplate(w, h, labelType);
  t.id = `sample-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  t.name = name;
  t.canvas = { version: '6', objects: objects.map((o) => o.toObject(['oyn'])) };
  return t;
}

export function sampleTemplates(): LabelTemplate[] {
  return [
    build('Name tag', 50, 30, [
      new Rect({ left: mm(0), top: mm(0), width: mm(50), height: mm(8), fill: '#000000', strokeWidth: 0 }),
      text('HELLO, MY NAME IS', { left: mm(2), top: mm(1.6), width: mm(46), fontSize: pt(10), fontWeight: 'bold', fill: '#ffffff', textAlign: 'center' }),
      text('{{Name}}', { left: mm(2), top: mm(12), width: mm(46), fontSize: pt(22), fontWeight: 'bold', textAlign: 'center' }),
      text('{{Team}}', { left: mm(2), top: mm(23), width: mm(46), fontSize: pt(9), textAlign: 'center' }),
    ]),
    build('Price tag', 40, 30, [
      text('Product name', { left: mm(2), top: mm(2), width: mm(36), fontSize: pt(9), fontWeight: 'bold' }),
      text('$9.99', { left: mm(2), top: mm(8), width: mm(36), fontSize: pt(24), fontWeight: 'bold' }),
      new LabelBarcode({ format: 'ean13', value: '590123412345', left: mm(2), top: mm(19), width: mm(36), height: mm(10), textSize: pt(6) }),
    ]),
    build('Asset tag', 50, 30, [
      new LabelBarcode({ format: 'qrcode', value: 'ASSET-{{index}}', left: mm(2), top: mm(3), width: mm(24), height: mm(24) }),
      text('PROPERTY OF', { left: mm(28), top: mm(4), width: mm(21), fontSize: pt(6.5) }),
      text('Your company', { left: mm(28), top: mm(7.5), width: mm(21), fontSize: pt(7), fontWeight: 'bold' }),
      new Line([0, 0, mm(20), 0], { left: mm(28), top: mm(13), stroke: '#000000', strokeWidth: mm(0.3) }),
      text('SN-0001', { left: mm(28), top: mm(17), width: mm(21), fontSize: pt(10), fontWeight: 'bold' }, {
        kind: 'serial',
        serial: { start: 1, step: 1, digits: 4, prefix: 'SN-', suffix: '' },
      }),
    ]),
    build('Food storage', 50, 30, [
      text('{{Item}}', { left: mm(2), top: mm(2), width: mm(46), fontSize: pt(14), fontWeight: 'bold' }),
      text('Made', { left: mm(2), top: mm(12), width: mm(14), fontSize: pt(8) }),
      text(formatDate(new Date(), 'ddd D MMM'), { left: mm(16), top: mm(12), width: mm(32), fontSize: pt(8), fontWeight: 'bold' }, { kind: 'datetime', format: 'ddd D MMM', offsetDays: 0 }),
      text('Use by', { left: mm(2), top: mm(17), width: mm(14), fontSize: pt(8) }),
      text(formatDate(new Date(Date.now() + 3 * 86400000), 'ddd D MMM'), { left: mm(16), top: mm(17), width: mm(32), fontSize: pt(8), fontWeight: 'bold' }, { kind: 'datetime', format: 'ddd D MMM', offsetDays: 3 }),
      new Rect({ left: mm(1), top: mm(23), width: mm(48), height: mm(6), fill: 'transparent', stroke: '#000000', strokeWidth: mm(0.3), strokeUniform: true }),
      text('Notes:', { left: mm(2), top: mm(24.2), width: mm(46), fontSize: pt(7) }),
    ]),
    build('Cable flag', 30, 14, [
      text('{{From}}', { left: mm(1), top: mm(2), width: mm(28), fontSize: pt(9), fontWeight: 'bold', textAlign: 'center' }),
      new Line([0, 0, mm(26), 0], { left: mm(2), top: mm(7), stroke: '#000000', strokeWidth: mm(0.2), strokeDashArray: [mm(1), mm(0.6)] }),
      text('{{To}}', { left: mm(1), top: mm(8), width: mm(28), fontSize: pt(9), textAlign: 'center' }),
    ]),
    build('Shipping table', 50, 40, [
      new LabelTable({
        left: mm(1),
        top: mm(1),
        width: mm(48),
        height: mm(38),
        rows: 4,
        cols: 2,
        colRatios: [0.35, 0.65],
        cells: [['To', '{{Name}}'], ['Address', '{{Address}}'], ['Phone', '{{Phone}}'], ['Order', '{{Order}}']],
        fontSize: pt(7),
        lineWidth: mm(0.25),
        textAlign: 'left',
      }),
    ]),
  ];
}

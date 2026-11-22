// Decorative templates that use the bundled fonts and the vector ornaments.
// Designs keep to solid black and white, with lines of at least 0.3 mm,
// so that they print cleanly on a 1-bit thermal head.

import type { FabricObject } from 'fabric';
import { art, barcode, box, cols, datamatrix, date, extentX, fitPt, hline, icon, inset, insideCircle, onBaseline, pack, packInCircle, ptOf, qr, rect, rows, serial, shift, text, vline, type Box, type Part } from './layout';
import { area, ic, NARROW, narrow, pad, ROUND, roundArea, SMALL, stack, TALL, white, withCode, withIcon, type TemplateDesign } from './kit';
import * as orn from './ornaments';

const F = {
  sans: 'Montserrat',
  inter: 'Inter',
  condensed: 'Oswald',
  bebas: 'Bebas Neue',
  heavy: 'Archivo Black',
  serif: 'Playfair Display',
  fat: 'Abril Fatface',
  classic: 'Cinzel',
  slab: 'Roboto Slab',
  retro: 'Pacifico',
  formal: 'Great Vibes',
  script: 'Dancing Script',
  hand: 'Caveat',
  marker: 'Permanent Marker',
  amatic: 'Amatic SC',
  round: 'Fredoka',
  righteous: 'Righteous',
  mono: 'JetBrains Mono',
  space: 'Space Mono',
};

const full = (w: number, h: number) => box(0, 0, w, h);
const isRound = (w: number, h: number) => Math.abs(w - h) < 0.5 && w <= 51;
const tall = (w: number, h: number) => h > w * 1.15;
/** Top and bottom of a row that an ornament fills, for pack(). */
const span = (b: Box): [number, number] => [b.y, b.y + b.h];

/** A small caption and a value on one row, for example "Roasted" and a date. */
function pair(b: Box, label: string, value: (v: Box) => Part[], font = F.sans, ratio = 1.1): Part[] {
  const [l, v] = cols(b, [ratio, 1.6], 0.6);
  const parts = value(v);
  return parts.every((p) => !(p instanceof Promise)) ? onBaseline([text(l, label, { font }), parts as FabricObject[]]) : [...text(l, label, { font }), ...parts];
}

// ---------- Gifts and crafts ----------

const GIFTS: TemplateDesign[] = [
  {
    id: 'gift-tag-script',
    name: 'Gift tag, script',
    category: 'Gifts and crafts',
    description: 'Double frame, a script heading and lines for "to" and "from".',
    fonts: [F.formal, F.serif],
    sizes: [[50, 30], [40, 30], [60, 40], [70, 40], [50, 50]],
    build: (w, h) => {
      const a = inset(full(w, h), Math.max(2.4, pad(w, h) + 1.4));
      const [title, rule, to, from] = rows(a, [1.8, 0.5, 1, 1], 0.4);
      const cells = [to, from].map((b) => cols(b, [1, 3.2], 0.8));
      const labelPt = Math.min(fitPt('To', cells[0][0], { font: F.serif, italic: true }), fitPt('From', cells[1][0], { font: F.serif, italic: true }));
      const namePt = Math.min(fitPt('Sam', cells[0][1], { font: F.script, bold: true }), fitPt('Alex', cells[1][1], { font: F.script, bold: true }));
      const line = (b: Box, label: string, name: string) => {
        const [l, v] = cols(b, [1, 3.2], 0.8);
        return [
          ...text(l, label, { font: F.serif, italic: true, valign: 'bottom', maxPt: labelPt }),
          ...text(v, name, { font: F.script, bold: true, valign: 'bottom', maxPt: namePt }),
          hline(v.x, v.y + v.h - 0.2, v.w, { width: 0.25 }),
        ];
      };
      return [
        ...art(full(w, h), orn.frame(w, h, { stroke: 0.5, radius: 1.6, inner: 1.3, innerStroke: 0.25 })),
        ...pack(
          [text(title, 'For you', { font: F.formal, align: 'center' }), art(inset(rule, rule.w * 0.2, 0), orn.diamondRule(rule.w * 0.6, rule.h)), line(to, 'To', 'Sam'), line(from, 'From', 'Alex')],
          a,
          0.4,
          [undefined, span(rule)],
        ),
      ];
    },
  },
  {
    id: 'gift-tag-ticket',
    name: 'Gift ticket',
    category: 'Gifts and crafts',
    description: 'Ticket shape with notched sides, a tear-off stub and a ticket number that counts up.',
    fonts: [F.bebas, F.retro, F.hand],
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const main = inset(box(0, 0, w * 0.72, h), Math.max(2, h * 0.1), h * 0.12);
      const stub = inset(box(w * 0.72, 0, w * 0.28, h), Math.max(1.4, w * 0.03), h * 0.2);
      const [top, mid, bottom] = rows(main, [1, 1.7, 1], 0.4);
      const [no, num] = rows(stub, [1, 1.6], 0.4);
      return [
        ...art(full(w, h), orn.ticket(w, h, 0.55)),
        ...(() => {
          const admit = text(top, 'ADMIT ONE', { font: F.bebas, align: 'center', spacing: 200 });
          return [
            ...pack([admit, text(mid, 'Happy Birthday', { font: F.retro, align: 'center' }), text(bottom, 'love, Sam', { font: F.hand, bold: true, align: 'center' })], main, 0.4),
            ...pack(
              [text(no, 'NO.', { font: F.bebas, align: 'center', spacing: 100, maxPt: ptOf(admit) }), serial(num, { start: 1, step: 1, digits: 3, prefix: '', suffix: '' }, { font: F.bebas, align: 'center' })],
              stub,
              0.4,
            ),
          ];
        })(),
      ];
    },
  },
  {
    id: 'handmade-seal',
    name: 'Handmade seal',
    category: 'Gifts and crafts',
    description: 'Round scalloped seal with white script text, for packaging and envelopes.',
    fonts: [F.retro, F.sans],
    sizes: ROUND,
    round: true,
    build: (w, h) => {
      return [
        ...art(full(w, h), orn.seal(w, Math.round(w * 0.9))),
        ...packInCircle(insideCircle(w, h, w * 0.43), [1.5, 0.8], 0.3, ([t1, t2]) => [
          text(t1, 'handmade', { font: F.retro, align: 'center' }).map(white),
          text(t2, 'WITH LOVE', { font: F.sans, bold: true, align: 'center', spacing: 160 }).map(white),
        ]),
      ];
    },
  },
  {
    id: 'thank-you-script',
    name: 'Thank you, script',
    category: 'Gifts and crafts',
    description: 'A formal script "Thank you" over a fine rule, with a small capital line under it.',
    fonts: [F.formal, F.sans],
    sizes: [[50, 30], [40, 30], [50, 20], [40, 20], ...ROUND],
    roundSizes: ROUND,
    build: (w, h) => {
      const roundLabel = isRound(w, h);
      const a = roundLabel ? roundArea(w, h) : area(w, h);
      // Round stickers have less room, so the small line is shorter or left out.
      const sub = roundLabel ? (w >= 30 ? 'FOR YOUR ORDER' : '') : 'FOR SUPPORTING SMALL BUSINESS';
      const ratios = sub ? [2.2, 0.45, 0.8] : [2.2, 0.45];
      const draw = ([t, r, s]: Box[]) => [
        text(t, 'Thank you', { font: F.formal, align: 'center' }),
        art(inset(r, r.w * 0.12, 0), orn.diamondRule(r.w * 0.76, r.h)),
        ...(sub ? [text(s, sub, { font: F.sans, bold: true, align: 'center', spacing: 120 })] : []),
      ];
      const rule = (bx: Box[]) => [undefined, span(bx[1])];
      if (roundLabel) return [rect(inset(full(w, h), w * 0.05), { stroke: 0.4, radius: w * 0.45 }), ...packInCircle(insideCircle(w, h, w * 0.45 - 0.2), ratios, 0.4, draw, rule)];
      const boxes = rows(a, ratios, 0.4);
      return pack(draw(boxes), a, 0.4, rule(boxes));
    },
  },
  {
    id: 'wedding-favour',
    name: 'Wedding favour',
    category: 'Gifts and crafts',
    description: 'Initials in an italic serif, a leaf sprig and the date. For favours, jars and place settings.',
    fonts: [F.serif, F.classic],
    sizes: [...ROUND, [50, 30], [40, 40]],
    roundSizes: ROUND,
    build: (w, h) => {
      const roundLabel = isRound(w, h);
      const a = roundLabel ? roundArea(w, h) : inset(full(w, h), pad(w, h) + 1.5);
      const draw = ([n, s, d]: Box[]) => [
        text(n, 'A & J', { font: F.serif, italic: true, bold: true, align: 'center' }),
        art(inset(s, s.w * 0.18, 0), orn.sprig(s.w * 0.64, s.h)),
        text(d, '12 · 03 · 2027', { font: F.classic, align: 'center', spacing: 80 }),
      ];
      const sprig = (bx: Box[]) => [undefined, span(bx[1])];
      if (roundLabel) return [rect(inset(full(w, h), w * 0.04), { stroke: 0.35, radius: w * 0.46 }), ...packInCircle(insideCircle(w, h, w * 0.46 - 0.18), [2, 0.7, 0.8], 0.4, draw, sprig)];
      const boxes = rows(a, [2, 0.7, 0.8], 0.4);
      return [...art(full(w, h), orn.frame(w, h, { stroke: 0.4, inner: 1.2, innerStroke: 0.25 })), ...pack(draw(boxes), a, 0.4, sprig(boxes))];
    },
  },
  {
    id: 'party-bag',
    name: 'Party bag',
    category: 'Gifts and crafts',
    description: 'Birthday party bag label with stars, a retro script heading and the guest name.',
    fonts: [F.retro, F.round],
    sizes: [[50, 30], [40, 30], [60, 40], [50, 50]],
    build: (w, h) => {
      const s = Math.min(w, h) * 0.16;
      const a = inset(full(w, h), Math.max(pad(w, h) + 0.5, s + 1.2), pad(w, h) + 0.5);
      const [head, name, age] = rows(a, [1.4, 1.6, 0.8], 0.4);
      return [
        ...art(box(0.8, 0.8, s, s), orn.star(s, s)),
        ...art(box(w - s - 0.8, h - s - 0.8, s, s), orn.star(s, s)),
        ...art(box(w - s * 0.7 - 1.2, 1.2, s * 0.7, s * 0.7), orn.star(s * 0.7, s * 0.7, false)),
        ...pack([text(head, 'Happy Birthday', { font: F.retro, align: 'center' }), text(name, 'Mia', { font: F.round, bold: true, align: 'center' }), text(age, 'is turning seven', { font: F.round, align: 'center' })], a, 0.4),
      ];
    },
  },
  {
    id: 'ex-libris',
    name: 'Ex libris bookplate',
    category: 'Gifts and crafts',
    description: 'Classic bookplate with a double frame, "Ex Libris" in capitals and the owner name.',
    fonts: [F.classic, F.serif],
    sizes: [[50, 50], [50, 70], [50, 30], [60, 40]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 2.4);
      const parts = tall(w, h) || w === h ? rows(a, [1, 1.6, 0.6, 1.2, 0.5], 0.6) : rows(a, [1, 0.01, 0.5, 1.2, 0.5], 0.4);
      const [head, pic, rule, name, line] = parts;
      return [
        ...art(full(w, h), orn.frame(w, h, { stroke: 0.7, radius: 0.6, inner: 1.6, innerStroke: 0.3 })),
        ...(() => {
          const sq = box(pic.x + (pic.w - Math.min(pic.w, pic.h)) / 2, pic.y + (pic.h - Math.min(pic.w, pic.h)) / 2, Math.min(pic.w, pic.h), Math.min(pic.w, pic.h));
          const withPic = pic.h > 2;
          return pack(
            [
              text(head, 'EX LIBRIS', { font: F.classic, bold: true, align: 'center', spacing: 200 }),
              ...(withPic ? [icon(pic, ic('book'))] : []),
              art(inset(rule, rule.w * 0.15, 0), orn.diamondRule(rule.w * 0.7, rule.h)),
              text(name, 'Charlotte Morgan', { font: F.serif, italic: true, align: 'center' }),
              art(inset(line, line.w * 0.3, 0), orn.dots(line.w * 0.4, line.h)),
            ],
            a,
            0.6,
            withPic ? [undefined, span(sq), span(rule), undefined, span(line)] : [undefined, span(rule), undefined, span(line)],
          );
        })(),
      ];
    },
  },
  {
    id: 'candle',
    name: 'Candle label',
    category: 'Gifts and crafts',
    description: 'Brand in classical capitals, the scent in an italic serif and the wax, weight and burn time.',
    fonts: [F.classic, F.serif, F.sans],
    sizes: [[50, 50], [50, 70], [60, 40], [50, 30], [70, 40]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 2);
      const [brand, rule, scent, detail] = rows(a, [1, 0.45, tall(w, h) ? 2.2 : 1.5, 0.7], 0.6);
      return [
        ...art(full(w, h), orn.frame(w, h, { stroke: 0.45, radius: 1, inner: 1.2, innerStroke: 0.25 })),
        ...pack(
          [
            text(brand, 'LUMEN & CO', { font: F.classic, bold: true, align: 'center', spacing: 220 }),
            art(inset(rule, rule.w * 0.2, 0), orn.diamondRule(rule.w * 0.6, rule.h)),
            text(scent, 'Fig & Cedar', { font: F.serif, italic: true, align: 'center' }),
            text(detail, 'SOY WAX · 200 G · 40 HOURS', { font: F.sans, bold: true, align: 'center', spacing: 80 }),
          ],
          a,
          0.6,
          [undefined, span(rule)],
        ),
      ];
    },
  },
  {
    id: 'soap',
    name: 'Soap label',
    category: 'Gifts and crafts',
    description: 'Retro script brand, a wave divider, the scent and the batch details.',
    fonts: [F.retro, F.serif, F.sans],
    sizes: [[50, 30], [50, 50], [60, 40], [40, 30]],
    build: (w, h) => {
      const a = area(w, h);
      const [brand, wv, scent, detail] = rows(a, [1.4, 0.4, 1.2, 0.7], 0.5);
      return [
        ...pack(
          [
            text(brand, 'Bramble Soap Co.', { font: F.retro, align: 'center' }),
            art(inset(wv, wv.w * 0.15, 0), orn.wave(wv.w * 0.7, wv.h)),
            text(scent, 'Lavender & Oat', { font: F.serif, bold: true, align: 'center' }),
            text(detail, 'COLD PROCESS · 100 G', { font: F.sans, bold: true, align: 'center', spacing: 100 }),
          ],
          a,
          0.5,
          [undefined, span(wv)],
        ),
      ];
    },
  },
  {
    id: 'jam-vintage',
    name: 'Vintage jam jar',
    category: 'Gifts and crafts',
    description: 'Fat serif fruit name, a script "homemade" and the month it was made.',
    fonts: [F.fat, F.script, F.sans],
    sizes: [...ROUND, [50, 30], [40, 30]],
    roundSizes: ROUND,
    build: (w, h) => {
      const roundLabel = isRound(w, h);
      const a = roundLabel ? roundArea(w, h) : inset(full(w, h), pad(w, h) + 1.5);
      const draw = ([m, f, d]: Box[]) => {
        // The fruit is the main line: the other lines stay smaller.
        const fruit = text(f, 'Strawberry', { font: F.fat, align: 'center' });
        const cap = ptOf(fruit) * 0.8;
        return [text(m, 'homemade', { font: F.script, bold: true, align: 'center', maxPt: cap }), fruit, date(d, 'MMM YYYY', 0, { font: F.sans, bold: true, align: 'center', spacing: 100, maxPt: cap })];
      };
      if (roundLabel) return [...art(full(w, h), orn.seal(w, Math.round(w * 0.9), false)), ...packInCircle(insideCircle(w, h, w * 0.41), [0.9, 1.6, 0.7], 0.3, draw)];
      return [...art(full(w, h), orn.dotFrame(w, h, 0.55, 1.5)), ...pack(draw(rows(a, [0.9, 1.6, 0.7], 0.3)), a, 0.3)];
    },
  },
  {
    id: 'plant-stake',
    name: 'Plant tag, handwritten',
    category: 'Gifts and crafts',
    description: 'Leaf sprig with a handwritten plant name and watering note.',
    fonts: [F.hand],
    sizes: [...NARROW, ...SMALL, [50, 30]],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) {
        return withIcon(a, ic('leaf'), w / h > 3 ? 4.5 : 2.4, (t) => text(t, 'Basil', { font: F.hand, bold: true }));
      }
      const [s, n, note] = rows(a, [0.6, 1.6, 0.8], 0.3);
      return pack(
        [art(inset(s, s.w * 0.2, 0), orn.sprig(s.w * 0.6, s.h)), text(n, 'Sweet basil', { font: F.hand, bold: true, align: 'center' }), text(note, 'water every 2 days', { font: F.hand, align: 'center' })],
        a,
        0.3,
        [span(s)],
      );
    },
  },
];

// ---------- Small business ----------

const BUSINESS: TemplateDesign[] = [
  {
    id: 'coffee-bag',
    name: 'Coffee bag',
    category: 'Small business',
    description: 'Roaster name, origin, tasting notes, roast level, roast date and weight.',
    fonts: [F.bebas, F.fat, F.serif, F.sans],
    sizes: [...TALL, [60, 40], [70, 40], [80, 50], [100, 100]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 0.8);
      if (tall(w, h) || w === h) {
        const [brand, origin, notes, rule, roast, info] = rows(a, [0.9, 1.6, 0.9, 0.35, 0.7, 0.7], 0.6);
        const [rd, wt] = cols(info, [1.6, 1], 1);
        return pack(
          [
            text(brand, 'NORTHSIDE ROASTERS', { font: F.bebas, align: 'center', spacing: 160 }),
            text(origin, 'Ethiopia', { font: F.fat, align: 'center' }),
            text(notes, 'blueberry · cocoa · jasmine', { font: F.serif, italic: true, align: 'center' }),
            art(inset(rule, rule.w * 0.1, 0), orn.dots(rule.w * 0.8, rule.h)),
            text(roast, 'ROAST  ● ● ● ○ ○', { font: F.sans, bold: true, align: 'center', spacing: 40 }),
            [...pair(rd, 'Roasted', (v) => date(v, 'DD/MM/YY', 0, { font: F.sans, bold: true })), ...text(wt, '250 G', { font: F.bebas, align: 'right', spacing: 60 })],
          ],
          a,
          0.6,
          [undefined, undefined, undefined, span(rule)],
        );
      }
      const [left, right] = cols(a, [1.4, 1], 2);
      const [brand, origin, notes] = rows(left, [0.8, 1.5, 0.8], 0.5);
      const [roast, rd, wt] = rows(right, [1, 1, 1], 0.5);
      return [
        ...pack([text(brand, 'NORTHSIDE ROASTERS', { font: F.bebas, spacing: 120 }), text(origin, 'Ethiopia', { font: F.fat }), text(notes, 'blueberry · cocoa · jasmine', { font: F.serif, italic: true })], left, 0.5),
        ...pack(
          [text(roast, '● ● ● ○ ○', { font: F.sans, align: 'right' }), pair(rd, 'Roasted', (v) => date(v, 'DD/MM', 0, { font: F.sans, bold: true, align: 'right' })), text(wt, '250 G', { font: F.bebas, align: 'right', spacing: 60 })],
          right,
          0.5,
        ),
      ];
    },
  },
  {
    id: 'bakery-box',
    name: 'Bakery box',
    category: 'Small business',
    description: 'Bakery name in script, the item, the bake date and an allergen line.',
    fonts: [F.retro, F.serif, F.sans],
    sizes: [[50, 30], [50, 50], [60, 40], [70, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [brand, wv, item, baked, allergen] = rows(a, [1.3, 0.35, 1.3, 0.7, 0.6], 0.4);
      return [
        ...pack(
          [
            text(brand, 'Crumb & Co.', { font: F.retro, align: 'center' }),
            art(inset(wv, wv.w * 0.2, 0), orn.wave(wv.w * 0.6, wv.h)),
            text(item, 'Sourdough loaf', { font: F.serif, bold: true, align: 'center' }),
            pair(baked, 'Baked', (v) => date(v, 'ddd D MMM', 0, { font: F.sans, bold: true })),
            text(allergen, 'Contains: wheat, rye', { font: F.sans, align: 'center', italic: true }),
          ],
          a,
          0.4,
          [undefined, span(wv)],
        ),
      ];
    },
  },
  {
    id: 'new-burst',
    name: 'New, star burst',
    category: 'Small business',
    description: 'Solid star burst with "NEW" in white. Change the word for sale or limited stock.',
    fonts: [F.heavy, F.sans],
    sizes: [...ROUND, [40, 40]],
    round: true,
    build: (w, h) => {
      const a = inset(full(w, h), Math.min(w, h) * 0.22);
      const [t1, t2] = rows(a, [1.6, 0.6], 0.2);
      return [
        ...art(full(w, h), orn.burst(w, h, Math.max(14, Math.round(w * 0.6)))),
        ...pack([text(t1, 'NEW', { font: F.heavy, align: 'center' }).map(white), text(t2, 'FLAVOUR', { font: F.sans, bold: true, align: 'center', spacing: 160 }).map(white)], a, 0.2),
      ];
    },
  },
  {
    id: 'boutique-price',
    name: 'Boutique price tag',
    category: 'Small business',
    description: 'Corner marks, the item in an italic serif, a fat serif price and the SKU in monospace.',
    fonts: [F.serif, F.fat, F.mono],
    sizes: [[40, 30], [50, 30], [40, 20], [50, 20], [30, 70], [25, 75]],
    build: (w, h) => {
      if (h > w * 1.5) {
        const flag = h - 45;
        const a = inset(box(0, 0, w, flag), 1.6, 1.2);
        const [item, price, sku] = rows(a, [1, 1.4, 0.7], 0.3);
        return [
          hline(0, flag, w, { dash: true, width: 0.2 }),
          ...pack([text(item, 'Silver ring', { font: F.serif, italic: true, align: 'center' }), text(price, '$49', { font: F.fat, align: 'center' }), text(sku, 'RG-0142', { font: F.mono, align: 'center' })], a, 0.3),
        ];
      }
      const a = inset(full(w, h), pad(w, h) + 1.2);
      const [item, price, sku] = rows(a, [1, 1.6, 0.6], 0.3);
      return [
        ...art(full(w, h), orn.corners(w, h, Math.min(w, h) * 0.25, 0.5)),
        ...pack([text(item, 'Linen shirt', { font: F.serif, italic: true, align: 'center' }), text(price, '$89', { font: F.fat, align: 'center' }), text(sku, 'SKU LS-0412-M', { font: F.mono, align: 'center' })], a, 0.3),
      ];
    },
  },
  {
    id: 'review-qr',
    name: 'Review us QR code',
    category: 'Small business',
    description: 'Asks customers to scan a QR code and leave a review, with five stars.',
    fonts: [F.retro, F.sans],
    sizes: [[50, 30], [40, 30], [50, 50], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const body = (rest: Box) => {
        const [head, sub, stars] = rows(rest, [1.4, 1, 0.8], 0.4);
        const sw = Math.min(stars.h, stars.w / 6);
        const sy = stars.y + (stars.h - sw) / 2;
        return pack(
          [
            text(head, 'Loved it?', { font: F.retro, align: 'center' }),
            text(sub, rest.w < 24 ? 'Scan to review' : 'Scan to leave a review', { font: F.sans, bold: true, align: 'center' }),
            Array.from({ length: 5 }, (_, i) => art(box(stars.x + (stars.w - sw * 5.6) / 2 + i * sw * 1.15, sy, sw, sw), orn.star(sw, sw))).flat(),
          ],
          rest,
          0.4,
          [undefined, undefined, [sy, sy + sw]],
        );
      };
      if (w === h) {
        const [code, rest] = rows(a, [1.4, 1], 1);
        return [...qr(code, 'https://example.com/review'), ...body(rest)];
      }
      return withCode(a, (sq) => qr(sq, 'https://example.com/review'), body);
    },
  },
  {
    id: 'follow-us',
    name: 'Follow us',
    category: 'Small business',
    description: 'Social handle in a retro display font with a QR code to your page.',
    fonts: [F.righteous, F.hand],
    sizes: [[50, 30], [40, 30], [50, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      return withCode(a, (sq) => qr(sq, 'https://example.com/yourshop'), (rest) =>
        stack(rest, [{ t: 'follow along', font: F.hand, bold: true, align: 'center' }, { t: '@yourshop', font: F.righteous, weight: 1.4, align: 'center' }], 0.3),
      );
    },
  },
  {
    id: 'packed-with-care',
    name: 'Packed with care',
    category: 'Small business',
    description: 'Handwritten "packed with care by" with a heart, a name line and the date.',
    fonts: [F.hand, F.sans],
    sizes: [[50, 30], [40, 30], [50, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [l, r] = cols(a, [1, w / h > 2.2 ? 5 : 3.4], 1.2);
      const [t, n, d] = rows(r, [1.2, 1, 0.8], 0.3);
      return [
        ...art(box(l.x, l.y + (l.h - l.w) / 2, l.w, l.w * 0.9), orn.heart(l.w, l.w * 0.9)),
        ...pack([text(t, 'packed with care by', { font: F.hand, bold: true }), [...text(n, 'Alex', { font: F.hand }), hline(n.x, n.y + n.h, n.w * 0.8, { width: 0.25 })], date(d, 'D MMM YYYY', 0, { font: F.sans })], r, 0.3),
      ];
    },
  },
  {
    id: 'craft-beer',
    name: 'Craft beer',
    category: 'Small business',
    description: 'Ribbon banner with the brewery name, a fat serif beer name, the style and the strength.',
    fonts: [F.bebas, F.fat, F.serif, F.condensed],
    sizes: [...TALL, [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h));
      const [rb, name, style, info] = rows(a, [tall(w, h) ? 1 : 1.1, 1.8, 1, 0.7], 0.6);
      const ribbonBox = inset(rb, 0, 0);
      const inner = inset(box(ribbonBox.x, ribbonBox.y, ribbonBox.w, ribbonBox.h * 0.8), ribbonBox.w * 0.16, ribbonBox.h * 0.08);
      return [
        ...pack(
          [
            [...art(ribbonBox, orn.ribbon(ribbonBox.w, ribbonBox.h)), ...text(inner, 'HARBOUR BREWING', { font: F.bebas, align: 'center', spacing: 120 }).map(white)],
            text(name, 'Low Tide', { font: F.fat, align: 'center' }),
            text(style, 'Hazy Pale Ale', { font: F.serif, italic: true, align: 'center' }),
            text(info, '5.4% ALC/VOL · 375 ML', { font: F.condensed, bold: true, align: 'center', spacing: 60 }),
          ],
          a,
          0.6,
          [span(ribbonBox)],
        ),
      ];
    },
  },
  {
    id: 'wine',
    name: 'Wine bottle',
    category: 'Small business',
    description: 'Vineyard in classical capitals, a large vintage year, the variety and the volume.',
    fonts: [F.classic, F.serif, F.sans],
    sizes: [...TALL, [60, 40], [70, 40]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 2.2);
      const [v, year, variety, s, info] = rows(a, [0.9, tall(w, h) ? 2 : 1.5, 1, 0.5, 0.6], 0.6);
      return [
        ...art(full(w, h), orn.frame(w, h, { stroke: 0.5, radius: 0.4, inner: 1.4, innerStroke: 0.25 })),
        ...pack(
          [
            text(v, 'CHÂTEAU EXEMPLE', { font: F.classic, bold: true, align: 'center', spacing: 160 }),
            text(year, '2024', { font: F.serif, bold: true, align: 'center' }),
            text(variety, 'Shiraz', { font: F.serif, italic: true, align: 'center' }),
            art(inset(s, s.w * 0.2, 0), orn.sprig(s.w * 0.6, s.h)),
            text(info, '750 ML · 14.5% VOL', { font: F.sans, bold: true, align: 'center', spacing: 80 }),
          ],
          a,
          0.6,
          [undefined, undefined, undefined, span(s)],
        ),
      ];
    },
  },
  {
    id: 'market-price',
    name: 'Market stall price card',
    category: 'Small business',
    description: 'Hand-drawn item name, a heavy price and a short note, in a dotted frame.',
    fonts: [F.amatic, F.heavy, F.hand],
    sizes: [[50, 30], [50, 50], [60, 40], [70, 40]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 1.4);
      const [item, price, note] = rows(a, [1.3, 1.6, 0.8], 0.3);
      return [
        ...art(full(w, h), orn.dotFrame(w, h, 0.6, 1.7)),
        ...pack([text(item, 'Heirloom tomatoes', { font: F.amatic, bold: true, align: 'center' }), text(price, '$6 / KG', { font: F.heavy, align: 'center' }), text(note, 'spray-free · picked today', { font: F.hand, align: 'center' })], a, 0.3),
      ];
    },
  },
];

// ---------- Home and kitchen ----------

const HOME: TemplateDesign[] = [
  {
    id: 'pantry-modern',
    name: 'Pantry jar, modern',
    category: 'Home and kitchen',
    description: 'Spaced capitals, a wave rule and a best-before date.',
    fonts: [F.sans],
    sizes: [[50, 30], [40, 30], [40, 20], [50, 20], [60, 40], ...NARROW],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) return text(a, 'PASTA', { font: F.sans, bold: true, align: 'center', spacing: 300 });
      const [name, wv, bb] = rows(a, [1.8, 0.35, 0.8], 0.6);
      return pack(
        [
          text(name, 'PASTA', { font: F.sans, bold: true, align: 'center', spacing: 300 }),
          art(inset(wv, wv.w * 0.25, 0), orn.wave(wv.w * 0.5, wv.h)),
          pair(bb, 'best before', (v) => date(v, 'MMM YYYY', 365, { font: F.sans, bold: true }), F.sans, 1.3),
        ],
        a,
        0.6,
        [undefined, span(wv)],
      );
    },
  },
  {
    id: 'pantry-script',
    name: 'Pantry jar, script',
    category: 'Home and kitchen',
    description: 'Formal script name over a leaf sprig.',
    fonts: [F.formal],
    sizes: [[50, 30], [40, 30], [60, 40], [50, 20], ...ROUND],
    roundSizes: ROUND,
    build: (w, h) => {
      const roundLabel = isRound(w, h);
      const a = roundLabel ? roundArea(w, h) : area(w, h);
      const draw = ([n, s]: Box[]) => [text(n, 'Brown Sugar', { font: F.formal, align: 'center' }), art(inset(s, s.w * 0.22, 0), orn.sprig(s.w * 0.56, s.h))];
      const sprig = (bx: Box[]) => [undefined, span(bx[1])];
      if (roundLabel) return [rect(inset(full(w, h), w * 0.05), { stroke: 0.35, radius: w * 0.45 }), ...packInCircle(insideCircle(w, h, w * 0.45 - 0.18), [2.4, 0.6], 0.3, draw, sprig)];
      const boxes = rows(a, [2.4, 0.6], 0.3);
      return pack(draw(boxes), a, 0.3, sprig(boxes));
    },
  },
  {
    id: 'spice-retro',
    name: 'Spice jar, retro',
    category: 'Home and kitchen',
    description: 'Solid scalloped seal with the spice name in white capitals.',
    fonts: [F.bebas, F.sans],
    sizes: ROUND,
    round: true,
    build: (w, h) => {
      return [
        ...art(full(w, h), orn.seal(w, Math.round(w * 0.9))),
        ...packInCircle(insideCircle(w, h, w * 0.43), [1.6, 0.6], 0.2, ([n, d]) => [
          text(n, 'CUMIN', { font: F.bebas, align: 'center', spacing: 80 }).map(white),
          text(d, 'GROUND', { font: F.sans, bold: true, align: 'center', spacing: 200 }).map(white),
        ]),
      ];
    },
  },
  {
    id: 'storage-hazard',
    name: 'Storage bin, bold',
    category: 'Home and kitchen',
    description: 'Striped bands and a heavy title, easy to read from across the garage.',
    fonts: [F.heavy, F.sans],
    sizes: [[50, 30], [60, 40], [70, 40], [100, 100], [100, 150]],
    build: (w, h) => {
      const band = Math.max(2.4, h * 0.14);
      const a = inset(box(0, band, w, h - 2 * band), pad(w, h), 1);
      const [t, s] = rows(a, [2, 0.8], 0.4);
      return [
        ...art(box(0, 0, w, band), orn.stripes(w, band)),
        ...art(box(0, h - band, w, band), orn.stripes(w, band)),
        ...pack([text(t, 'CABLES', { font: F.heavy, align: 'center' }), text(s, '& POWER ADAPTERS', { font: F.sans, bold: true, align: 'center', spacing: 120 })], a, 0.4),
      ];
    },
  },
  {
    id: 'freezer-retro',
    name: 'Freezer, retro',
    category: 'Home and kitchen',
    description: 'Snowflake, a condensed meal name, the freeze date and a use-by date three months later.',
    fonts: [F.bebas, F.condensed],
    sizes: [[50, 30], [40, 30], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [top, name, d1, d2] = rows(a, [1, 1.4, 0.8, 0.8], 0.4);
      const [i, t] = cols(top, [1, 4], 1);
      return pack(
        [
          [...icon(i, ic('frozen'), 'start'), ...text(t, 'FROM THE FREEZER', { font: F.bebas, spacing: 100 })],
          text(name, 'Chicken curry', { font: F.condensed, bold: true }),
          pair(d1, 'Frozen', (v) => date(v, 'DD/MM/YY', 0, { font: F.condensed }), F.condensed),
          pair(d2, 'Use by', (v) => date(v, 'DD/MM/YY', 91, { font: F.condensed, bold: true }), F.condensed),
        ],
        a,
        0.4,
        [span(top)],
      );
    },
  },
  {
    id: 'laundry',
    name: 'Laundry and bathroom',
    category: 'Home and kitchen',
    description: 'Hand-drawn capitals with a droplet, for laundry baskets, bottles and shelves.',
    fonts: [F.amatic],
    sizes: [...NARROW, ...SMALL, [50, 30]],
    build: (w, h) => {
      const a = area(w, h);
      return withIcon(a, ic('liquid'), w / h > 3 ? 4.5 : 2.6, (t) => text(t, 'Laundry powder', { font: F.amatic, bold: true }));
    },
  },
  {
    id: 'name-fun',
    name: 'Name label, fun',
    category: 'School and events',
    description: 'Rounded friendly letters with a star, for school gear and drink bottles.',
    fonts: [F.round],
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const s = Math.min(a.h, a.w * 0.2);
      const [l, t] = cols(a, [s, a.w - s], 1);
      const words = text(t, 'Charlie M.', { font: F.round, bold: true });
      // A short name and the star are centred on the label as a group.
      const x = extentX(words);
      const dx = x ? (a.x + a.w - x[1]) / 2 : 0;
      return shift([...art(box(l.x, l.y + (l.h - s) / 2, s, s), orn.star(s, s)), ...words], dx > 0.2 ? dx : 0, 0);
    },
  },
  {
    id: 'school-book',
    name: 'Exercise book',
    category: 'School and events',
    description: 'Large subject name with lines for the student name and class.',
    fonts: [F.round, F.hand],
    sizes: [[50, 30], [60, 40], [70, 40], [50, 50]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 1);
      const [subject, n, c] = rows(a, [1.6, 1, 1], 0.5);
      const cells = [n, c].map((b) => cols(b, [1, 3], 0.8));
      const labelPt = Math.min(fitPt('Name', cells[0][0], { font: F.round }), fitPt('Class', cells[1][0], { font: F.round }));
      const valuePt = Math.min(fitPt('Charlie', cells[0][1], { font: F.hand, bold: true }), fitPt('5B', cells[1][1], { font: F.hand, bold: true }));
      const line = (b: Box, label: string, value: string) => {
        const [l, v] = cols(b, [1, 3], 0.8);
        return [
          ...text(l, label, { font: F.round, valign: 'bottom', maxPt: labelPt }),
          ...text(v, value, { font: F.hand, bold: true, valign: 'bottom', maxPt: valuePt }),
          hline(v.x, v.y + v.h - 0.2, v.w, { width: 0.25 }),
        ];
      };
      return [
        rect(inset(full(w, h), 0.3), { stroke: 0.6, radius: 2.4 }),
        ...pack([text(subject, 'Mathematics', { font: F.round, bold: true, align: 'center' }), line(n, 'Name', 'Charlie'), line(c, 'Class', '5B')], a, 0.5),
      ];
    },
  },
];

// ---------- Office, events and IT ----------

const OFFICE: TemplateDesign[] = [
  {
    id: 'badge-modern',
    name: 'Name badge, modern',
    category: 'Office',
    description: 'Black side bar, a heavy first name, the surname and a role in a black pill.',
    fonts: [F.heavy, F.sans],
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const bar = Math.max(2, w * 0.05);
      const a = inset(box(bar, 0, w - bar, h), pad(w, h) + 1, pad(w, h) + 0.5);
      const [first, last, role] = rows(a, [1.8, 1, 0.8], 0.5);
      return [
        rect(box(0, 0, bar, h), { fill: true }),
        ...pack(
          [
            text(first, 'Alex', { font: F.heavy }),
            text(last, 'Morgan', { font: F.sans, bold: true }),
            text(box(role.x, role.y, role.w * 0.7, role.h), 'OPERATIONS', { font: F.sans, bold: true, invert: true, hug: true, align: 'center', spacing: 120 }),
          ],
          a,
          0.5,
        ),
      ];
    },
  },
  {
    id: 'conference-badge',
    name: 'Conference badge',
    category: 'School and events',
    description: 'Event ribbon, attendee name, company in italics, a contact QR code and a role band.',
    fonts: [F.bebas, F.sans, F.serif],
    sizes: [[60, 40], [70, 40], [80, 50], [50, 30]],
    build: (w, h) => {
      const p = pad(w, h);
      const [top, mid, band] = rows(box(0, 0, w, h), [1, 2.6, 0.9], 0);
      const rb = inset(top, p, p * 0.5);
      const inner = inset(box(rb.x, rb.y, rb.w, rb.h * 0.8), rb.w * 0.14, rb.h * 0.08);
      return [
        ...art(rb, orn.ribbon(w - 2 * p, top.h - p)),
        ...text(inset(inner, 0, 0), 'BUILD DAY 2026', { font: F.bebas, align: 'center', spacing: 160 }).map(white),
        ...withCode(inset(mid, p + 0.5, 0.8), (sq) => qr(sq, 'BEGIN:VCARD\nVERSION:3.0\nFN:Alex Morgan\nORG:Example Pty Ltd\nEND:VCARD'), (rest) =>
          stack(rest, [{ t: 'Alex Morgan', font: F.sans, bold: true, weight: 1.5 }, { t: 'Example Pty Ltd', font: F.serif, italic: true }], 0.4),
        ),
        rect(band, { fill: true }),
        ...text(inset(band, p, band.h * 0.15), 'SPEAKER', { font: F.bebas, align: 'center', spacing: 300 }).map(white),
      ];
    },
  },
  {
    id: 'desk-plate',
    name: 'Desk name plate',
    category: 'Office',
    description: 'Serif name and spaced capital title with a diamond rule.',
    fonts: [F.serif, F.sans],
    sizes: [[50, 20], [70, 40], [60, 40], [75, 12], [50, 15]],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) {
        const [n, t] = cols(a, [1.5, 1], 1.5);
        return onBaseline([text(n, 'Alex Morgan', { font: F.serif, bold: true }), text(t, 'OPERATIONS', { font: F.sans, bold: true, align: 'right', spacing: 120 })]);
      }
      const [n, r, t] = rows(a, [1.6, 0.4, 0.8], 0.5);
      return [
        ...pack(
          [text(n, 'Alex Morgan', { font: F.serif, bold: true, align: 'center' }), art(inset(r, r.w * 0.25, 0), orn.diamondRule(r.w * 0.5, r.h)), text(t, 'OPERATIONS MANAGER', { font: F.sans, bold: true, align: 'center', spacing: 160 })],
          a,
          0.5,
          [undefined, span(r)],
        ),
      ];
    },
  },
  {
    id: 'file-tab-bold',
    name: 'File tab, numbered',
    category: 'Office',
    description: 'Black number block and a condensed folder title.',
    fonts: [F.bebas, F.condensed],
    sizes: [...NARROW, [50, 20]],
    build: (w, h) => {
      const a = inset(full(w, h), 0.8, 0.8);
      const [n, t] = cols(a, [1, w / h > 4 ? 6 : 3], 1.2);
      return [...text(n, '01', { font: F.bebas, invert: true, align: 'center' }), ...text(t, 'Contracts 2026', { font: F.condensed, bold: true })];
    },
  },
];

const TECH: TemplateDesign[] = [
  {
    id: 'server-tech',
    name: 'Server label, technical',
    category: 'IT and servers',
    description: 'Corner marks, a display hostname, monospace addresses, a rack unit badge and a QR code.',
    fonts: [F.bebas, F.mono],
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 0.6);
      return [
        ...art(full(w, h), orn.corners(w, h, Math.min(w, h) * 0.2, 0.5)),
        ...withCode(a, (sq) => qr(sq, 'web-prod-01 10.20.0.21 S/N 7XK2M93'), (rest) => {
          const [top, l1, , l3] = rows(rest, [1.5, 0.8, 0.8, 0.8], 0.35);
          const [host, u] = cols(top, [3, 1], 0.8);
          return pack(
            [
              [...text(host, 'WEB-PROD-01', { font: F.bebas, spacing: 40 }), ...text(u, 'U12', { font: F.bebas, invert: true, align: 'center' })],
              stack(box(l1.x, l1.y, l1.w, l3.y + l3.h - l1.y), [
                { t: 'IP   10.20.0.21', font: F.mono },
                { t: 'BMC  10.20.99.21', font: F.mono },
                { t: 'S/N  7XK2M93', font: F.mono },
              ], 0.35),
            ],
            rest,
            0.35,
          );
        }),
      ];
    },
  },
  {
    id: 'homelab',
    name: 'Homelab device',
    category: 'IT and servers',
    description: 'Terminal-style title bar, a display hostname and an SSH line in monospace.',
    fonts: [F.space, F.righteous, F.mono],
    sizes: [[50, 30], [40, 30], [60, 40], [50, 20]],
    build: (w, h) => {
      const bar = Math.max(3, h * 0.2);
      const a = inset(box(0, bar, w, h - bar), pad(w, h), 0.8);
      const [host, cmd] = rows(a, [1.5, 0.8], 0.5);
      const d = bar * 0.32;
      return [
        rect(box(0, 0, w, bar), { fill: true, radius: 1 }),
        ...art(box(1.2, (bar - d) / 2, d * 3.6, d), orn.windowDots(d * 3.6, d)),
        ...text(inset(box(1.2 + d * 5, 0, w - 2.4 - d * 5, bar), 0.4, bar * 0.18), '~/homelab', { font: F.space, align: 'right' }).map(white),
        ...pack([text(host, 'pihole', { font: F.righteous }), text(cmd, '$ ssh pi@10.0.0.5', { font: F.mono })], a, 0.5),
      ];
    },
  },
  {
    id: 'wifi-elegant',
    name: 'Wi-Fi card, elegant',
    category: 'IT and servers',
    description: 'Double frame, a script welcome, the Wi-Fi QR code and the details in monospace.',
    fonts: [F.serif, F.mono],
    sizes: [[50, 50], [60, 40], [70, 40], [50, 30]],
    build: (w, h) => {
      const a = inset(full(w, h), pad(w, h) + 1.8);
      const value = 'WIFI:T:WPA;S:Guest Network;P:change-me-please;;';
      const details = (rest: Box) =>
        stack(rest, [
          { t: 'Welcome', font: F.serif, italic: true, bold: true, weight: 1.6, align: 'center' },
          { t: 'Guest Network', font: F.mono, align: 'center' },
          { t: 'change-me-please', font: F.mono, align: 'center' },
        ], 0.4);
      return [
        ...art(full(w, h), orn.frame(w, h, { stroke: 0.45, radius: 1.2, inner: 1.2, innerStroke: 0.25 })),
        ...(w === h
          ? (() => {
              const [code, rest] = rows(a, [1.3, 1], 0.8);
              return pack([qr(code, value), details(rest)], a, 0.8);
            })()
          : withCode(a, (sq) => qr(sq, value), details, 'left')),
      ];
    },
  },
  {
    id: 'cable-flag-mono',
    name: 'Cable flag, monospace',
    category: 'Network and cables',
    description: 'Port mapping in monospace on the 12.5 mm cable roll. The flag folds in half and the tail wraps the cable.',
    fonts: [F.mono],
    sizes: [[109, 12.5]],
    build: (w, h) => {
      const flag = 74 * (w / 109);
      const half = flag / 2;
      const content = (x: number) =>
        stack(inset(box(x, 0, half, h), 1.2, 1), [
          { t: 'SW01:24', font: F.mono, bold: true, align: 'center' },
          { t: 'PP-A:24', font: F.mono, align: 'center' },
        ], 0.2);
      return [...content(0), vline(half, 0, h, { dash: true, width: 0.2 }), ...content(half), vline(flag, 0, h, { dash: true, width: 0.2 }), ...text(inset(box(flag, 0, w - flag, h), 2, 3), 'tail', { align: 'center', italic: true, maxPt: 6 })];
    },
  },
  {
    id: 'hazard-band',
    name: 'Caution band',
    category: 'Electrical and workshop',
    description: 'Striped bands with a heavy warning word and the hazard.',
    fonts: [F.heavy, F.sans],
    sizes: [[50, 30], [60, 40], [70, 40], [40, 20], [50, 20], ...NARROW],
    build: (w, h) => {
      if (narrow(h)) {
        const sw = Math.min(w * 0.22, 9);
        const a = inset(box(sw, 0, w - sw, h), 1.2, 1);
        return [...art(box(0, 0, sw, h), orn.stripes(sw, h, 1.4)), ...text(a, 'HOT SURFACE', { font: F.heavy, align: 'center' })];
      }
      const band = Math.max(2.2, h * 0.16);
      const a = inset(box(0, band, w, h - 2 * band), pad(w, h), 0.8);
      const [t, s] = rows(a, [1.6, 0.8], 0.4);
      return [
        ...art(box(0, 0, w, band), orn.stripes(w, band)),
        ...art(box(0, h - band, w, band), orn.stripes(w, band)),
        ...pack([text(t, 'CAUTION', { font: F.heavy, align: 'center', spacing: 80 }), text(s, 'HOT SURFACE', { font: F.sans, bold: true, align: 'center', spacing: 160 })], a, 0.4),
      ];
    },
  },
  {
    id: 'asset-tech',
    name: 'Asset tag, technical',
    category: 'IT and servers',
    description: 'Data Matrix code, a display heading and the asset number in monospace. The number counts up.',
    fonts: [F.bebas, F.mono],
    sizes: [[40, 20], [50, 20], [30, 14], [40, 12], [50, 15], [30, 15]],
    build: (w, h) => {
      const a = inset(full(w, h), 0.9, 0.9);
      return withCode(a, (sq) => datamatrix(sq, 'IT-{{index:5}}'), (rest) =>
        narrow(h)
          ? serial(rest, { start: 1, step: 1, digits: 5, prefix: 'IT-', suffix: '' }, { font: F.mono, bold: true })
          : (() => {
              const [t, n] = rows(rest, [1, 1.3], 0.4);
              return pack([text(t, 'IT ASSET', { font: F.bebas, spacing: 160 }), serial(n, { start: 1, step: 1, digits: 5, prefix: 'IT-', suffix: '' }, { font: F.mono, bold: true })], rest, 0.4);
            })(),
      'left');
    },
  },
  {
    id: 'product-barcode-modern',
    name: 'Product label, modern',
    category: 'Retail',
    description: 'Brand in spaced capitals, product name, size and an EAN-13 barcode.',
    fonts: [F.sans, F.serif],
    sizes: [[50, 30], [40, 30], [60, 40], [50, 50]],
    build: (w, h) => {
      const a = area(w, h);
      const [brand, name, size, code] = rows(a, [0.7, 1.3, 0.6, 1.5], 0.4);
      return pack(
        [
          text(brand, 'NORTH & PINE', { font: F.sans, bold: true, align: 'center', spacing: 260 }),
          text(name, 'Hand cream', { font: F.serif, italic: true, align: 'center' }),
          text(size, '75 ML', { font: F.sans, align: 'center', spacing: 120 }),
          barcode(code, '9300000000002', 'ean13'),
        ],
        a,
        0.4,
      );
    },
  },
];

export const CREATIVE: TemplateDesign[] = [...GIFTS, ...BUSINESS, ...HOME, ...OFFICE, ...TECH];


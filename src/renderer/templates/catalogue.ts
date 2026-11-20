// The built-in template library. Each design builds its own layout for every
// size in its size list, so one design gives a template for each roll size.
// Sizes are in screen orientation (width × height as the editor shows them).

import {
  barcode,
  box,
  circle,
  cols,
  datamatrix,
  date,
  hline,
  icon,
  inset,
  qr,
  rect,
  rows,
  serial,
  table,
  text,
  vline,
  type Box,
  type Part,
} from './layout';
import {
  area,
  dataset,
  ic,
  MEDIUM,
  NARROW,
  NARROW_SHORT,
  narrow,
  pad,
  repeatCols,
  ROUND,
  roundArea,
  SMALL,
  stack,
  white,
  withCode,
  type TemplateDesign,
} from './kit';
import { CREATIVE } from './creative';

export { CATEGORIES, type Category, type Size, type TemplateDesign } from './kit';

// ---------- IT and servers ----------

interface ServerValues {
  host: string;
  ip: string;
  bmc: string;
  sn: string;
  role: string;
  qr: string;
}

/** Longest values in the example data, for sizing the text of the data template. */
const SERVER_SIZING: ServerValues = {
  host: 'backup-prod-01',
  ip: '10.200.100.200',
  bmc: '10.200.199.200',
  sn: 'J4Q8R21XX',
  role: 'PRODUCTION · DATABASE',
  qr: '',
};

function serverLabel(v: ServerValues, fit?: ServerValues) {
  return (w: number, h: number): Part[] => {
    const a = area(w, h);
    if (narrow(h) || h <= 22) {
      return withCode(a, (sq) => qr(sq, v.qr), (rest) =>
        stack(rest, [
          { t: v.host, fit: fit?.host, weight: 1.5, bold: true },
          { t: `IP ${v.ip}`, fit: fit && `IP ${fit.ip}` },
          ...(h > 16 ? [{ t: `S/N ${v.sn}`, fit: fit && `S/N ${fit.sn}` }] : []),
        ]),
      );
    }
    const [main, foot] = rows(a, [h - 6.5, 4.5], 1);
    return [
      ...withCode(main, (sq) => qr(sq, v.qr), (rest) =>
        stack(rest, [
          { t: v.host, fit: fit?.host, weight: 1.6, bold: true },
          { t: `IP  ${v.ip}`, fit: fit && `IP  ${fit.ip}` },
          { t: `BMC ${v.bmc}`, fit: fit && `BMC ${fit.bmc}` },
          { t: `S/N ${v.sn}`, fit: fit && `S/N ${fit.sn}` },
        ]),
      ),
      ...text(foot, v.role, { invert: true, bold: true, align: 'center', maxPt: 9, spacing: 60, fitText: fit?.role }),
    ];
  };
}

const IT: TemplateDesign[] = [
  {
    id: 'server',
    name: 'Server label',
    category: 'IT and servers',
    description: 'Hostname, IP address, BMC or iLO address, serial number, role and a QR code with the same details.',
    sizes: [...MEDIUM, ...SMALL, [80, 50]],
    build: serverLabel({
      host: 'web-prod-01',
      ip: '10.20.0.21',
      bmc: '10.20.99.21',
      sn: '7XK2M93',
      role: 'PRODUCTION · WEB',
      qr: 'web-prod-01\nIP 10.20.0.21\nBMC 10.20.99.21\nS/N 7XK2M93',
    }),
  },
  {
    id: 'server-batch',
    name: 'Server labels from a spreadsheet',
    category: 'IT and servers',
    description: 'Prints one server label for each row. Columns: Hostname, IP, BMC, Serial, Role. Example data loads with the template.',
    sizes: [[50, 30], [40, 30], [60, 40], [50, 20]],
    sampleData: dataset('Example servers', ['Hostname', 'IP', 'BMC', 'Serial', 'Role'], [
      ['web-prod-01', '10.20.0.21', '10.20.99.21', '7XK2M93', 'PRODUCTION · WEB'],
      ['web-prod-02', '10.20.0.22', '10.20.99.22', '7XK2M94', 'PRODUCTION · WEB'],
      ['db-prod-01', '10.20.1.11', '10.20.99.31', 'J4Q8R21', 'PRODUCTION · DATABASE'],
      ['backup-01', '10.20.2.5', '10.20.99.41', 'H2W6T70', 'BACKUP'],
    ]),
    build: serverLabel({
      host: '{{Hostname}}',
      ip: '{{IP}}',
      bmc: '{{BMC}}',
      sn: '{{Serial}}',
      role: '{{Role}}',
      qr: '{{Hostname}}\nIP {{IP}}\nS/N {{Serial}}',
    }, SERVER_SIZING),
  },
  {
    id: 'rack-ear',
    name: 'Rack ear label',
    category: 'IT and servers',
    description: 'Hostname and IP address on a narrow strip that fits the ear of a 1U server or switch.',
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      if (w >= 60) {
        const [n, ip, u] = cols(a, [2.2, 2, 0.9], 1.2);
        return [...text(n, 'web-prod-01', { bold: true }), ...text(ip, '10.20.0.21'), ...text(u, 'U12', { invert: true, bold: true, align: 'center' })];
      }
      return stack(a, [{ t: 'web-prod-01', weight: 1.3, bold: true }, { t: '10.20.0.21' }], 0.2);
    },
  },
  {
    id: 'rack-unit',
    name: 'Rack position',
    category: 'IT and servers',
    description: 'Rack unit number with the rack name and side. Put one on the front and one on the rear rail.',
    sizes: [...NARROW_SHORT, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const [u, rest] = cols(a, [1, 1.6], 1);
      return [...text(u, 'U12', { invert: true, bold: true, align: 'center' }), ...stack(rest, [{ t: 'Rack A03', bold: true }, { t: 'Front' }], 0.2)];
    },
  },
  {
    id: 'asset-tag',
    name: 'Asset tag with barcode',
    category: 'IT and servers',
    description: 'Organisation name, asset number and a Code 128 barcode for scanners.',
    sizes: [[50, 20], [40, 20], [50, 30], [40, 30], [60, 40], [75, 12], [50, 15]],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) {
        return withCode(a, (sq) => datamatrix(sq, 'IT-00421'), (rest) => stack(rest, [{ t: 'PROPERTY OF IT', bold: true }, { t: 'IT-00421' }], 0.2), 'left');
      }
      const [head, code] = rows(a, [1, 2.4], 0.8);
      return [...text(head, 'PROPERTY OF YOUR COMPANY', { invert: true, bold: true, align: 'center', spacing: 40 }), ...barcode(code, 'IT-00421')];
    },
  },
  {
    id: 'asset-serial',
    name: 'Numbered asset tags',
    category: 'IT and servers',
    description: 'A run of asset tags. Each label gets the next number, in the text and in the QR code. Set the count in the print dialog.',
    sizes: [[40, 30], [50, 30], [40, 20], [50, 20], [40, 12], [30, 14], [30, 15]],
    build: (w, h) => {
      const a = area(w, h);
      return withCode(a, (sq) => qr(sq, 'A-{{index:4}}'), (rest) =>
        narrow(h)
          ? serial(rest, { start: 1, step: 1, digits: 4, prefix: 'A-', suffix: '' }, { bold: true })
          : [
              ...stack(rows(rest, [1, 1.6], 0.5)[0], [{ t: 'ASSET', bold: true, maxPt: 8 }]),
              ...serial(rows(rest, [1, 1.6], 0.5)[1], { start: 1, step: 1, digits: 4, prefix: 'A-', suffix: '' }, { bold: true }),
            ],
      'left');
    },
  },
  {
    id: 'laptop',
    name: 'Laptop or desktop',
    category: 'IT and servers',
    description: 'Device name, user, serial number, asset number, purchase date and warranty end, with a QR code.',
    sizes: [[50, 30], [60, 40], [70, 40], [40, 30], [50, 20]],
    build: (w, h) => {
      const a = area(w, h);
      return withCode(a, (sq) => qr(sq, 'LT-0157 · S/N PF3KX9Z2'), (rest) =>
        h <= 22
          ? stack(rest, [{ t: 'LT-0157', bold: true, weight: 1.4 }, { t: 'S/N PF3KX9Z2' }, { t: 'J. Citizen' }])
          : stack(rest, [
              { t: 'LT-0157', bold: true, weight: 1.6 },
              { t: 'User  J. Citizen' },
              { t: 'S/N  PF3KX9Z2' },
              { t: 'Bought  03/2026' },
              { t: 'Warranty to  03/2029' },
            ]),
      );
    },
  },
  {
    id: 'disk',
    name: 'Drive or disk',
    category: 'IT and servers',
    description: 'Bay number, capacity and serial number for hard drives, SSDs and spare parts.',
    sizes: [...NARROW_SHORT, [30, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [bay, rest] = cols(a, [1, 2.4], 0.8);
      return [
        ...text(bay, 'BAY\n3', { invert: true, bold: true, align: 'center', lineHeight: 1 }),
        ...stack(rest, [{ t: '4 TB SSD', bold: true }, { t: w < 26 ? 'S5GNNF0R1234' : 'S/N S5GNNF0R1234' }], 0.2),
      ];
    },
  },
  {
    id: 'network-device',
    name: 'Switch, router or access point',
    category: 'IT and servers',
    description: 'Device name, management IP, VLAN and model, with a QR code.',
    sizes: [[50, 30], [40, 30], [60, 40], [50, 20], [40, 20], [75, 12], [50, 15]],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) {
        const [n, ip] = cols(a, [1.2, 1], 1);
        return [...text(n, 'sw-core-01', { bold: true }), ...text(ip, 'MGMT 10.0.0.2')];
      }
      return withCode(a, (sq) => qr(sq, 'sw-core-01 MGMT 10.0.0.2'), (rest) =>
        stack(rest, h <= 22
          ? [{ t: 'sw-core-01', bold: true, weight: 1.4 }, { t: 'MGMT 10.0.0.2' }, { t: 'VLAN 10' }]
          : [{ t: 'sw-core-01', bold: true, weight: 1.5 }, { t: 'MGMT  10.0.0.2' }, { t: 'VLAN  10, 20, 99' }, { t: 'Model  48-port PoE' }]),
      );
    },
  },
  {
    id: 'wifi',
    name: 'Wi-Fi QR code',
    category: 'IT and servers',
    description: 'Guests scan the QR code to join the network. Change the network name and password in the QR code and in the text.',
    sizes: [[50, 30], [40, 30], [60, 40], [50, 50], [40, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const value = 'WIFI:T:WPA;S:Guest Network;P:change-me-please;;';
      if (w / h < 1.3) {
        const [code, info] = rows(a, [2.4, 1], 0.8);
        return [...qr(code, value), ...stack(info, [{ t: 'Guest Network', bold: true, align: 'center' }, { t: 'Password: change-me-please', align: 'center' }], 0.2)];
      }
      return withCode(a, (sq) => qr(sq, value), (rest) =>
        stack(rest, [{ t: 'Wi-Fi', bold: true, weight: 1.6 }, { t: 'Guest Network', bold: true }, { t: 'Password' }, { t: 'change-me-please' }]),
      'left');
    },
  },
  {
    id: 'do-not-unplug',
    name: 'Do not unplug',
    category: 'IT and servers',
    description: 'Warning for plugs, power switches and network cables that must stay connected.',
    sizes: [...NARROW, ...SMALL, [50, 30]],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 5 : 3], 1);
      return [...icon(i, ic('warning')), ...stack(t, narrow(h) ? [{ t: 'DO NOT UNPLUG', bold: true }] : [{ t: 'DO NOT UNPLUG', bold: true, weight: 1.4 }, { t: 'Call IT on ext. 1234' }])];
    },
  },
  {
    id: 'service-record',
    name: 'Service record',
    category: 'IT and servers',
    description: 'Date of the last service, the next due date (six months later) and initials.',
    sizes: [[50, 30], [40, 30], [50, 20], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, 3], 0.8);
      const [r1, r2, r3] = rows(body, [1, 1, 1], 0.3);
      const [l1, v1] = cols(r1, [1, 1.4], 0.6);
      const [l2, v2] = cols(r2, [1, 1.4], 0.6);
      const [l3, v3] = cols(r3, [1, 1.4], 0.6);
      return [
        ...text(head, 'SERVICE RECORD', { invert: true, bold: true, align: 'center' }),
        ...text(l1, 'Serviced'), ...date(v1, 'DD/MM/YYYY', 0, { bold: true }),
        ...text(l2, 'Next due'), ...date(v2, 'DD/MM/YYYY', 182, { bold: true }),
        ...text(l3, 'By'), hline(v3.x, v3.y + v3.h - 0.3, v3.w),
      ];
    },
  },
];

// ---------- Network and cables ----------

/** D11 and D110 cable roll: 74 mm flag that folds in half, then a 35 mm tail. */
function cableFlagD(a: string, b: string) {
  return (w: number, h: number): Part[] => {
    const flag = 74 * (w / 109);
    const half = flag / 2;
    const ins = (x: number) => inset(box(x, 0, half, h), 1.2, 1);
    const content = (cell: Box) => stack(cell, [{ t: a, bold: true, align: 'center' }, { t: b, align: 'center' }], 0.2);
    return [
      ...content(ins(0)),
      vline(half, 0, h, { dash: true, width: 0.2 }),
      ...content(ins(half)),
      vline(flag, 0, h, { dash: true, width: 0.2 }),
      ...text(inset(box(flag, 0, w - flag, h), 2, 3), 'tail', { align: 'center', italic: true, maxPt: 6 }),
    ];
  };
}

/** B21 and B1 cable roll: 38 mm flag that folds in half, then a 40 mm tail. */
function cableFlagB(a: string, b: string, flagMm = 38) {
  return (w: number, _h: number): Part[] => {
    const half = flagMm / 2;
    const content = (y: number) => stack(inset(box(0, y, w, half), 1.5, 1.5), [{ t: a, bold: true, align: 'center' }, { t: b, align: 'center' }], 0.3);
    return [...content(0), hline(0, half, w, { dash: true, width: 0.2 }), ...content(half), hline(0, flagMm, w, { dash: true, width: 0.2 })];
  };
}

const NETWORK: TemplateDesign[] = [
  {
    id: 'cable-flag-d',
    name: 'Network cable flag (12.5 mm cable roll)',
    category: 'Network and cables',
    description: 'For the D11 and D110 cable label roll. The flag folds in half, so the text shows on both sides. The tail wraps the cable.',
    sizes: [[109, 12.5]],
    build: cableFlagD('SW01 Gi1/0/24', '→ PP-A 24'),
  },
  {
    id: 'cable-flag-b',
    name: 'Network cable flag (25 mm cable roll)',
    category: 'Network and cables',
    description: 'For the B21 and B1 cable label roll. The flag folds in half and the tail wraps the cable.',
    sizes: [[25, 78]],
    build: cableFlagB('SW01-24', '→ PP-A 24'),
  },
  {
    id: 'power-flag-d',
    name: 'Power cable flag',
    category: 'Network and cables',
    description: 'Shows which power distribution unit (PDU) outlet a power supply connects to. For the 12.5 mm cable roll.',
    sizes: [[109, 12.5]],
    build: cableFlagD('PDU-A 12', '→ web01 PSU1'),
  },
  {
    id: 'cable-wrap',
    name: 'Cable wrap (repeats)',
    category: 'Network and cables',
    description: 'The text repeats along the label, so it reads from any side after you wrap it round a cable.',
    sizes: [[40, 12], [75, 12], [30, 12], [50, 15], [40, 14]],
    build: (w, h) => repeatCols(inset(box(0, 0, w, h), 0.6, 1), w >= 60 ? 4 : w >= 35 ? 3 : 2, (c) => text(c, 'PP-A 24', { bold: true, align: 'center' }), 1.5),
  },
  {
    id: 'patch-panel',
    name: 'Patch panel port strip',
    category: 'Network and cables',
    description: 'Port numbers in a row of cells. Change the numbers and the number of cells in the table settings.',
    sizes: [[75, 12], [40, 12], [50, 15], [75, 15]],
    build: (w, h) => {
      const n = w >= 70 ? 12 : 6;
      return table(inset(box(0, 0, w, h), 0.8, 1.5), [Array.from({ length: n }, (_, i) => String(i + 1))], { align: 'center', bold: true });
    },
  },
  {
    id: 'port-map',
    name: 'Switch port map',
    category: 'Network and cables',
    description: 'A table of ports and the devices that connect to them.',
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50], [50, 50]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, 4.5], 0.8);
      return [
        ...text(head, 'sw-core-01', { bold: true, align: 'center', invert: true }),
        ...table(body, [['Port', 'Device'], ['1', 'Firewall'], ['2', 'web-prod-01'], ['3', 'web-prod-02'], ['4', 'NAS']], { colRatios: [1, 3] }),
      ];
    },
  },
];

// ---------- Office ----------

const OFFICE: TemplateDesign[] = [
  {
    id: 'file-folder',
    name: 'File folder tab',
    category: 'Office',
    description: 'Folder title and year on a narrow strip.',
    sizes: [...NARROW, [50, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [t, y] = cols(a, [3.2, 1], 1);
      return [...text(t, 'Tax returns', { bold: true }), ...text(y, '2026', { align: 'right' })];
    },
  },
  {
    id: 'name-badge',
    name: 'Name badge',
    category: 'Office',
    description: 'Large name with a heading bar and a role or team line.',
    sizes: [[50, 30], [40, 30], [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const [bar, body] = rows(box(0, 0, w, h), [1, 3.2], 0);
      return [
        rect(bar, { fill: true }),
        ...text(inset(bar, pad(w, h), 0.8), 'HELLO, MY NAME IS', { bold: true, align: 'center' }).map(white),
        ...stack(inset(body, pad(w, h)), [{ t: 'Alex Morgan', bold: true, weight: 2, align: 'center' }, { t: 'Operations', align: 'center' }], 0.6),
      ];
    },
  },
  {
    id: 'return-address',
    name: 'Return address',
    category: 'Office',
    description: 'Name and postal address in three lines.',
    sizes: [[50, 20], [40, 20], [50, 30], [40, 30], [50, 15]],
    build: (w, h) => stack(area(w, h), [{ t: 'Alex Morgan', bold: true }, { t: '12 Example Street' }, { t: 'Brisbane QLD 4000' }], 0.3),
  },
  {
    id: 'address',
    name: 'Address label',
    category: 'Office',
    description: 'Recipient name and address with a "To" heading.',
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50], [100, 100]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, 4], 1);
      return [
        ...text(head, 'TO', { bold: true, maxPt: 10 }),
        ...stack(body, [{ t: 'Sam Lee', bold: true, weight: 1.3 }, { t: 'Unit 4, 88 Sample Road' }, { t: 'Melbourne VIC 3000' }, { t: 'Australia' }], 0.3),
      ];
    },
  },
  {
    id: 'shelf',
    name: 'Shelf or drawer label',
    category: 'Office',
    description: 'One large word or phrase for shelves, drawers and trays.',
    sizes: [...NARROW, ...SMALL, [50, 15]],
    build: (w, h) => text(area(w, h), 'Printer paper', { bold: true, align: 'center' }),
  },
  {
    id: 'property-of',
    name: 'If found, please return',
    category: 'Office',
    description: 'Owner name and phone number for laptops, bags, keys and equipment.',
    sizes: [...SMALL, [50, 30], [40, 30], ...NARROW],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) return stack(a, [{ t: 'IF FOUND, CALL', bold: true }, { t: '0400 000 000' }], 0.2);
      return stack(a, [{ t: 'IF FOUND, PLEASE RETURN TO', bold: true, maxPt: 7 }, { t: 'Alex Morgan', bold: true, weight: 1.5 }, { t: '0400 000 000' }], 0.4);
    },
  },
  {
    id: 'desk-number',
    name: 'Desk or locker number',
    category: 'Office',
    description: 'Large number in a black box and the name of the person.',
    sizes: [[40, 30], [50, 30], [40, 20], [50, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [n, name] = cols(a, [1, 1.6], 1.2);
      return [...text(n, '14', { invert: true, bold: true, align: 'center' }), ...stack(name, [{ t: 'DESK', maxPt: 7 }, { t: 'Alex Morgan', bold: true, weight: 1.6 }], 0.2)];
    },
  },
];

// ---------- Home and kitchen ----------

const HOME: TemplateDesign[] = [
  {
    id: 'pantry',
    name: 'Pantry jar',
    category: 'Home and kitchen',
    description: 'Item name with a best-before date.',
    sizes: [[50, 30], [40, 30], ...SMALL, [60, 40], ...NARROW],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) return text(a, 'Rolled oats', { bold: true, align: 'center' });
      const [name, bb] = rows(a, [2.2, 1], 0.8);
      const [bl, bv] = cols(bb, [1.1, 1], 0.6);
      return [...text(name, 'Rolled oats', { bold: true, align: 'center' }), ...text(bl, 'Best before', { align: 'right' }), ...date(bv, 'MMM YYYY', 180, { bold: true })];
    },
  },
  {
    id: 'spice',
    name: 'Spice jar lid',
    category: 'Home and kitchen',
    description: 'Round label with the spice name in the middle.',
    sizes: ROUND,
    round: true,
    build: (w, h) => [circle(inset(box(0, 0, w, h), w * 0.06), { stroke: 0.3 }), ...text(roundArea(w, h), 'Smoked\npaprika', { bold: true, align: 'center' })],
  },
  {
    id: 'freezer',
    name: 'Freezer meal',
    category: 'Home and kitchen',
    description: 'Meal name, date frozen, use-by date (three months later) and number of serves.',
    sizes: [[50, 30], [40, 30], [50, 25], [50, 50], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [name, d1, d2, s] = rows(a, [1.8, 1, 1, 1], 0.4);
      const pair = (b: Box, label: string, offset: number) => {
        const [l, v] = cols(b, [1, 1.5], 0.6);
        return [...text(l, label), ...date(v, 'DD/MM/YYYY', offset, { bold: true })];
      };
      return [...text(name, 'Beef lasagne', { bold: true }), ...pair(d1, 'Frozen', 0), ...pair(d2, 'Use by', 91), ...text(s, 'Serves  4')];
    },
  },
  {
    id: 'leftovers',
    name: 'Leftovers',
    category: 'Home and kitchen',
    description: 'Date made and eat-by date (three days later).',
    sizes: [...SMALL, [40, 30], [50, 30], ...NARROW],
    build: (w, h) => {
      const a = area(w, h);
      if (narrow(h)) {
        const [l, v] = cols(a, [1, 1.6], 0.8);
        return [...text(l, 'Eat by', { bold: true }), ...date(v, 'ddd D MMM', 3, { bold: true })];
      }
      const [r1, r2] = rows(a, [1, 1], 0.6);
      const [l1, v1] = cols(r1, [1, 1.6], 0.6);
      const [l2, v2] = cols(r2, [1, 1.6], 0.6);
      return [...text(l1, 'Made'), ...date(v1, 'ddd D MMM', 0), ...text(l2, 'Eat by', { bold: true }), ...date(v2, 'ddd D MMM', 3, { bold: true })];
    },
  },
  {
    id: 'storage-box',
    name: 'Storage box contents',
    category: 'Home and kitchen',
    description: 'Box title on a black bar with a list of the contents.',
    sizes: [[50, 30], [50, 50], [50, 70], [60, 40], [70, 40], [100, 100], [100, 150]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, h > w ? 5 : 3], 1);
      return [
        ...text(head, 'CHRISTMAS DECORATIONS', { invert: true, bold: true, align: 'center' }),
        ...stack(body, [{ t: '• Lights and extension lead' }, { t: '• Tree stand' }, { t: '• Baubles (fragile)' }, { t: '• Wreath' }], 0.3),
      ];
    },
  },
  {
    id: 'moving-box',
    name: 'Moving box',
    category: 'Home and kitchen',
    description: 'Destination room, box number (counts up for each label), contents and a fragile mark.',
    sizes: [[50, 30], [50, 50], [60, 40], [70, 40], [100, 100], [100, 150]],
    build: (w, h) => {
      const a = area(w, h);
      const [top, mid, bottom] = rows(a, [1.5, 2, 1], 1);
      const [room, num] = cols(top, [2.4, 1], 1);
      const [contents, frag] = cols(bottom, [3, 1.2], 1);
      return [
        ...text(room, 'KITCHEN', { invert: true, bold: true, align: 'center' }),
        ...serial(num, { start: 1, step: 1, digits: 2, prefix: '#', suffix: '' }, { bold: true, align: 'center' }),
        ...stack(mid, [{ t: 'Plates, glasses' }, { t: 'Kettle, toaster' }], 0.3),
        ...text(contents, 'Open this end', { italic: true }),
        ...icon(frag, ic('fragile'), 'end'),
      ];
    },
  },
  {
    id: 'kids-name',
    name: "Children's name label",
    category: 'Home and kitchen',
    description: 'Name with a star and a phone number, for school bags, drink bottles and clothes.',
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 4.5 : 2.6], 1);
      return [...icon(i, ic('star')), ...stack(t, narrow(h) ? [{ t: 'Charlie Morgan', bold: true }] : [{ t: 'Charlie Morgan', bold: true, weight: 1.5 }, { t: '0400 000 000' }], 0.2)];
    },
  },
  {
    id: 'plant',
    name: 'Plant marker',
    category: 'Home and kitchen',
    description: 'Plant name and the date that it was sown.',
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 5 : 3], 1);
      const [n, d] = rows(t, [1.4, 1], 0.2);
      const [dl, dv] = cols(d, [1, 1.6], 0.6);
      return [...icon(i, ic('leaf')), ...text(n, 'Cherry tomato', { bold: true }), ...text(dl, 'Sown'), ...date(dv, 'D MMM YY', 0)];
    },
  },
  {
    id: 'charger',
    name: 'Charger and cable tag',
    category: 'Home and kitchen',
    description: 'Plug symbol and the device that the charger or cable belongs to.',
    sizes: [...NARROW, [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 5 : 3], 1);
      return [...icon(i, ic('plug')), ...text(t, 'Laptop charger', { bold: true })];
    },
  },
  {
    id: 'jar-lid',
    name: 'Jar lid date',
    category: 'Home and kitchen',
    description: 'Round label with the contents and the date that the jar was filled.',
    sizes: ROUND,
    round: true,
    build: (w, h) => {
      const a = roundArea(w, h);
      const [n, d] = rows(a, [1.5, 1], 0.3);
      return [circle(inset(box(0, 0, w, h), w * 0.06), { stroke: 0.3 }), ...text(n, 'Plum jam', { bold: true, align: 'center' }), ...date(d, 'MMM YY', 0, { align: 'center' })];
    },
  },
];

// ---------- Food and hospitality ----------

const FOOD: TemplateDesign[] = [
  {
    id: 'food-rotation',
    name: 'Food prep and rotation',
    category: 'Food and hospitality',
    description: 'Item, date and time prepared, use-by date (two days later) and initials. Set the use-by period to suit your food safety plan.',
    sizes: [[50, 30], [40, 30], [50, 50], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [name, r1, r2, r3] = rows(a, [1.5, 1, 1, 1], 0.4);
      const row = (b: Box, label: string, fill: (v: Box) => Part[]) => {
        const [l, v] = cols(b, [1, 1.6], 0.6);
        return [...text(l, label), ...fill(v)];
      };
      return [
        ...text(name, 'Chicken stock', { bold: true }),
        ...row(r1, 'Prepared', (v) => date(v, 'DD/MM HH:mm', 0)),
        ...row(r2, 'Use by', (v) => date(v, 'ddd DD/MM', 2, { bold: true })),
        ...row(r3, 'By', (v) => [hline(v.x, v.y + v.h - 0.3, v.w)]),
      ];
    },
  },
  {
    id: 'allergen',
    name: 'Allergen notice',
    category: 'Food and hospitality',
    description: 'A list of common allergens to tick. Check the list against the rules where you sell food.',
    sizes: [[50, 50], [50, 70], [50, 80], [70, 40], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, h > w ? 7 : 4], 1);
      const items = ['Gluten', 'Crustacea', 'Egg', 'Fish', 'Milk', 'Peanut', 'Tree nuts', 'Sesame', 'Soy', 'Lupin', 'Sulphites', 'Mustard', 'Celery', 'Molluscs'];
      const half = Math.ceil(items.length / 2);
      const cells = Array.from({ length: half }, (_, i) => [`☐ ${items[i]}`, items[i + half] ? `☐ ${items[i + half]}` : '']);
      return [...text(head, 'CONTAINS', { invert: true, bold: true, align: 'center' }), ...table(body, cells, { line: 0 })];
    },
  },
  {
    id: 'day',
    name: 'Day of the week',
    category: 'Food and hospitality',
    description: 'Large day name for day-dot food rotation, with the date.',
    sizes: [...ROUND, [40, 20], [30, 20]],
    roundSizes: ROUND,
    build: (w, h) => {
      const isRound = Math.abs(w - h) < 0.5;
      const a = isRound ? roundArea(w, h) : area(w, h);
      const [d, n] = rows(a, [2, 1], 0.3);
      return [
        ...(isRound ? [circle(inset(box(0, 0, w, h), w * 0.05), { stroke: 0.4 })] : []),
        ...date(d, 'ddd', 0, { bold: true, align: 'center' }),
        ...date(n, 'D MMM', 0, { align: 'center' }),
      ];
    },
  },
  {
    id: 'ingredients',
    name: 'Product ingredients',
    category: 'Food and hospitality',
    description: 'Product name, ingredients, net weight, best-before date and a barcode, for home-made food sold at markets.',
    sizes: [[50, 50], [50, 70], [50, 80], [60, 40], [70, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [name, ing, info, code] = rows(a, [1.4, 2.6, 1, 1.6], 0.6);
      const [wt, bb] = cols(info, [1, 1.4], 1);
      return [
        ...text(name, 'Lemon Curd', { bold: true }),
        ...text(ing, 'Ingredients: sugar, lemon juice (30%), butter (milk), egg, lemon zest.', { minPt: 5, valign: 'top' }),
        ...text(wt, 'Net 250 g'),
        ...text(cols(bb, [1.3, 1], 0.5)[0], 'Best before', { align: 'right' }),
        ...date(cols(bb, [1.3, 1], 0.5)[1], 'DD/MM/YY', 60, { bold: true, align: 'right' }),
        ...barcode(code, '9300000000001', 'ean13'),
      ];
    },
  },
  {
    id: 'table-number',
    name: 'Table number',
    category: 'Food and hospitality',
    description: 'Large table number for restaurants, events and weddings.',
    sizes: [[50, 30], [40, 40], [50, 50], [31, 31]],
    build: (w, h) => {
      const a = area(w, h);
      const [l, n] = rows(a, [1, 3], 0.5);
      return [...text(l, 'TABLE', { align: 'center', spacing: 200 }), ...text(n, '12', { bold: true, align: 'center' })];
    },
  },
];

// ---------- Retail ----------

const RETAIL: TemplateDesign[] = [
  {
    id: 'price-tag',
    name: 'Price tag with barcode',
    category: 'Retail',
    description: 'Product name, price and an EAN-13 barcode.',
    sizes: [[40, 30], [50, 30], [40, 20], [50, 20], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      if (h <= 22) {
        const [left, right] = cols(a, [1.2, 1], 1);
        return [...stack(left, [{ t: 'Ceramic mug', bold: true }, { t: '$12.95', bold: true, weight: 1.8 }], 0.3), ...barcode(right, '9300000000001', 'ean13', true, 5)];
      }
      const [name, price, code] = rows(a, [1, 1.8, 1.6], 0.5);
      return [...text(name, 'Ceramic mug, 350 ml', { bold: true }), ...text(price, '$12.95', { bold: true }), ...barcode(code, '9300000000001', 'ean13')];
    },
  },
  {
    id: 'shelf-price',
    name: 'Shelf price strip',
    category: 'Retail',
    description: 'Product name and price on a narrow strip for shelf edges.',
    sizes: [...NARROW, [50, 15]],
    build: (w, h) => {
      const a = area(w, h);
      const [n, p] = cols(a, [2.2, 1], 1);
      return [...text(n, 'Ceramic mug'), ...text(p, '$12.95', { bold: true, align: 'right' })];
    },
  },
  {
    id: 'sale',
    name: 'Sale sticker',
    category: 'Retail',
    description: 'Round sale sticker with a discount.',
    sizes: ROUND,
    round: true,
    build: (w, h) => {
      const a = roundArea(w, h);
      const [s, d] = rows(a, [1, 1.3], 0.2);
      return [circle(box(0, 0, w, h), { fill: true }), ...text(s, 'SALE', { bold: true, align: 'center' }).map(white), ...text(d, '30% OFF', { bold: true, align: 'center' }).map(white)];
    },
  },
  {
    id: 'thank-you',
    name: 'Thank you sticker',
    category: 'Retail',
    description: 'Round or rectangular sticker for parcels and bags.',
    sizes: [...ROUND, [40, 30], [50, 30]],
    roundSizes: ROUND,
    build: (w, h) => {
      const isRound = Math.abs(w - h) < 0.5;
      const a = isRound ? roundArea(w, h) : area(w, h);
      const [i, t, s] = rows(a, [1, 1.3, 0.8], 0.3);
      return [
        ...(isRound ? [circle(inset(box(0, 0, w, h), w * 0.05), { stroke: 0.4 })] : []),
        ...icon(i, ic('heart')),
        ...text(t, 'Thank you', { bold: true, italic: true, align: 'center' }),
        ...text(s, 'yourshop.example', { align: 'center' }),
      ];
    },
  },
  {
    id: 'jewellery',
    name: 'Jewellery tag',
    category: 'Retail',
    description: 'Price and item code on the jewellery tag roll. The tail goes round the item.',
    sizes: [[30, 70], [25, 75]],
    build: (w, h) => {
      const flag = h - 45;
      const half = flag / 2;
      const content = (y: number) => stack(inset(box(0, y, w, half), 1.2, 1), [{ t: '$49.00', bold: true, align: 'center', weight: 1.4 }, { t: 'RING-0142', align: 'center' }], 0.2);
      return [...content(0), hline(0, half, w, { dash: true, width: 0.2 }), ...content(half), hline(0, flag, w, { dash: true, width: 0.2 })];
    },
  },
  {
    id: 'clothing-size',
    name: 'Clothing size',
    category: 'Retail',
    description: 'Large size letter with a label.',
    sizes: NARROW_SHORT,
    build: (w, h) => {
      const a = area(w, h);
      const [l, s] = cols(a, [1.4, 1], 1);
      return [...text(l, 'SIZE', { spacing: 100 }), ...text(s, 'M', { invert: true, bold: true, align: 'center' })];
    },
  },
  {
    id: 'sku',
    name: 'Product SKU label',
    category: 'Retail',
    description: 'Product name, variant and a Code 128 barcode of the SKU.',
    sizes: [[50, 30], [40, 30], [50, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [t, code] = rows(a, [1, 1.5], 0.6);
      const [n, v] = cols(t, [2, 1], 1);
      return [...text(n, 'Linen tote bag', { bold: true }), ...text(v, 'Natural', { align: 'right' }), ...barcode(code, 'TOTE-NAT-01')];
    },
  },
];


// ---------- Shipping and storage ----------

const SHIPPING: TemplateDesign[] = [
  {
    id: 'shipping',
    name: 'Shipping label',
    category: 'Shipping and storage',
    description: 'From and to addresses, an order number and a tracking barcode.',
    sizes: [[100, 150], [100, 100]],
    build: (w, h) => {
      const a = area(w, h);
      const [from, to, code] = rows(a, [1, 2, 1.2], 2);
      return [
        ...stack(from, [{ t: 'FROM', bold: true, maxPt: 8 }, { t: 'Your Shop' }, { t: '12 Example Street' }, { t: 'Brisbane QLD 4000' }], 0.3),
        rect(to, { stroke: 0.5, radius: 1.5 }),
        ...stack(inset(to, 3), [{ t: 'TO', bold: true, maxPt: 9 }, { t: 'Sam Lee', bold: true, weight: 1.6 }, { t: 'Unit 4, 88 Sample Road' }, { t: 'Melbourne VIC 3000' }], 0.5),
        ...barcode(code, 'ORDER-104221'),
      ];
    },
  },
  {
    id: 'bin-location',
    name: 'Bin location',
    category: 'Shipping and storage',
    description: 'Aisle, bay and level code in large type with a barcode of the same code.',
    sizes: [[50, 30], [40, 30], [60, 40], [70, 40], [50, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [code, bars] = rows(a, [1.4, 1], 0.8);
      return [...text(code, 'A-03-2', { invert: true, bold: true, align: 'center', spacing: 80 }), ...barcode(bars, 'A-03-2', 'code128', false)];
    },
  },
  {
    id: 'inventory',
    name: 'Inventory item',
    category: 'Shipping and storage',
    description: 'Item name, SKU, quantity and location, with a QR code.',
    sizes: [[50, 30], [40, 30], [60, 40], [50, 20]],
    build: (w, h) => {
      const a = area(w, h);
      return withCode(a, (sq) => qr(sq, 'SKU M4-BOLT-20'), (rest) =>
        stack(rest, h <= 22
          ? [{ t: 'M4 bolts, 20 mm', bold: true }, { t: 'SKU M4-BOLT-20' }, { t: 'Qty 200 · A-03-2' }]
          : [{ t: 'M4 bolts, 20 mm', bold: true, weight: 1.4 }, { t: 'SKU  M4-BOLT-20' }, { t: 'Qty  200' }, { t: 'Location  A-03-2' }]),
      );
    },
  },
  {
    id: 'fragile',
    name: 'Fragile, this way up',
    category: 'Shipping and storage',
    description: 'Handling marks for parcels.',
    sizes: [[50, 30], [50, 50], [60, 40], [70, 40], [100, 100]],
    build: (w, h) => {
      const a = area(w, h);
      const [icons, words] = rows(a, [1.6, 1], 1);
      const [i1, i2] = cols(icons, [1, 1], 2);
      return [...icon(i1, ic('fragile')), ...icon(i2, ic('this way up')), ...text(words, 'FRAGILE · THIS WAY UP', { bold: true, align: 'center' })];
    },
  },
  {
    id: 'box-count',
    name: 'Box number',
    category: 'Shipping and storage',
    description: 'Box number that counts up for each label, with the order reference.',
    sizes: [[40, 30], [50, 30], [50, 20], [40, 20]],
    build: (w, h) => {
      const a = area(w, h);
      const [n, o] = rows(a, [1.6, 1], 0.6);
      return [...serial(n, { start: 1, step: 1, digits: 1, prefix: 'BOX ', suffix: ' OF 6' }, { bold: true, align: 'center' }), ...text(o, 'Order 104221', { align: 'center' })];
    },
  },
];

// ---------- Electrical and workshop ----------

const WORKSHOP: TemplateDesign[] = [
  {
    id: 'breaker',
    name: 'Circuit breaker',
    category: 'Electrical and workshop',
    description: 'Circuit number and what it supplies, on a narrow strip for the switchboard.',
    sizes: [...NARROW, [50, 15]],
    build: (w, h) => {
      const a = area(w, h);
      const [n, t] = cols(a, [1, 3], 1);
      return [...text(n, 'C12', { invert: true, bold: true, align: 'center' }), ...text(t, 'Kitchen power', { bold: true })];
    },
  },
  {
    id: 'switchboard',
    name: 'Switchboard schedule',
    category: 'Electrical and workshop',
    description: 'A table of circuits and what each one supplies.',
    sizes: [[50, 70], [50, 80], [60, 40], [70, 40], [80, 50], [100, 100]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, body] = rows(a, [1, h > w ? 8 : 4.5], 1);
      const list = ['Lights, front', 'Lights, rear', 'Kitchen power', 'Oven', 'Hot water', 'Air conditioner', 'Laundry', 'Garage'];
      const n = h > w ? 8 : 6;
      return [
        ...text(head, 'CIRCUITS', { invert: true, bold: true, align: 'center' }),
        ...table(body, list.slice(0, n).map((d, i) => [`C${i + 1}`, d]), { colRatios: [1, 4] }),
      ];
    },
  },
  {
    id: 'tool',
    name: 'Tool owner',
    category: 'Electrical and workshop',
    description: 'Owner name and phone number for tools and equipment.',
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 5 : 3], 1);
      return [...icon(i, ic('tools')), ...stack(t, [{ t: 'A. MORGAN', bold: true }, ...(narrow(h) && w < 40 ? [] : [{ t: '0400 000 000' }])], 0.2)];
    },
  },
  {
    id: 'inspection',
    name: 'Inspection tag',
    category: 'Electrical and workshop',
    description: 'Inspection date, next due date (one year later), result and initials.',
    sizes: [[50, 30], [40, 30], [50, 50], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, r1, r2, r3] = rows(a, [1.2, 1, 1, 1], 0.5);
      const pair = (b: Box, label: string, v: (x: Box) => Part[]) => {
        const [l, x] = cols(b, [1, 1.5], 0.6);
        return [...text(l, label), ...v(x)];
      };
      return [
        ...text(head, 'INSPECTED', { invert: true, bold: true, align: 'center', spacing: 80 }),
        ...pair(r1, 'Date', (x) => date(x, 'DD/MM/YYYY', 0, { bold: true })),
        ...pair(r2, 'Next due', (x) => date(x, 'DD/MM/YYYY', 365, { bold: true })),
        ...pair(r3, 'By', (x) => [hline(x.x, x.y + x.h - 0.3, x.w)]),
      ];
    },
  },
  {
    id: 'hazard',
    name: 'Warning sign',
    category: 'Electrical and workshop',
    description: 'Warning symbol with a short hazard statement.',
    sizes: [[50, 30], [40, 30], ...SMALL, [50, 50], ...NARROW],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 2.5 ? 4 : 2], 1);
      return [...icon(i, ic('high voltage')), ...stack(t, narrow(h) ? [{ t: 'HIGH VOLTAGE', bold: true }] : [{ t: 'DANGER', bold: true, weight: 1.4 }, { t: 'High voltage' }], 0.3)];
    },
  },
];

// ---------- Lab and health ----------

const LAB: TemplateDesign[] = [
  {
    id: 'sample-tube',
    name: 'Sample tube',
    category: 'Lab and health',
    description: 'Sample number (counts up for each label), date and initials for tubes and vials.',
    sizes: [[25, 9.5], [36.5, 9.5], ...NARROW_SHORT],
    build: (w, h) => {
      const a = inset(box(0, 0, w, h), 0.8, 0.6);
      const [id, rest] = cols(a, [1.4, 1], 0.6);
      const [who, when] = rows(rest, [1, 1], 0);
      return [...serial(id, { start: 1, step: 1, digits: 3, prefix: 'S-', suffix: '' }, { bold: true }), ...text(who, 'AM', { align: 'right' }), ...date(when, 'DD/MM/YY', 0, { align: 'right' })];
    },
  },
  {
    id: 'specimen',
    name: 'Specimen with barcode',
    category: 'Lab and health',
    description: 'Specimen ID as a barcode, with a description and the collection date.',
    sizes: [[50, 20], [40, 20], [50, 30], [40, 30]],
    build: (w, h) => {
      const a = area(w, h);
      const [t, code] = rows(a, [1, 1.6], 0.6);
      const [n, d] = cols(t, [1.6, 1], 1);
      return [...text(n, 'Soil sample, plot 4', { bold: true }), ...date(d, 'DD/MM/YY', 0, { align: 'right' }), ...barcode(code, 'SP-26-0412')];
    },
  },
  {
    id: 'medication',
    name: 'Medication schedule',
    category: 'Lab and health',
    description: 'Medicine name and a table of doses for each time of day. Follow the instructions from your pharmacist.',
    sizes: [[50, 30], [60, 40], [70, 40], [50, 50]],
    build: (w, h) => {
      const a = area(w, h);
      const [n, t] = rows(a, [1, 2], 0.8);
      return [...text(n, 'Medicine name 10 mg', { bold: true }), ...table(t, [['Morning', 'Noon', 'Evening', 'Night'], ['1', '', '1', '']], { align: 'center' })];
    },
  },
  {
    id: 'first-aid',
    name: 'First aid kit',
    category: 'Lab and health',
    description: 'First aid heading, location and the date that the kit was checked.',
    sizes: [[50, 30], [50, 50], [40, 30], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [head, loc, chk] = rows(a, [1.4, 1, 1], 0.6);
      const [l, v] = cols(chk, [1, 1.5], 0.6);
      return [...text(head, '+ FIRST AID', { invert: true, bold: true, align: 'center' }), ...text(loc, 'Kitchen, top cupboard', { align: 'center' }), ...text(l, 'Checked'), ...date(v, 'DD/MM/YYYY', 0, { bold: true })];
    },
  },
];

// ---------- School and events ----------

const SCHOOL: TemplateDesign[] = [
  {
    id: 'book-plate',
    name: 'This book belongs to',
    category: 'School and events',
    description: 'Book symbol with a line for the owner name.',
    sizes: [[50, 30], [50, 50], [40, 30], [60, 40]],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = w / h > 1.3 ? cols(a, [1, 2.2], 1.5) : rows(a, [1.4, 1.6], 1);
      const [l, n] = rows(t, [1, 1.2], 0.6);
      return [...icon(i, ic('book')), ...text(l, 'This book belongs to', { italic: true, align: 'center' }), ...text(n, 'Charlie Morgan', { bold: true, align: 'center' })];
    },
  },
  {
    id: 'pencil',
    name: 'Pencil and pen name',
    category: 'School and events',
    description: 'A name that repeats along a thin strip, to wrap round pencils and pens.',
    sizes: [[40, 12], [30, 12], [75, 12]],
    build: (w, h) => repeatCols(inset(box(0, 0, w, h), 0.6, 2), w >= 60 ? 3 : 2, (c) => text(c, 'Charlie', { bold: true, align: 'center' }), 2),
  },
  {
    id: 'lunchbox',
    name: 'Lunchbox and bottle',
    category: 'School and events',
    description: 'Name and class for lunchboxes and drink bottles.',
    sizes: [...NARROW, ...SMALL],
    build: (w, h) => {
      const a = area(w, h);
      const [i, t] = cols(a, [1, w / h > 3 ? 5 : 3], 1);
      return [...icon(i, ic('food')), ...stack(t, [{ t: 'Charlie Morgan', bold: true, weight: 1.3 }, { t: 'Class 3B' }], 0.2)];
    },
  },
  {
    id: 'event-badge',
    name: 'Event badge',
    category: 'School and events',
    description: 'Event name, attendee name and organisation, with a QR code for contact details.',
    sizes: [[50, 30], [60, 40], [70, 40], [80, 50]],
    build: (w, h) => {
      const [bar, body] = rows(box(0, 0, w, h), [1, 3.4], 0);
      const p = pad(w, h);
      return [
        rect(bar, { fill: true }),
        ...text(inset(bar, p, 0.8), 'TECH MEETUP 2026', { bold: true, align: 'center', spacing: 60 }).map(white),
        ...withCode(inset(body, p), (sq) => qr(sq, 'BEGIN:VCARD\nVERSION:3.0\nFN:Alex Morgan\nORG:Example Pty Ltd\nEND:VCARD'), (rest) =>
          stack(rest, [{ t: 'Alex Morgan', bold: true, weight: 1.6 }, { t: 'Example Pty Ltd' }], 0.4),
        ),
      ];
    },
  },
];

export const DESIGNS: TemplateDesign[] = [...IT, ...NETWORK, ...OFFICE, ...HOME, ...FOOD, ...RETAIL, ...SHIPPING, ...WORKSHOP, ...LAB, ...SCHOOL, ...CREATIVE];

/** True when this design is a round label at this size. */
export function isRoundSize(d: TemplateDesign, w: number, h: number): boolean {
  return Boolean(d.round || d.roundSizes?.some(([a, b]) => Math.abs(a - w) < 0.1 && Math.abs(b - h) < 0.1));
}

export interface TemplateEntry {
  key: string;
  design: TemplateDesign;
  widthMm: number;
  heightMm: number;
}

/** One entry for each design and size. */
export const TEMPLATE_ENTRIES: TemplateEntry[] = DESIGNS.flatMap((design) =>
  design.sizes.map(([w, h]) => ({ key: `${design.id}-${w}x${h}`, design, widthMm: w, heightMm: h })),
);


// Decorative templates for small producers, shops, the home and hobbies.
// They use the fonts that ship with the app and the vector ornaments.

import { MEDIUM, NARROW, NARROW_SHORT, ROUND, SMALL, TALL, type Size, type TemplateDesign } from './kit';
import { design as d } from './compose';
import { F } from './presets';

const B = 'Small business';
const PRODUCT: Size[] = [[50, 30], [40, 30], [60, 40], [70, 40], [50, 50]];
const PRODUCT_TALL: Size[] = [...PRODUCT, ...TALL];
const ROUND_L: Size[] = [[31, 31], [34, 34], [50, 50]];
const JAR: Size[] = [...MEDIUM, ...SMALL, ...NARROW];
const caps = (t: string, spacing = 120) => ({ t, font: F.sans, bold: true, spacing, weight: 0.65 });

// ---------- food and drink producers ----------

const PRODUCE: TemplateDesign[] = [
  d('honey', 'Honey jar', B, 'Honeycomb band, the variety in a heavy serif and the weight. Round sizes fit a lid.', [...PRODUCT_TALL, ...ROUND], {
    base: { rows: [{ band: 'comb', weight: 1, span: 0.9 }, { t: 'Wildflower', font: F.fat, weight: 1.5 }, caps('RAW HONEY · 500 G', 160), { t: 'from the hives at Example Farm', font: F.serif, italic: true, weight: 0.7 }] },
    round: { shape: 'sealOutline', rows: [{ t: 'raw', font: F.script, bold: true, weight: 0.8 }, { t: 'HONEY', font: F.fat, weight: 1.3 }, caps('500 G') ] },
  }),
  d('tea-blend', 'Tea blend', B, 'Blend number, the name in italic serif, a leaf sprig and the brewing instructions.', PRODUCT_TALL, {
    base: { frame: 'double', rows: [{ t: 'No. 12', font: F.classic, spacing: 100, weight: 0.7 }, { t: 'Earl Grey', font: F.serif, italic: true, bold: true, weight: 1.5 }, { band: 'sprig', span: 0.5 }, caps('LOOSE LEAF · 50 G'), { t: '3 minutes at 95 °C', font: F.serif, italic: true, weight: 0.7 }] },
  }),
  d('hot-sauce', 'Hot sauce', B, 'Zigzag bands, a heavy name, the chilli and a heat scale.', PRODUCT_TALL, {
    base: { bands: 'zigzag', rows: [{ t: 'FIRE BIRD', font: F.heavy, weight: 1.5 }, { t: 'habanero hot sauce', font: F.marker, weight: 0.9 }, caps('HEAT  ● ● ● ● ○   150 ML', 60)] },
  }),
  d('olive-oil', 'Olive oil', B, 'Deco frame with classical capitals, an italic name and the volume.', PRODUCT_TALL, {
    base: { frame: 'deco', rows: [{ t: 'EXTRA VIRGIN', font: F.classic, bold: true, spacing: 160, weight: 0.8 }, { t: 'Olive Oil', font: F.serif, italic: true, bold: true, weight: 1.6 }, { band: 'sprig', span: 0.5 }, caps('COLD PRESSED · 500 ML', 60)] },
  }),
  d('granola', 'Granola and cereal', B, 'Slab serif name over a double rule, with the ingredients and a best-before date.', PRODUCT_TALL, {
    base: { rows: [{ t: 'Honey Nut Granola', font: F.slab, bold: true, weight: 1.4 }, { band: 'double', span: 0.9 }, { t: 'oats, honey, almonds, seeds', font: F.serif, italic: true, weight: 0.8 }, { cols: [{ t: 'BEST BEFORE', font: F.sans, bold: true, spacing: 60 }, { date: 'DD/MM/YYYY', offset: 90, font: F.sans, bold: true }], weight: 0.7 }] },
  }),
  d('fresh-baked', 'Freshly baked seal', B, 'Round seal with script and heavy capitals, for bakery boxes and bags.', ROUND, {
    base: { shape: 'seal', rows: [{ t: 'freshly', font: F.script, bold: true }, { t: 'BAKED', font: F.heavy, weight: 1.3 }, caps('TODAY', 200)] },
  }, { round: true }),
  d('chocolate-bar', 'Chocolate bar', B, 'Cocoa percentage in a black block, with the flavour in italic serif.', [[50, 30], [60, 40], [70, 40], [80, 50], [50, 20]], {
    base: { frame: 'line', side: { block: '70%', width: 0.32, font: F.fat }, rows: [{ t: 'DARK CHOCOLATE', font: F.bebas, spacing: 100, align: 'center' }, { t: 'sea salt & almond', font: F.serif, italic: true, align: 'center' }, { ...caps('80 G · BEAN TO BAR'), align: 'center' }] },
    small: { side: { block: '70%', width: 0.3, font: F.fat }, rows: [{ t: 'DARK CHOCOLATE', font: F.bebas, spacing: 100 }, { t: 'sea salt & almond', font: F.serif, italic: true }], gap: 0.2 },
  }),
  d('pickles', 'Pickles and preserves', B, 'Marker name in a dotted frame, with the batch month.', [...PRODUCT, ...ROUND], {
    base: { frame: 'dots', rows: [{ t: 'Dill Pickles', font: F.marker, weight: 1.5 }, { t: 'crunchy · small batch', font: F.hand, bold: true }, { date: 'MMM YYYY', font: F.sans, bold: true, spacing: 120, weight: 0.65 }] },
    round: { frame: 'line', rows: [{ t: 'Dill', font: F.marker }, { t: 'Pickles', font: F.marker }, { date: 'MMM YYYY', font: F.sans, bold: true, spacing: 80, weight: 0.6 }] },
  }),
  d('kombucha', 'Kombucha and soda', B, 'Retro script flavour, spaced capitals and the date brewed.', PRODUCT_TALL, {
    base: { rows: [{ t: 'Ginger Lemon', font: F.retro, weight: 1.5 }, { t: 'KOMBUCHA', font: F.bebas, spacing: 300 }, { band: 'wave', span: 0.6 }, { cols: [caps('BREWED', 80), { date: 'DD/MM/YY', font: F.sans, bold: true }, caps('330 ML', 80)], weight: 0.7 }] },
  }),
  d('cold-brew', 'Cold brew coffee', B, 'Heavy capitals in a black block, the dilution and a use-by date.', PRODUCT_TALL, {
    base: { rows: [{ t: 'COLD BREW', font: F.heavy, invert: true, weight: 1.4 }, { t: 'concentrate · dilute 1 to 2', font: F.serif, italic: true }, { cols: [caps('USE BY', 80), { date: 'DD/MM/YY', offset: 14, font: F.sans, bold: true }, caps('500 ML', 80)], weight: 0.8 }] },
  }),
  d('pressed-juice', 'Pressed juice', B, 'Rounded name, the ingredients and the date pressed.', PRODUCT_TALL, {
    base: { side: { pic: 'drop' }, rows: [{ t: 'Green Juice', font: F.round, bold: true, weight: 1.5 }, { t: 'apple · kale · ginger · lime', font: F.sans }, { kv: ['Pressed', { date: 'ddd D MMM' }], font: F.sans }] },
    tall: { rows: [{ pic: 'drop', weight: 1.6 }, { t: 'Green Juice', font: F.round, bold: true, weight: 1.4 }, { t: 'apple · kale', font: F.sans }, { t: 'ginger · lime', font: F.sans }, { date: 'ddd D MMM', font: F.sans, bold: true }] },
  }),
  d('bread-band', 'Bread band', B, 'A long strip to wrap round a loaf, with the name and the day baked.', [[75, 12], [50, 15], [50, 20], [109, 12.5]], {
    base: { rows: [{ cols: [{ t: 'Country Sourdough', font: F.serif, bold: true }, { date: 'ddd D MMM', font: F.hand, bold: true }], ratios: [2, 1] }] },
  }),
  d('farm-eggs', 'Farm eggs', B, 'Slab serif heading with the count and the date laid.', PRODUCT, {
    base: { frame: 'corners', side: { icon: 'egg' }, rows: [{ t: 'Farm Fresh Eggs', font: F.slab, bold: true, weight: 1.4 }, caps('FREE RANGE · DOZEN', 60), { kv: ['Laid', { date: 'D MMM' }], font: F.sans }] },
  }),
  d('dried-herbs', 'Dried herbs', B, 'Handwritten herb name with a sprig, for jars and paper bags.', [...JAR, ...ROUND], {
    base: { rows: [{ band: 'sprig', span: 0.5 }, { t: 'Rosemary', font: F.hand, bold: true, weight: 1.8 }, caps('HOME GROWN · DRIED 2026', 80)] },
    small: { rows: [{ t: 'Rosemary', font: F.hand, bold: true, weight: 1.6 }, caps('HOME GROWN · 2026', 80)], gap: 0.2 },
    narrow: { side: { icon: 'leaf', width: 0.2 }, rows: [{ t: 'Rosemary', font: F.hand, bold: true }] },
    round: { frame: 'line', rows: [{ band: 'sprig', span: 0.8 }, { t: 'Rosemary', font: F.hand, bold: true, weight: 1.6 }, { space: true }] },
  }),
  d('flower-bunch', 'Flower bunch', B, 'Flower with a script line and the price, for market bunches.', PRODUCT_TALL, {
    base: { side: { pic: 'flower' }, rows: [{ t: 'Fresh from the garden', font: F.script, bold: true, weight: 1.3, align: 'center' }, { t: '$15 a bunch', font: F.round, bold: true, align: 'center' }] },
    tall: { rows: [{ pic: 'flower', weight: 2 }, { t: 'Fresh from\nthe garden', font: F.script, bold: true, weight: 2 }, { t: '$15 a bunch', font: F.round, bold: true }] },
  }),
  d('nut-butter', 'Nut butter', B, 'Script and heavy capitals with the ingredients and the weight.', PRODUCT_TALL, {
    base: { frame: 'bold', rows: [{ t: 'crunchy', font: F.script, bold: true }, { t: 'PEANUT BUTTER', font: F.heavy, weight: 1.3 }, caps('100% PEANUTS · 350 G', 60)] },
  }),
  d('gin', 'Spirits and liqueurs', B, 'Deco frame, a heavy serif name, the strength and a batch number that counts up.', PRODUCT_TALL, {
    base: { frame: 'deco', rows: [{ t: 'SMALL BATCH', font: F.classic, spacing: 200, weight: 0.7 }, { t: 'Coastal Gin', font: F.fat, weight: 1.6 }, { band: 'diamond', span: 0.6 }, caps('42% ABV · 500 ML', 100), { serial: { prefix: 'BATCH ', digits: 3 }, font: F.mono, weight: 0.7 }] },
  }),
  d('spice-rub', 'Spice rub', B, 'Slab serif name between double rules, with what to use it on.', [...PRODUCT, ...ROUND], {
    base: { rows: [{ band: 'double', span: 0.9 }, { t: 'Smoky BBQ Rub', font: F.slab, bold: true, weight: 1.6 }, { t: 'for beef, pork and corn', font: F.serif, italic: true }, caps('120 G')] },
    round: { frame: 'bold', rows: [{ t: 'Smoky', font: F.slab, bold: true }, { t: 'BBQ Rub', font: F.slab, bold: true }, caps('120 G')] },
  }),
  d('ice-cream', 'Ice cream flavour', B, 'Awning band with a retro script flavour and the price.', PRODUCT, {
    base: { rows: [{ band: 'scallops', span: 1, weight: 0.5 }, { t: 'Salted Caramel', font: F.retro, weight: 1.6 }, { t: '$5 A SCOOP', font: F.bebas, spacing: 140 }] },
  }),
  d('cocktail-batch', 'Batched cocktail', B, 'Heavy serif name, how to serve it and the date batched.', PRODUCT_TALL, {
    base: { frame: 'line', rows: [{ t: 'Negroni', font: F.fat, weight: 1.6 }, { t: 'stir over ice · 90 mL', font: F.serif, italic: true }, { cols: [caps('BATCHED', 80), { date: 'DD/MM/YY', font: F.mono, bold: true }], weight: 0.8 }] },
  }),
  d('cup-name', 'Coffee cup name', B, 'Customer name in marker, with the order under it.', [...SMALL, [40, 30], [50, 30]], {
    base: { rows: [{ t: 'Alex', font: F.marker, weight: 1.8 }, { t: 'flat white · oat', font: F.hand, bold: true }], gap: 0.1 },
  }),
  d('special-today', "Today's special", 'Food and hospitality', 'Script heading, the dish in a heavy serif and the price.', [[50, 30], [60, 40], [70, 40], [80, 50], [50, 50]], {
    base: { frame: 'double', rows: [{ t: "today's special", font: F.script, bold: true }, { t: 'Pumpkin Soup', font: F.fat, weight: 1.6 }, { t: '$14 with sourdough', font: F.serif, italic: true }] },
  }),
  d('table-number-ring', 'Café table number', 'Food and hospitality', 'A large number in a double ring.', [...ROUND, [40, 40]], {
    base: { shape: 'ring', rows: [{ t: '12', font: F.fat }] },
  }, { round: true }),
  d('qr-menu', 'QR menu', 'Food and hospitality', 'A QR code that opens the menu, with a heading and a short instruction.', [[50, 50], [50, 70], [50, 80], [60, 40], [50, 30]], {
    base: { frame: 'double', side: { code: 'qr', value: 'https://example.com/menu' }, rows: [{ t: 'MENU', font: F.bebas, spacing: 300, weight: 1.4 }, { t: 'scan to order', font: F.script, bold: true }, { t: 'Table 12', font: F.sans, bold: true, weight: 0.8 }] },
    tall: { frame: 'double', rows: [{ t: 'MENU', font: F.bebas, spacing: 300 }, { code: 'qr', value: 'https://example.com/menu', weight: 3.4 }, { t: 'scan to order', font: F.script, bold: true }] },
  }),
];

// ---------- body care and candles ----------

const CARE: TemplateDesign[] = [
  d('lip-balm', 'Lip balm', B, 'Round label for a tin or a tube cap, with the flavour in script.', ROUND, {
    base: { shape: 'ring', rows: [caps('LIP BALM', 160), { t: 'Peppermint', font: F.script, bold: true, weight: 1.5 }, caps('15 G')] },
  }, { round: true }),
  d('bath-bomb', 'Bath bomb', B, 'Scalloped outline with the scent in script.', [...ROUND_L, [50, 30], [40, 30]], {
    base: { frame: 'dots', rows: [{ t: 'Lavender', font: F.script, bold: true, weight: 1.6 }, caps('BATH BOMB · 180 G', 140), { t: 'drop into warm water', font: F.serif, italic: true, weight: 0.7 }] },
    round: { shape: 'sealOutline', rows: [{ t: 'Lavender', font: F.script, bold: true, weight: 1.3 }, caps('BATH BOMB')] },
  }),
  d('body-butter', 'Body butter', B, 'Minimal label with spaced capitals, the scent in italic serif and the volume.', PRODUCT_TALL, {
    base: { frame: 'line', rows: [caps('BODY BUTTER', 300), { t: 'Shea & Vanilla', font: F.serif, italic: true, weight: 1.5 }, { band: 'rule', span: 0.3 }, caps('120 ML · MADE BY HAND', 100)] },
  }),
  d('beard-oil', 'Beard oil', B, 'Shield outline with tall capitals and the scent.', [[50, 50], [40, 40], [50, 70], [40, 70]], {
    base: { shape: 'shieldOutline', rows: [{ t: 'BEARD OIL', font: F.bebas, spacing: 100, weight: 1.2 }, { t: 'cedar & sage', font: F.serif, italic: true }, caps('30 ML')] },
  }),
  d('essential-oil', 'Essential oil', B, 'A thin strip for a small bottle: the plant in italic serif and the volume.', NARROW, {
    base: { rows: [{ t: 'Lavender', font: F.serif, italic: true, bold: true, weight: 1.4 }, caps('PURE ESSENTIAL OIL · 10 ML', 60)], gap: 0.1 },
    short: { rows: [{ t: 'Lavender', font: F.serif, italic: true, bold: true }] },
  }),
  d('candle-safety', 'Candle safety label', B, 'Round label for the base of a candle with three safety lines.', [[50, 50]], {
    base: { shape: 'ring', rows: [{ icon: 'flammable', weight: 1.4 }, { t: 'Trim the wick to 5 mm', font: F.sans, bold: true }, { t: 'Stay with a lit candle', font: F.sans, bold: true }, { t: 'Keep from children', font: F.sans, bold: true }] },
  }, { round: true }),
  d('wax-melts', 'Wax melts', B, 'Script heading, the scent and how many cubes to use.', PRODUCT, {
    base: { frame: 'dots', rows: [{ t: 'Wax Melts', font: F.script, bold: true, weight: 1.4 }, { t: 'Vanilla Bean', font: F.serif, bold: true }, caps('USE 1 OR 2 CUBES · 80 G', 80)] },
  }),
  d('reed-diffuser', 'Room scent', B, 'Oval outline with the scent in formal script.', [[50, 30], [60, 40], [70, 40], [40, 30]], {
    base: { shape: 'oval', rows: [caps('ROOM SCENT', 200), { t: 'Sea Salt', font: F.formal, weight: 1.8 }, caps('100 ML')] },
  }),
];

// ---------- badges, seals and offers ----------

const BADGES: TemplateDesign[] = [
  d('vegan-seal', 'Vegan seal', B, 'Round scalloped outline with the vegan symbol.', ROUND, {
    base: { shape: 'sealOutline', rows: [{ icon: 'vegan', weight: 1.4 }, { t: 'VEGAN', font: F.sans, bold: true, spacing: 160 }] },
  }, { round: true }),
  d('organic-wreath', 'Organic wreath', B, 'Leaf wreath round classical capitals.', [[50, 50], [40, 40], [34, 34], [31, 31]], {
    base: { shape: 'laurel', rows: [{ t: '100%', font: F.fat, weight: 1.3 }, { t: 'ORGANIC', font: F.classic, bold: true, spacing: 100 }] },
  }),
  d('handmade-in', 'Handmade in', B, 'Stamp frame with the place in retro script.', PRODUCT, {
    base: { frame: 'stamp', rows: [caps('HANDMADE IN', 240), { t: 'Brisbane', font: F.retro, weight: 1.8 }, caps('AUSTRALIA', 300)] },
  }),
  d('small-batch', 'Small batch number', B, 'Double ring with tall capitals and a batch number that counts up.', ROUND, {
    base: { shape: 'ring', rows: [{ t: 'SMALL', font: F.bebas, spacing: 160 }, { t: 'BATCH', font: F.bebas, spacing: 160 }, { serial: { prefix: 'No. ', digits: 3 }, font: F.mono, weight: 0.7 }] },
  }, { round: true }),
  d('limited-edition', 'Limited edition number', B, 'Deco frame with the edition number, which counts up, and a line for a signature.', PRODUCT, {
    base: { frame: 'deco', rows: [{ t: 'LIMITED EDITION', font: F.classic, bold: true, spacing: 140, weight: 0.8 }, { serial: { digits: 3, suffix: ' / 100' }, font: F.serif, bold: true, weight: 1.5 }, { kv: ['Signed', ''], font: F.serif, italic: true }] },
  }),
  d('made-for', 'Made to order', B, 'A script line and a line to write the name of the customer.', PRODUCT, {
    base: { frame: 'corners', rows: [{ t: 'made to order for', font: F.script, bold: true }, { kv: ['', ''], weight: 1.3 }, caps('THANK YOU', 200)] },
  }),
  d('price-dot', 'Price dot', 'Retail', 'Round price sticker in a heavy serif.', ROUND, {
    base: { frame: 'bold', rows: [{ t: '$12', font: F.fat }] },
  }, { round: true }),
  d('best-seller', 'Best seller', 'Retail', 'Star burst with two heavy words.', [...ROUND, [50, 30], [40, 30], [50, 50]], {
    base: { shape: 'burst', rows: [{ t: 'BEST', font: F.heavy }, { t: 'SELLER', font: F.heavy }] },
    round: { shape: 'seal', rows: [{ t: 'BEST', font: F.heavy }, { t: 'SELLER', font: F.heavy }] },
  }),
  d('percent-off', 'Percent off', 'Retail', 'Star burst with the discount in a heavy serif.', [...ROUND, [50, 30], [40, 30], [50, 50]], {
    base: { shape: 'burst', rows: [{ t: '30%', font: F.fat, weight: 1.8 }, { t: 'OFF', font: F.bebas, spacing: 300 }] },
    round: { shape: 'seal', rows: [{ t: '30%', font: F.fat, weight: 1.8 }, { t: 'OFF', font: F.bebas, spacing: 300 }] },
  }),
  d('bogo', 'Buy one, get one', 'Retail', 'White capitals on black.', [...MEDIUM, ...SMALL], {
    base: { shape: 'block', rows: [{ t: 'BUY 1 GET 1', font: F.heavy, weight: 1.4 }, { t: 'FREE', font: F.bebas, spacing: 500 }] },
  }),
  d('coupon', 'Discount coupon', 'Retail', 'Dashed frame with the offer and a code in monospace.', [[50, 30], [60, 40], [70, 40], [40, 30]], {
    base: { frame: 'dash', rows: [{ t: '10% OFF', font: F.fat, weight: 1.6 }, { t: 'your next order', font: F.script, bold: true }, { t: 'CODE: THANKS10', font: F.mono, bold: true, weight: 0.8 }] },
  }),
  d('support-local', 'Support local', B, 'Leaf wreath round a retro script.', [[50, 50], [40, 40], [34, 34], [31, 31]], {
    base: { shape: 'laurel', rows: [caps('SUPPORT', 200), { t: 'local', font: F.retro, weight: 1.8 }] },
  }),
  d('eco-packaging', 'Compostable packaging', B, 'Recycle symbol with a short note about the packaging.', [...ROUND_L, [50, 30], [40, 30]], {
    base: { side: { icon: 'recycle' }, rows: [{ t: 'This packaging', font: F.round, bold: true }, { t: 'is compostable', font: F.round, bold: true }] },
    round: { shape: 'sealOutline', rows: [{ icon: 'recycle', weight: 1.5 }, caps('COMPOSTABLE', 60)] },
  }),
  d('open-first', 'Open this box first', B, 'Chevron bands with tall capitals, for orders in more than one box.', [...MEDIUM, ...SMALL, [75, 12], [50, 15]], {
    base: { rows: [{ band: 'chevrons', span: 0.9 }, { t: 'OPEN ME FIRST', font: F.bebas, spacing: 160, weight: 2 }, { band: 'chevrons', span: 0.9 }] },
    narrow: { rows: [{ t: 'OPEN ME FIRST', font: F.bebas, spacing: 160 }] },
  }),
  d('fragile-love', 'Fragile, with love', B, 'Formal script with a small capital line.', [...MEDIUM, ...SMALL], {
    base: { frame: 'double', rows: [{ t: 'Fragile', font: F.formal, weight: 2 }, caps('PLEASE HANDLE WITH LOVE', 140)] },
    small: { rows: [{ t: 'Fragile', font: F.formal, weight: 2 }, caps('PLEASE HANDLE WITH LOVE', 100)], gap: 0.1 },
  }),
  d('shipped-from', 'Shipped with care', B, 'Stamp frame with the shop name in retro script and a web address.', PRODUCT, {
    base: { frame: 'stamp', rows: [caps('PACKED AND SHIPPED BY', 100), { t: 'Bramble & Co.', font: F.retro, weight: 1.8 }, { t: 'bramble.example', font: F.mono, weight: 0.7 }] },
  }),
  d('loyalty-card', 'Loyalty card', B, 'A script heading and ten boxes to stamp or tick.', [[70, 40], [60, 40], [80, 50], [50, 30]], {
    base: { frame: 'line', align: 'left', rows: [{ t: 'Coffee card', font: F.retro, align: 'center', weight: 1.4 }, { ticks: ['', '', '', '', ''] }, { ticks: ['', '', '', '', ''] }, { ...caps('BUY 9 · THE 10TH IS FREE', 80), align: 'center' }] },
  }),
  d('payment-qr', 'Pay here QR code', B, 'A QR code for a payment link, with tall capitals.', [[50, 50], [50, 70], [50, 80], [60, 40], [50, 30]], {
    base: { side: { code: 'qr', value: 'https://pay.example.com/bramble' }, rows: [{ t: 'PAY HERE', font: F.bebas, spacing: 160, weight: 1.5 }, { t: 'scan with your phone', font: F.hand, bold: true }] },
    tall: { rows: [{ t: 'PAY HERE', font: F.bebas, spacing: 160 }, { code: 'qr', value: 'https://pay.example.com/bramble', weight: 3.4 }, { t: 'scan with your phone', font: F.hand, bold: true }] },
  }),
  d('garment-care', 'Garment care', 'Retail', 'Five care symbols with the fibre and the place of manufacture.', [[50, 30], [60, 40], [40, 30], [50, 20], [40, 20]], {
    base: { rows: [{ cols: [{ icon: 'machine wash' }, { icon: 'do not bleach' }, { icon: 'do not tumble dry' }, { icon: 'iron' }, { icon: 'line dry' }], weight: 1.6, gap: 1.5 }, { t: '100% cotton · cold wash', font: F.sans, bold: true, weight: 0.8 }, { t: 'Made in Australia', font: F.sans, weight: 0.7 }] },
    small: { rows: [{ cols: [{ icon: 'machine wash' }, { icon: 'do not bleach' }, { icon: 'do not tumble dry' }, { icon: 'iron' }, { icon: 'line dry' }], weight: 1.6, gap: 1.5 }, { t: '100% cotton · cold wash', font: F.sans, bold: true, weight: 0.8 }], gap: 0.3 },
  }),
  d('size-dot', 'Size dot', 'Retail', 'Round black sticker with the size in white.', [[20, 20], [21, 21], [31, 31]], {
    base: { shape: 'disc', rows: [{ t: 'M', font: F.sans, bold: true }] },
  }, { round: true }),
  d('earring-card', 'Earring card', 'Retail', 'Tall card with the maker name at the top and the material at the bottom. Leave the middle free for the earrings.', [[40, 70], [50, 70], [40, 80], [50, 80]], {
    base: { frame: 'line', rows: [{ t: 'Bramble & Co.', font: F.script, bold: true, weight: 1.2 }, { band: 'diamond', span: 0.6 }, { space: true, weight: 4.5 }, caps('STERLING SILVER', 140), { t: 'handmade', font: F.serif, italic: true, weight: 0.6 }] },
  }),
  d('pet-treats', 'Pet treats', B, 'Bone with a rounded name, the weight and the date baked.', PRODUCT_TALL, {
    base: { frame: 'dots', rows: [{ pic: 'bone', weight: 0.8 }, { t: 'Peanut Butter Bites', font: F.round, bold: true, weight: 1.3 }, caps('DOG TREATS · 200 G'), { kv: ['Baked', { date: 'D MMM YYYY' }], font: F.sans, weight: 0.8 }] },
  }),
  d('maker-mark', 'Maker mark', B, 'Round mark with initials, for the base of ceramics and woodwork.', ROUND, {
    base: { shape: 'ring', rows: [{ t: 'A·M', font: F.classic, bold: true, weight: 1.6 }, caps('CERAMICS', 140), { t: 'hand thrown', font: F.serif, italic: true, weight: 0.6 }] },
  }, { round: true }),
  d('print-edition', 'Signed print edition', 'Hobbies and collections', 'Title in italic serif, the edition number, which counts up, and the artist.', [[50, 30], [60, 40], [70, 40], [50, 20]], {
    base: { rows: [{ t: 'Morning on the river', font: F.serif, italic: true, bold: true, weight: 1.3 }, { serial: { digits: 2, suffix: ' / 50' }, font: F.mono }, caps('ALEX MORGAN · 2026', 100)] },
  }),
];

// ---------- home ----------

const H = 'Home and kitchen';

const HOME: TemplateDesign[] = [
  d('pantry-chalk', 'Chalkboard pantry label', H, 'White marker text on black, like a chalkboard.', [...JAR, ...ROUND], {
    base: { shape: 'block', rows: [{ t: 'Flour', font: F.marker, weight: 1.6 }, { t: 'plain · 2 kg', font: F.hand, bold: true }] },
    small: { shape: 'block', rows: [{ t: 'Flour', font: F.marker }] },
    round: { shape: 'disc', rows: [{ t: 'Flour', font: F.marker }] },
  }),
  d('pantry-deco', 'Pantry label, deco', H, 'Deco frame with classical capitals.', [...MEDIUM, ...SMALL], {
    base: { frame: 'deco', rows: [{ t: 'SUGAR', font: F.classic, bold: true, spacing: 200, weight: 1.6 }, { t: 'raw · caster · icing', font: F.serif, italic: true }] },
    small: { frame: 'deco', rows: [{ t: 'SUGAR', font: F.classic, bold: true, spacing: 200 }] },
  }),
  d('pantry-oval', 'Pantry label, oval', H, 'Oval outline with a script name.', [...MEDIUM, ...SMALL], {
    base: { shape: 'oval', rows: [{ t: 'Rice', font: F.script, bold: true }] },
  }),
  d('spice-mono', 'Spice label, typewriter', H, 'Monospace capitals with a small note. Round sizes fit a jar lid.', [...NARROW_SHORT, ...SMALL, ...ROUND], {
    base: { rows: [{ t: 'PAPRIKA', font: F.space, bold: true, weight: 1.4 }, { t: 'smoked', font: F.space }], gap: 0.1 },
    short: { rows: [{ t: 'PAPRIKA', font: F.space, bold: true }] },
    round: { frame: 'line', rows: [{ t: 'PAPRIKA', font: F.space, bold: true, weight: 1.3 }, { t: 'smoked', font: F.space, weight: 0.8 }] },
  }),
  d('coffee-station', 'Coffee station', H, 'Spaced capitals between two rules, for canisters of coffee, tea and sugar.', JAR, {
    base: { rows: [{ band: 'double', span: 0.8 }, { t: 'COFFEE', font: F.bebas, spacing: 400, weight: 2 }, { t: 'beans · medium roast', font: F.serif, italic: true }] },
    small: { rows: [{ t: 'COFFEE', font: F.bebas, spacing: 400, weight: 1.8 }, { t: 'beans · medium roast', font: F.serif, italic: true }], gap: 0.1 },
    narrow: { rows: [{ t: 'COFFEE', font: F.bebas, spacing: 300 }] },
  }),
  d('laundry-jar', 'Laundry room label', H, 'Script name over a wave.', JAR, {
    base: { rows: [{ t: 'Pegs', font: F.script, bold: true, weight: 2 }, { band: 'wave', span: 0.5 }] },
    narrow: { rows: [{ t: 'Pegs', font: F.script, bold: true }] },
  }),
  d('bathroom-jar', 'Bathroom label, minimal', H, 'Thin spaced capitals over a short rule.', JAR, {
    base: { rows: [{ t: 'COTTON BUDS', font: F.sans, spacing: 240, weight: 1.6 }, { band: 'rule', span: 0.2 }] },
    narrow: { rows: [{ t: 'COTTON BUDS', font: F.sans, spacing: 200 }] },
  }),
  d('kitchen-of', 'From the kitchen of', H, 'Dotted frame with a script line and the name of the cook, for gifts of food.', [[50, 30], [40, 30], [60, 40], [70, 40], ...ROUND], {
    base: { frame: 'dots', rows: [{ t: 'from the kitchen of', font: F.script, bold: true }, { t: 'Alex Morgan', font: F.serif, bold: true, weight: 1.4 }, { band: 'diamond', span: 0.6 }] },
    round: { shape: 'sealOutline', rows: [{ t: 'from the', font: F.script, bold: true, weight: 0.8 }, { t: 'kitchen of', font: F.script, bold: true, weight: 0.8 }, { t: 'ALEX', font: F.sans, bold: true, spacing: 120 }] },
  }),
  d('jar-mix', 'Mix in a jar', H, 'Retro script name with the instructions, for a gift of dry ingredients.', [[50, 50], [60, 40], [70, 40], [50, 70], [50, 80]], {
    base: { frame: 'double', rows: [{ t: 'Cookie Mix', font: F.retro, weight: 1.6 }, { band: 'dots', span: 0.5 }, { t: 'add 1 egg and 120 g butter', font: F.serif, italic: true }, { t: 'bake 12 minutes at 180 °C', font: F.serif, italic: true }] },
  }),
  d('bar-syrup', 'Home bar bottle', H, 'Spaced capitals and the date made in monospace, for syrups and infusions.', [...MEDIUM, ...SMALL, ...NARROW_SHORT], {
    base: { frame: 'brackets', rows: [{ t: 'SIMPLE SYRUP', font: F.sans, bold: true, spacing: 160, weight: 1.3 }, { cols: [{ t: 'made', font: F.mono, align: 'right' }, { date: 'DD/MM/YY', font: F.mono, bold: true, align: 'left' }] }] },
    narrow: { rows: [{ t: 'SIMPLE SYRUP', font: F.sans, bold: true, spacing: 120, weight: 1.2 }, { date: 'DD/MM/YY', font: F.mono }], gap: 0.1 },
  }),
  d('herb-classic', 'Herb pot, botanical', H, 'Classical capitals with the botanical name in italic serif.', [...MEDIUM, ...SMALL, ...NARROW], {
    base: { frame: 'line', rows: [{ t: 'BASIL', font: F.classic, bold: true, spacing: 240, weight: 1.5 }, { t: 'Ocimum basilicum', font: F.serif, italic: true }] },
    narrow: { rows: [{ t: 'BASIL', font: F.classic, bold: true, spacing: 200, weight: 1.3 }, { t: 'Ocimum basilicum', font: F.serif, italic: true }], gap: 0.1 },
    short: { rows: [{ t: 'BASIL', font: F.classic, bold: true, spacing: 160 }] },
  }),
  d('craft-drawer', 'Craft drawer', H, 'Tall handwritten capitals over a row of dots.', JAR, {
    base: { rows: [{ t: 'Buttons', font: F.amatic, bold: true, weight: 2.2 }, { band: 'dots', span: 0.4 }] },
    narrow: { rows: [{ t: 'Buttons', font: F.amatic, bold: true }] },
  }),
  d('kids-door', "Child's door sign", H, 'Stars in the corners with a rounded name.', [[60, 40], [70, 40], [80, 50], [50, 30], [100, 100]], {
    base: { frame: 'bold', corners: 'star', rows: [{ t: "Mia's Room", font: F.round, bold: true, weight: 1.7 }, { t: 'please knock', font: F.hand, bold: true }] },
  }),
  d('lunch-note', 'Lunchbox note', H, 'A handwritten note with a heart.', [...SMALL, [40, 30], [50, 30]], {
    base: { side: { pic: 'heart', width: 0.2 }, rows: [{ t: 'Have a great day!', font: F.hand, bold: true, weight: 1.4 }, { t: 'love, Mum', font: F.hand }] },
  }),
  d('memory-box', 'Memory box', H, 'Double frame with a formal script and the years.', [[60, 40], [70, 40], [80, 50], [50, 30]], {
    base: { frame: 'double', rows: [{ t: 'Memories', font: F.formal, weight: 2 }, { t: 'MIA · 2019–2026', font: F.classic, spacing: 140, weight: 0.8 }] },
  }),
  d('motto', 'Desk motto', H, 'A short line in italic serif over a rule.', [[50, 20], [40, 20], [75, 12], [50, 15], [50, 30]], {
    base: { rows: [{ t: 'one thing at a time', font: F.serif, italic: true, bold: true, weight: 2 }, { band: 'rule', span: 0.3 }] },
    narrow: { rows: [{ t: 'one thing at a time', font: F.serif, italic: true, bold: true }] },
  }),
  d('bottle-name', 'Water bottle name', H, 'Tall capitals over chevrons, for sports bottles.', [...SMALL, [40, 12], [50, 15], [75, 12]], {
    base: { rows: [{ t: 'ALEX', font: F.bebas, spacing: 240, weight: 2 }, { band: 'chevrons', span: 0.6 }] },
    narrow: { rows: [{ t: 'ALEX', font: F.bebas, spacing: 240 }] },
  }),
];

// ---------- work, hobbies and events ----------

const MORE: TemplateDesign[] = [
  d('planner-flag', 'Planner flag', 'Office', 'One word in white on black, for diaries, folders and trays.', [...NARROW_SHORT, [30, 20], [40, 20]], {
    base: { shape: 'block', rows: [{ t: 'URGENT', font: F.bebas, spacing: 200 }] },
  }),
  d('status-stamp', 'Status stamp', 'Office', 'A heavy word in a heavy frame with the date, like a rubber stamp.', [...SMALL, [40, 30], [50, 30]], {
    base: { frame: 'bold', rows: [{ t: 'PAID', font: F.heavy, spacing: 160, weight: 1.6 }, { date: 'DD MMM YYYY', font: F.mono, bold: true }] },
  }),
  d('recording', 'Recording in progress', 'Office', 'White capitals on black, for a studio or a meeting room door.', [...MEDIUM, ...SMALL, [50, 50]], {
    base: { shape: 'block', side: { icon: 'microphone' }, rows: [{ t: 'RECORDING', font: F.heavy, weight: 1.5 }, { t: 'please do not enter', font: F.sans, bold: true }] },
  }),
  d('return-address-script', 'Return address, script', 'Office', 'Family name in formal script over the address.', [[50, 30], [60, 40], [70, 40], [50, 20]], {
    base: { rows: [{ t: 'The Morgans', font: F.formal, weight: 1.8 }, { band: 'diamond', span: 0.5 }, { t: '12 Example Street', font: F.serif }, { t: 'Brisbane QLD 4000', font: F.serif }] },
    small: { rows: [{ t: 'The Morgans', font: F.formal, weight: 1.7 }, { t: '12 Example Street, Brisbane QLD 4000', font: F.serif }], gap: 0.1 },
  }),
  d('terminal-note', 'Server note, terminal', 'IT and servers', 'Two lines in monospace between square brackets, like a comment in a script.', [...MEDIUM, ...SMALL], {
    base: { frame: 'brackets', align: 'left', rows: [{ t: '> do not power off', font: F.mono, bold: true }, { t: '# backup runs at 02:00', font: F.mono }] },
  }),
  d('usb-stick', 'USB stick', 'IT and servers', 'Monospace text for a USB stick or a small drive.', [[22, 12], [30, 12], [30, 14], [30, 15], [25, 9.5]], {
    base: { rows: [{ t: 'BOOT', font: F.mono, bold: true }, { t: '24H2', font: F.mono }], gap: 0.1 },
  }),
  d('rack-plate', 'Rack name plate', 'IT and servers', 'Rack name in tall capitals with the row and the power feeds in monospace.', [[70, 40], [60, 40], [80, 50], [50, 30], [50, 20], [75, 12]], {
    base: { frame: 'deco', rows: [{ t: 'RACK A03', font: F.bebas, spacing: 160, weight: 1.8 }, { t: 'row A · feeds PDU-A1 / PDU-B1', font: F.mono }] },
    small: { rows: [{ t: 'RACK A03', font: F.bebas, spacing: 160, weight: 1.6 }, { t: 'row A · PDU-A1 / PDU-B1', font: F.mono }], gap: 0.1 },
    narrow: { rows: [{ t: 'RACK A03', font: F.bebas, spacing: 160 }] },
  }),
  d('tool-drawer-retro', 'Tool drawer, racing', 'Electrical and workshop', 'Chequered bands with a heavy word.', [...MEDIUM, ...SMALL, [75, 12], [50, 15], [40, 12]], {
    base: { bands: 'checks', rows: [{ t: 'SOCKETS', font: F.heavy, weight: 1.5 }, { t: 'metric · 8 to 24 mm', font: F.condensed }] },
    small: { bands: 'checks', rows: [{ t: 'SOCKETS', font: F.heavy }] },
  }),
  d('crate-stencil', 'Crate label, stencil', 'Shipping and storage', 'Tall capitals between chevrons, for garage crates and shelves.', [...MEDIUM, ...SMALL, [80, 50], [75, 12], [50, 15]], {
    base: { frame: 'corners', rows: [{ t: 'CAMPING', font: F.bebas, spacing: 200, weight: 2 }, { band: 'chevrons', span: 0.5 }, { t: 'BOX 2 OF 5', font: F.condensed, bold: true, spacing: 80, weight: 0.8 }] },
    small: { rows: [{ t: 'CAMPING', font: F.bebas, spacing: 200, weight: 1.6 }, { t: 'BOX 2 OF 5', font: F.condensed, bold: true, spacing: 80 }], gap: 0.1 },
    narrow: { rows: [{ t: 'CAMPING', font: F.bebas, spacing: 200 }] },
  }),
  d('mixtape', 'Mixtape spine', 'Hobbies and collections', 'Side letter in a black block with a marker title.', [[75, 12], [50, 15], [50, 20], [40, 12]], {
    base: { side: { block: 'A', width: 0.16, font: F.heavy }, rows: [{ t: 'Road trip mix 2026', font: F.marker }] },
  }),
  d('photo-caption', 'Photo caption', 'Hobbies and collections', 'A handwritten caption for albums and instant photos.', [...NARROW, ...SMALL], {
    base: { rows: [{ t: 'Byron Bay, summer 2026', font: F.hand, bold: true }] },
  }),
  d('time-capsule', 'Time capsule', 'Hobbies and collections', 'Stamp frame with the year to open it in a heavy serif.', [[60, 40], [70, 40], [50, 30], [80, 50], [50, 50]], {
    base: { frame: 'stamp', rows: [{ t: 'TIME CAPSULE', font: F.bebas, spacing: 200 }, { t: 'do not open until', font: F.script, bold: true }, { t: '2046', font: F.fat, weight: 1.6 }] },
  }),
  d('crate-divider', 'Record crate divider', 'Hobbies and collections', 'Genre and letters in tall capitals on a long strip.', [[75, 12], [50, 15], [50, 20]], {
    base: { rows: [{ cols: [{ t: 'JAZZ', font: F.bebas, spacing: 200, align: 'left' }, { t: 'A–F', font: F.bebas, invert: true, align: 'center' }], ratios: [3, 1] }] },
  }),
  d('player-tag', 'Controller name', 'Hobbies and collections', 'White monospace capitals on black, for controllers and headsets.', [...NARROW_SHORT, ...SMALL], {
    base: { shape: 'block', rows: [{ t: 'PLAYER 1', font: F.space, bold: true }] },
  }),
  d('seed-packet', 'Seed packet, script', 'Garden and pets', 'Dotted frame with the flower in script and a leaf sprig.', [[50, 30], [40, 30], [60, 40], [50, 50], ...TALL], {
    base: { frame: 'dots', rows: [{ t: 'Sweet Pea', font: F.script, bold: true, weight: 1.7 }, { band: 'sprig', span: 0.5 }, { t: 'SAVED SEEDS · 2026', font: F.sans, bold: true, spacing: 120, weight: 0.65 }] },
  }),
  d('pet-bowl', 'Pet name', 'Garden and pets', 'Paw prints in the corners with the name in retro script.', [...MEDIUM, ...SMALL, ...ROUND], {
    base: { corners: 'paw', rows: [{ t: 'Biscuit', font: F.retro }] },
    small: { side: { pic: 'paw', width: 0.22 }, rows: [{ t: 'Biscuit', font: F.retro }] },
    round: { frame: 'bold', rows: [{ pic: 'paw', weight: 1.2 }, { t: 'Biscuit', font: F.retro }] },
  }),
  d('suitcase-stamp', 'Suitcase sticker', 'Travel and vehicles', 'Stamp frame with mountain peaks, the name and the home city.', [[60, 40], [70, 40], [50, 30], [80, 50], [50, 50]], {
    base: { frame: 'stamp', side: { pic: 'peaks' }, rows: [{ t: 'ALEX MORGAN', font: F.bebas, spacing: 120, weight: 1.4 }, { t: 'Brisbane, Australia', font: F.serif, italic: true }, { t: '+61 400 000 000', font: F.mono, weight: 0.8 }] },
  }),
  d('camp-name', 'Camp name label', 'Travel and vehicles', 'Mountain peaks with the camp in retro script and the name of the camper.', [[50, 30], [40, 30], [60, 40], [50, 20], [40, 20]], {
    base: { side: { pic: 'peaks' }, rows: [{ t: 'Camp Banksia', font: F.retro, weight: 1.4 }, { t: 'Charlie Morgan', font: F.round, bold: true }] },
  }),
  d('bake-sale', 'Bake sale price', 'School and events', 'Bunting over a retro script name and the price.', [[50, 30], [60, 40], [70, 40], [40, 30], [50, 50]], {
    base: { rows: [{ band: 'bunting', span: 1, weight: 0.8 }, { t: 'Cupcakes', font: F.retro, weight: 1.6 }, { t: '$3 EACH', font: F.bebas, spacing: 160 }] },
  }),
  d('raffle-ticket', 'Raffle ticket', 'School and events', 'Ticket shape with the event name and a number that counts up.', [[60, 40], [70, 40], [50, 30], [80, 50]], {
    base: { frame: 'ticket', rows: [{ t: 'RAFFLE', font: F.bebas, spacing: 300 }, { serial: { digits: 4 }, font: F.fat, weight: 1.8 }, { t: 'School fete 2026 · $2', font: F.sans, bold: true, weight: 0.7 }] },
  }),
  d('movie-night', 'Movie night', 'School and events', 'Film strip bands with tall capitals and the time.', [[60, 40], [70, 40], [50, 30], [80, 50], [50, 50]], {
    base: { bands: 'film', rows: [{ t: 'MOVIE NIGHT', font: F.bebas, spacing: 160, weight: 1.6 }, { t: 'Friday · 7 pm · the hall', font: F.sans, bold: true }] },
  }),
  d('team-sticker', 'Team sticker', 'School and events', 'Heavy team name between rows of stars. Round sizes make a badge.', [...MEDIUM, ...SMALL, ...ROUND], {
    base: { rows: [{ band: 'stars', span: 0.5 }, { t: 'TEAM BLUE', font: F.heavy, weight: 1.8 }, { band: 'stars', span: 0.5 }] },
    small: { rows: [{ t: 'TEAM BLUE', font: F.heavy, weight: 1.8 }, { band: 'stars', span: 0.4 }] },
    round: { shape: 'disc', rows: [{ t: 'TEAM', font: F.heavy }, { t: 'BLUE', font: F.heavy }, { band: 'stars', span: 0.8 }] },
  }),
  d('star-of-week', 'Star of the week', 'School and events', 'Leaf wreath round a star and the words.', [[50, 50], [40, 40], [34, 34], [31, 31]], {
    base: { shape: 'laurel', rows: [{ pic: 'star', weight: 1.2 }, { t: 'STAR', font: F.bebas, spacing: 200 }, { t: 'of the week', font: F.script, bold: true, weight: 0.8 }] },
  }),
  d('hello-name', 'Hello, my name is', 'School and events', 'A black bar with the greeting and a large space for the name.', [[50, 30], [60, 40], [70, 40], [80, 50]], {
    base: { frame: 'bold', rows: [{ t: 'HELLO', font: F.heavy, invert: true, spacing: 160, weight: 1 }, { t: 'my name is', font: F.sans, bold: true, weight: 0.5 }, { t: 'Alex', font: F.marker, weight: 2 }] },
  }),
];

export const MAKERS: TemplateDesign[] = [...PRODUCE, ...CARE, ...BADGES, ...HOME, ...MORE];

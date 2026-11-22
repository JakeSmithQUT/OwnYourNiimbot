// Practical templates for work, home, the workshop, the garden, hobbies and
// travel. They use the plain system font, so that the text is easy to change.

import { LARGE, MEDIUM, NARROW, NARROW_SHORT, ROUND, SMALL, TALL, type Size, type TemplateDesign } from './kit';
import { design as d } from './compose';
import { ANY, CARD, card, coded, iconLines, lines, sign, SIGN } from './presets';

const today = { date: 'DD/MM/YYYY' };
const inDays = (offset: number) => ({ date: 'DD/MM/YYYY', offset });
const WIDE: Size[] = [[50, 30], [40, 30], [60, 40], [70, 40], [50, 20], [40, 20]];
const BOXY: Size[] = [...MEDIUM, [50, 50], [80, 50]];
const STRIP: Size[] = [...NARROW, ...SMALL];

// ---------- IT and servers ----------

const IT: TemplateDesign[] = [
  d('vm-host', 'Virtual machine host', 'IT and servers', 'Host name, hypervisor, cluster and resources, with a QR code.', CARD,
    coded('qr', 'hv-node-03 · cluster PROD-A', 'hv-node-03', 'Cluster  PROD-A', '2 × 32 cores · 512 GB', 'Hypervisor 8.0')),
  d('ups', 'UPS battery record', 'IT and servers', 'Date that the battery was fitted, the date to replace it (three years later) and the load.', CARD,
    card('UPS-02', [['Battery fitted', today], ['Replace by', inDays(1095)], ['Load', '1.2 kVA']])),
  d('backup-media', 'Backup tape or drive', 'IT and servers', 'Backup set, the date written and the date until which to keep it.', CARD,
    card('BACKUP', [['Set', 'Weekly full 3'], ['Written', today], ['Keep until', inDays(365)]])),
  d('loan-device', 'Loan device', 'IT and servers', 'Asset number, the borrower and the date to return the device.', CARD,
    card('LOAN DEVICE', [['Asset', 'LT-0203'], ['Lent to', ''], ['Due back', inDays(14)]])),
  d('decommissioned', 'Decommissioned equipment', 'IT and servers', 'Marks equipment that is out of use, with the date that the disks were wiped.', CARD, {
    base: { bands: 'stripes', align: 'left', rows: [{ t: 'DECOMMISSIONED', bold: true, align: 'center', weight: 1.4 }, { kv: ['Disks wiped', today] }, { kv: ['By', ''] }] },
    small: { bands: 'stripes', rows: [{ t: 'DECOMMISSIONED', bold: true }, { date: 'DD/MM/YYYY' }] },
  }),
  d('power-feed', 'Power feed A or B', 'IT and servers', 'Feed letter with the power distribution unit and the circuit, for dual-supply equipment.', [[30, 12], [30, 14], [30, 15], [40, 12], ...SMALL, [40, 30]], {
    base: { side: { block: 'A', width: 0.32 }, rows: [{ t: 'PDU-A1', bold: true, weight: 1.3 }, { t: 'Circuit 14 · 16 A' }], gap: 0.2 },
  }),
  d('static-ip', 'Static IP address', 'IT and servers', 'Device name, IP address and MAC address for printers, cameras and other fixed devices.', ANY,
    iconLines('network', 'printer-02', '10.0.4.52', 'MAC 3C:52:82:1A:9F:07')),
  d('it-support-qr', 'IT support QR code', 'IT and servers', 'A QR code that opens your help desk, with the asset number and a phone extension.', WIDE,
    coded('qr', 'https://helpdesk.example.com/new?asset=LT-0157', 'Need help?', 'Scan to log a ticket', 'Asset LT-0157', 'or call ext. 1234')),
  d('firmware', 'Firmware version', 'IT and servers', 'Firmware or BIOS version and the date of the update.', [...SMALL, [40, 30], [50, 30], [40, 12], [50, 15]], {
    base: { align: 'left', rows: [{ kv: ['Firmware', '2.14.1'] }, { kv: ['Updated', today] }] },
    narrow: { rows: [{ cols: [{ t: 'FW 2.14.1', bold: true }, { date: 'DD/MM/YY' }] }] },
  }),
  d('kvm-ports', 'KVM or console ports', 'IT and servers', 'Table of port numbers and the servers that connect to them.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { rows: [{ table: [['1', 'web-prod-01', '5', 'db-prod-01'], ['2', 'web-prod-02', '6', 'db-prod-02'], ['3', 'app-01', '7', 'backup-01'], ['4', 'app-02', '8', '—']], colRatios: [1, 4, 1, 4] }] },
  }),
  d('screen-dock', 'Desk screen and dock', 'IT and servers', 'Desk number with the asset numbers of the screen and the dock.', ANY, iconLines('monitor', 'Desk 4.12', 'Screen MN-0311', 'Dock DK-0127')),
  d('imaged', 'Imaged and ready', 'IT and servers', 'Operating system build, the date of the image and the technician.', CARD,
    card('READY TO DEPLOY', [['Build', '24H2 standard'], ['Imaged', today], ['By', '']])),
];

// ---------- Network and cables ----------

const NETWORK: TemplateDesign[] = [
  d('fibre-link', 'Fibre link', 'Network and cables', 'Fibre type and length with the two end points.', WIDE, {
    base: { align: 'left', rows: [{ t: 'OM4 LC–LC · 15 m', bold: true, weight: 1.3 }, { kv: ['A end', 'Rack 3 U40 p12'] }, { kv: ['B end', 'Rack 7 U40 p12'] }] },
    small: { align: 'left', rows: [{ t: 'OM4 LC–LC · 15 m', bold: true }, { t: 'R3 U40 p12  ↔  R7 U40 p12' }] },
  }),
  d('cable-number', 'Numbered cable markers', 'Network and cables', 'The same number two times, one for each end of the cable. The number counts up for each label.', [[40, 12], [50, 15], [75, 12], [30, 12], [40, 14]], {
    base: { rows: [{ cols: [{ serial: { prefix: 'C-', digits: 4 }, bold: true }, { serial: { prefix: 'C-', digits: 4 }, bold: true }], gap: 3 }] },
  }),
  d('data-outlet', 'Data outlet', 'Network and cables', 'Wall outlet number with the patch panel port that it connects to.', [...NARROW_SHORT, ...SMALL], {
    base: { side: { block: 'D', width: 0.26 }, rows: [{ t: '2-014', bold: true, weight: 1.4 }, { t: 'PP-B port 14' }], gap: 0.2 },
  }),
  d('cable-type', 'Cable type and length', 'Network and cables', 'Category and length, for spare patch cables.', NARROW, lines('CAT6A · 3 m', 'Shielded, blue')),
  d('internet-service', 'Internet service details', 'Network and cables', 'Provider, service number and the support phone number, for the modem or the network cabinet.', CARD,
    card('INTERNET', [['Provider', 'Example Net'], ['Service ID', 'AVC000012345678'], ['Support', '1300 000 000']])),
  d('vlan-list', 'VLAN list', 'Network and cables', 'Table of VLAN numbers and their names.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { rows: [{ table: [['10', 'Management'], ['20', 'Staff'], ['30', 'Guest'], ['99', 'Cameras']], colRatios: [1, 3.5] }] },
  }),
];

// ---------- Office ----------

const OFFICE: TemplateDesign[] = [
  d('tray', 'In and out trays', 'Office', 'A large word for document trays.', [...SMALL, ...NARROW, [50, 30]], {
    base: { bands: 'solid', rows: [{ t: 'IN', bold: true }] },
    narrow: { rows: [{ t: 'IN', invert: true, bold: true, align: 'center' }] },
  }),
  d('meeting-room', 'Meeting room', 'Office', 'Room name and capacity, with a QR code to book the room.', WIDE,
    coded('qr', 'https://rooms.example.com/book/banksia', 'Banksia Room', 'Seats 8', 'Scan to book')),
  d('archive-box', 'Archive box', 'Office', 'Department, contents, years and the date to destroy the records.', BOXY,
    card('ARCHIVE', [['Department', 'Finance'], ['Contents', 'Invoices A–M'], ['Years', '2024–2025'], ['Destroy after', inDays(2555)]])),
  d('confidential', 'Confidential', 'Office', 'Marks folders, envelopes and boxes with confidential contents.', [...SMALL, ...NARROW, [50, 30], [40, 30]], sign('lock', 'CONFIDENTIAL', 'Authorised staff only', 'info')),
  d('key-tag', 'Key tag', 'Office', 'Key number and the door or cabinet that the key opens.', [...NARROW_SHORT, ...SMALL], {
    base: { frame: 'tag', rows: [{ t: 'K-17', bold: true, weight: 1.4 }, { t: 'Store room B' }], gap: 0.2 },
    narrow: { side: { icon: 'key' }, rows: [{ t: 'K-17', bold: true, weight: 1.3 }, { t: 'Store room B' }], gap: 0.2 },
  }),
  d('visitor', 'Visitor badge', 'Office', 'Visitor heading, lines for the name and the host, and the date.', [[50, 30], [60, 40], [70, 40], [80, 50]], {
    base: { align: 'left', rows: [{ t: 'VISITOR', invert: true, bold: true, align: 'center', spacing: 120, weight: 1.3 }, { kv: ['Name', ''] }, { kv: ['Visiting', ''] }, { kv: ['Date', today] }] },
  }),
  d('received', 'Received mark', 'Office', 'Date that a document or parcel arrived, and who took it.', [...SMALL, [40, 30], [50, 30]], card('RECEIVED', [['Date', { date: 'DD/MM/YYYY HH:mm' }], ['By', '']])),
  d('approved', 'Approval mark', 'Office', 'A framed "Approved" with the date and a line for a signature.', [[50, 30], [40, 30], [60, 40]], {
    base: { frame: 'bold', align: 'left', rows: [{ t: 'APPROVED', bold: true, align: 'center', spacing: 100, weight: 1.4 }, { kv: ['Date', today] }, { kv: ['Signed', ''] }] },
  }),
  d('binder-spine', 'Binder spine', 'Office', 'Title along the spine with the year in a black block.', [[75, 12], [50, 15], [40, 12], [50, 20]], {
    base: { side: { block: '2026', width: 0.24, at: 'right' }, rows: [{ t: 'Supplier invoices', bold: true }] },
  }),
  d('phone-list', 'Phone extensions', 'Office', 'Table of names and extension numbers.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { rows: [{ table: [['Reception', '100'], ['IT help desk', '1234'], ['Facilities', '1300'], ['Security', '1999']], colRatios: [2.6, 1] }] },
  }),
  d('recycle-bin', 'Recycling bin', 'Office', 'What goes in the bin and what does not.', SIGN, sign('recycle', 'PAPER ONLY', 'No cups or food')),
  d('staff-fridge', 'Staff fridge', 'Office', 'Name and the date that the food went in the fridge.', STRIP, {
    base: { side: { icon: 'fridge' }, rows: [{ t: 'Alex', bold: true, weight: 1.4 }, { date: 'ddd D MMM' }], gap: 0.2 },
  }),
  d('mail-slot', 'Mail slot', 'Office', 'Name and team for mail slots and pigeonholes.', STRIP, iconLines('mail', 'Alex Morgan', 'Finance')),
  d('equipment-booking', 'Shared equipment', 'Office', 'Equipment name with a QR code to book it.', WIDE, coded('qr', 'https://rooms.example.com/book/projector-2', 'Projector 2', 'Scan to book', 'Return to Store room B')),
  d('first-aider', 'First aider and fire warden', 'Office', 'Names and phone numbers of the first aider and the fire warden for the floor.', BOXY, {
    base: { align: 'left', rows: [{ t: 'LEVEL 4', invert: true, bold: true, align: 'center', spacing: 80 }, { kv: ['First aider', 'Sam Lee · 1420'] }, { kv: ['Fire warden', 'Jo Park · 1433'] }] },
  }),
];

// ---------- Home and kitchen ----------

const HOME: TemplateDesign[] = [
  d('bin-day', 'Bin collection day', 'Home and kitchen', 'Which bin goes out and when.', ANY, iconLines('bin', 'Recycling', 'Every second Tuesday', 'Put out the night before')),
  d('light-switches', 'Light switch names', 'Home and kitchen', 'One name for each switch on a plate with two or three switches.', [[40, 12], [50, 15], [75, 12], [30, 12], [40, 20]], {
    base: { rows: [{ cols: [{ t: 'Porch', bold: true }, { t: 'Hall', bold: true }, { t: 'Stairs', bold: true }], gap: 1.5 }] },
  }),
  d('remote-control', 'Remote control', 'Home and kitchen', 'Which device the remote control is for.', STRIP, iconLines('television', 'Lounge TV', 'Input: HDMI 2')),
  d('key-hook', 'Key hook', 'Home and kitchen', 'Name for each hook or key.', STRIP, iconLines('key', 'Garage', 'Side door')),
  d('paint-tin', 'Paint tin', 'Home and kitchen', 'Room, colour, finish and the date of purchase, for touch-ups later.', BOXY,
    card('PAINT', [['Room', 'Lounge walls'], ['Colour', 'Natural white'], ['Finish', 'Low sheen'], ['Bought', { date: 'MMM YYYY' }]])),
  d('filter-change', 'Filter change', 'Home and kitchen', 'Date that a filter was changed and the next date, 90 days later. For water, air and range hood filters.', CARD,
    card('FILTER', [['Changed', today], ['Change next', inDays(90)]])),
  d('battery-state', 'Battery state', 'Home and kitchen', 'Boxes to tick for charged and flat batteries.', [...SMALL, [40, 12], [50, 15]], {
    base: { align: 'left', rows: [{ t: 'AA rechargeable', bold: true }, { ticks: ['Charged', 'Flat'] }] },
    narrow: { rows: [{ ticks: ['Charged', 'Flat'] }] },
  }),
  d('cleaning-mix', 'Cleaning spray bottle', 'Home and kitchen', 'Contents, the dilution and the date that the bottle was mixed.', WIDE, {
    base: { side: { icon: 'spray' }, rows: [{ t: 'All-purpose cleaner', bold: true, weight: 1.4 }, { t: '1 part to 10 parts water' }, { kv: ['Mixed', today] }] },
    small: { side: { icon: 'spray' }, rows: [{ t: 'All-purpose cleaner', bold: true, weight: 1.3 }, { t: '1 part to 10 parts water' }] },
  }),
  d('emergency-numbers', 'Emergency numbers', 'Home and kitchen', 'Table of the phone numbers that a babysitter or a guest needs.', [[50, 30], [60, 40], [70, 40], [50, 50], [80, 50]], {
    base: { rows: [{ table: [['Emergency', '000'], ['Mum', '0400 000 001'], ['Dad', '0400 000 002'], ['Doctor', '07 5550 0100']], colRatios: [1, 1.2] }] },
  }),
  d('toy-bin', 'Toy bin', 'Home and kitchen', 'A symbol and a word, so that children who cannot read yet know where toys go.', [...MEDIUM, ...SMALL, [50, 50]], {
    base: { side: { icon: 'toy bricks' }, rows: [{ t: 'Building bricks', bold: true }] },
    tall: { rows: [{ icon: 'toy bricks', weight: 2 }, { t: 'Building bricks', bold: true }] },
  }),
  d('linen-shelf', 'Linen cupboard shelf', 'Home and kitchen', 'Bed size and item for each shelf.', STRIP, iconLines('double bed', 'King sheets', 'Fitted and flat')),
  d('appliance-manual', 'Appliance manual QR code', 'Home and kitchen', 'A QR code that opens the manual, with the model number and the date of purchase.', WIDE,
    coded('qr', 'https://example.com/manuals/dishwasher-dw60', 'Dishwasher', 'Model DW60-S', 'Scan for the manual', 'Bought 03/2026')),
  d('water-shutoff', 'Water shut-off valve', 'Home and kitchen', 'Marks the main water valve and gives the direction to close it.', SIGN, sign('liquid', 'WATER SHUT-OFF', 'Turn clockwise to close', 'info')),
  d('gas-shutoff', 'Gas shut-off valve', 'Home and kitchen', 'Marks the gas valve and gives the direction to close it.', SIGN, sign('flammable', 'GAS SHUT-OFF', 'Quarter turn to close', 'info')),
  d('opened-on', 'Opened on', 'Home and kitchen', 'Date that a jar or packet was opened and how long it keeps.', [...SMALL, ...NARROW_SHORT, [40, 30]], {
    base: { align: 'left', rows: [{ kv: ['Opened', today] }, { kv: ['Use within', '3 days'] }] },
    narrow: { rows: [{ cols: [{ t: 'Opened', bold: true }, { date: 'DD/MM/YY' }] }] },
  }),
  d('meal-prep', 'Meal prep', 'Home and kitchen', 'Day of the week in a black block, the meal and the date that it was cooked.', [...SMALL, [40, 30], [50, 30], [40, 12], [50, 15]], {
    base: { side: { block: 'MON', width: 0.3 }, rows: [{ t: 'Chicken and rice', bold: true, weight: 1.3 }, { kv: ['Cooked', { date: 'DD/MM' }] }], gap: 0.2 },
    narrow: { side: { block: 'MON', width: 0.26 }, rows: [{ t: 'Chicken and rice', bold: true }] },
  }),
  d('kitchen-drawer', 'Kitchen drawer or shelf', 'Home and kitchen', 'A symbol and a word for drawers, shelves and baskets.', STRIP, iconLines('food', 'Baking tools')),
  d('compost-caddy', 'Compost caddy', 'Home and kitchen', 'What goes in the kitchen compost caddy.', SIGN, sign('leaf', 'COMPOST', 'Food scraps only')),
  d('medicine-cabinet', 'Medicine cabinet shelf', 'Home and kitchen', 'Shelf name with a reminder to check the expiry dates.', STRIP, iconLines('medicine', 'Pain and fever', 'Check dates each January')),
  d('guest-info', 'Guest information', 'Home and kitchen', 'Wi-Fi name, check-out time and a contact number for a guest room or a holiday rental.', BOXY,
    card('WELCOME', [['Wi-Fi', 'Guest Network'], ['Password', 'change-me-please'], ['Check-out', '10:00 am'], ['Host', '0400 000 000']])),
  d('chore', 'Chore chart strip', 'Home and kitchen', 'A chore with a box to tick for each weekday.', [[50, 20], [40, 20], [50, 30], [75, 12], [50, 15]], {
    base: { align: 'left', rows: [{ t: 'Feed the dog', bold: true }, { ticks: ['M', 'T', 'W', 'T', 'F'] }] },
    narrow: { align: 'left', rows: [{ cols: [{ t: 'Feed the dog', bold: true }, { ticks: ['M', 'T', 'W', 'T', 'F'] }], ratios: [1, 1.4] }] },
  }),
];

// ---------- Food and hospitality ----------

const FOOD: TemplateDesign[] = [
  d('use-by', 'Prepared and use by', 'Food and hospitality', 'Item, the date it was prepared, the use-by date (three days later) and initials.', CARD, {
    base: { align: 'left', rows: [{ t: 'Cooked rice', bold: true, weight: 1.2 }, { kv: ['Prepared', { date: 'ddd DD/MM' }] }, { kv: ['Use by', { date: 'ddd DD/MM', offset: 3 }] }, { kv: ['By', ''] }] },
    small: { align: 'left', rows: [{ t: 'Cooked rice', bold: true }, { kv: ['Use by', { date: 'ddd DD/MM', offset: 3 }] }], gap: 0.3 },
  }),
  d('defrosted', 'Defrosted', 'Food and hospitality', 'Date and time that food left the freezer and the date to use it by.', CARD,
    card('DEFROSTED', [['Out of freezer', { date: 'DD/MM HH:mm' }], ['Use by', { date: 'ddd DD/MM', offset: 2 }], ['By', '']])),
  d('fridge-temp', 'Fridge temperature check', 'Food and hospitality', 'Date of the check, a line for the temperature and initials.', CARD,
    card('TEMPERATURE', [['Checked', { date: 'DD/MM HH:mm' }], ['Reading °C', ''], ['By', '']])),
  d('allergen-ticks', 'Allergen boxes', 'Food and hospitality', 'Dish name with boxes to tick for the common allergens.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { align: 'left', rows: [{ t: 'Pumpkin soup', bold: true, weight: 1.3 }, { ticks: ['Gluten', 'Dairy', 'Egg'] }, { ticks: ['Nuts', 'Soy', 'Fish'] }, { ticks: ['Sesame', 'Shellfish', 'Sulphites'] }] },
  }),
  d('dietary-dot', 'Dietary sticker', 'Food and hospitality', 'Round sticker with a short code and the words, for example GF for gluten free.', [[31, 31], [34, 34], [50, 50]], {
    base: { shape: 'disc', rows: [{ t: 'GF', bold: true, weight: 2 }, { t: 'GLUTEN FREE', bold: true, spacing: 60 }] },
  }, { round: true }),
  d('cup-order', 'Cup order', 'Food and hospitality', 'Customer name and boxes to tick for the milk and the extras.', [[50, 30], [40, 30], [50, 20], [40, 20]], {
    base: { align: 'left', rows: [{ t: 'Flat white · Alex', bold: true, weight: 1.3 }, { ticks: ['Oat', 'Soy', 'Skim'] }, { ticks: ['Extra shot', 'Decaf'] }] },
    small: { align: 'left', rows: [{ t: 'Flat white · Alex', bold: true }, { ticks: ['Oat', 'Soy', 'Decaf'] }] },
  }),
  d('takeaway-seal', 'Takeaway bag seal', 'Food and hospitality', 'A strip that seals a bag or a box and shows that nobody opened it.', [[75, 12], [50, 15], [40, 12], [50, 20]], {
    base: { bands: 'stripes', rows: [{ t: 'SEALED FOR YOU', bold: true }] },
  }),
  d('tap-beer', 'Beer tap', 'Food and hospitality', 'Beer name, style, strength and the date that the keg was tapped.', WIDE, {
    base: { side: { icon: 'beer' }, rows: [{ t: 'Coastal Pale', bold: true, weight: 1.5 }, { t: 'Pale ale · 4.8% ABV' }, { kv: ['Tapped', { date: 'DD/MM' }] }] },
    small: { side: { icon: 'beer' }, rows: [{ t: 'Coastal Pale', bold: true, weight: 1.4 }, { t: 'Pale ale · 4.8% ABV' }] },
  }),
  d('decanted', 'Decanted dry goods', 'Food and hospitality', 'Product, batch, the date that the pack was opened and the best-before date.', CARD,
    card('PLAIN FLOUR', [['Batch', 'L24117'], ['Opened', today], ['Best before', inDays(180)]])),
  d('baked-today', 'Baked today', 'Food and hospitality', 'Product name, the date and the price.', [...SMALL, [40, 30], [50, 30], ...NARROW_SHORT], {
    base: { rows: [{ t: 'Sourdough loaf', bold: true, weight: 1.4 }, { cols: [{ t: 'Baked' }, { date: 'ddd D MMM', bold: true }] }, { t: '$8.50', bold: true }] },
    small: { rows: [{ t: 'Sourdough loaf', bold: true, weight: 1.3 }, { cols: [{ t: 'Baked' }, { date: 'ddd D MMM', bold: true }] }], gap: 0.2 },
  }),
  d('buffet-dish', 'Buffet dish', 'Food and hospitality', 'Dish name with boxes for vegetarian, vegan and gluten free.', [[50, 30], [60, 40], [70, 40]], {
    base: { rows: [{ t: 'Roast vegetable salad', bold: true, weight: 1.6 }, { ticks: ['Vegetarian', 'Vegan', 'Gluten free'] }] },
  }),
  d('sanitiser', 'Sanitiser bottle', 'Food and hospitality', 'Contents, the date and time of mixing and when to discard it.', WIDE, {
    base: { side: { icon: 'spray' }, rows: [{ t: 'SANITISER', bold: true, weight: 1.4 }, { kv: ['Mixed', { date: 'DD/MM HH:mm' }] }, { t: 'Discard after 24 hours' }] },
    small: { side: { icon: 'spray' }, rows: [{ t: 'SANITISER', bold: true, weight: 1.3 }, { kv: ['Mixed', { date: 'DD/MM HH:mm' }] }] },
  }),
  d('fryer-oil', 'Fryer oil change', 'Food and hospitality', 'Date of the last oil change and the next date, seven days later.', CARD, card('FRYER OIL', [['Changed', today], ['Change next', inDays(7)], ['By', '']])),
  d('reserved-table', 'Reserved table', 'Food and hospitality', 'Reserved, with the name and the time of the booking.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { frame: 'double', rows: [{ t: 'RESERVED', bold: true, spacing: 160, weight: 1.4 }, { band: 'rule', span: 0.4 }, { t: 'Morgan · 7:30 pm' }] },
  }),
  d('raw-cooked', 'Raw or cooked', 'Food and hospitality', 'Marks containers and shelves for raw food.', SIGN, sign('beef', 'RAW MEAT', 'Store below cooked food', 'ban')),
];

// ---------- Retail ----------

const RETAIL: TemplateDesign[] = [
  d('clearance', 'Clearance price', 'Retail', 'The old price and the new price.', [...SMALL, [40, 30], [50, 30], ...ROUND], {
    base: { bands: 'solid', rows: [{ t: 'WAS $40.00' }, { t: 'NOW $25', bold: true, weight: 2 }] },
    small: { rows: [{ t: 'WAS $40.00' }, { t: 'NOW $25', bold: true, weight: 1.8 }], gap: 0.2 },
    round: { frame: 'bold', rows: [{ t: 'WAS $40' }, { t: '$25', bold: true, weight: 2 }, { t: 'NOW' }] },
  }),
  d('multi-buy', 'Multi-buy offer', 'Retail', 'An offer for more than one item, for example two for ten dollars.', [...SMALL, [40, 30], [50, 30], ...ROUND], {
    base: { shape: 'block', rows: [{ t: '2 FOR $10', bold: true, weight: 2 }, { t: 'or $6 each' }] },
    round: { shape: 'disc', rows: [{ t: '2 FOR', bold: true }, { t: '$10', bold: true, weight: 2 }] },
  }),
  d('unit-price', 'Shelf label with unit price', 'Retail', 'Product name, price, unit price and an EAN-13 barcode.', [[50, 30], [60, 40], [70, 40], [40, 30]], {
    base: { align: 'left', rows: [{ t: 'Olive oil 500 mL', bold: true }, { cols: [{ t: '$12.50', bold: true }, { t: '$2.50 per 100 mL', align: 'right' }], ratios: [1, 1.2], weight: 1.4 }, { code: 'ean13', value: '930000000001', weight: 1.8 }] },
  }),
  d('lay-by', 'Lay-by or on hold', 'Retail', 'Customer name, the date and the date to collect by.', CARD, card('ON HOLD', [['Name', ''], ['Date', today], ['Collect by', inDays(14)]])),
  d('tested-working', 'Tested and working', 'Retail', 'For second-hand and repaired goods: a tick, the date of the test and initials.', [...SMALL, [40, 30], [50, 30]], {
    base: { side: { icon: 'check in circle' }, rows: [{ t: 'TESTED · WORKS', bold: true, weight: 1.3 }, { kv: ['Date', today] }, { kv: ['By', ''] }] },
    small: { side: { icon: 'check in circle' }, rows: [{ t: 'TESTED · WORKS', bold: true, weight: 1.3 }, { kv: ['Date', today] }] },
  }),
  d('consignment', 'Consignment item', 'Retail', 'Seller code, item number and price, with a barcode.', [[50, 30], [60, 40], [40, 30]], {
    base: { align: 'left', rows: [{ cols: [{ t: 'Seller C-118', bold: true }, { t: '$35.00', bold: true, align: 'right' }] }, { code: 'code128', value: 'C118-0042', weight: 1.8 }] },
  }),
  d('display-only', 'Display only', 'Retail', 'Marks a display item that is not for sale.', SIGN, sign('eye protection', 'DISPLAY ONLY', 'Ask staff for a boxed one')),
  d('barcode-only', 'Barcode only', 'Retail', 'An EAN-13 barcode that fills the label, with a short product name.', [[40, 30], [50, 30], [40, 20], [50, 20]], {
    base: { rows: [{ t: 'Hand cream 75 mL', weight: 0.7 }, { code: 'ean13', value: '930000000002', weight: 3 }] },
    small: { rows: [{ code: 'ean13', value: '930000000002' }] },
  }),
  d('product-qr', 'Product page QR code', 'Retail', 'Product name and price with a QR code that opens the product page.', [[50, 30], [60, 40], [70, 40], [50, 20]], coded('qr', 'https://example.com/p/1234', 'Ceramic mug', '$24.00', 'Scan for details')),
  d('return-label', 'Return authorisation', 'Retail', 'Return number as a barcode, with the date and a line for the reason.', [[50, 30], [60, 40], [70, 40]], {
    base: { align: 'left', rows: [{ t: 'RETURN', invert: true, bold: true, align: 'center', spacing: 80 }, { code: 'code128', value: 'RMA-260412', weight: 1.8 }, { kv: ['Reason', ''] }] },
  }),
  d('warranty-seal', 'Warranty seal', 'Retail', 'A strip to put across a case join or a screw.', [[40, 12], [30, 12], [50, 15], [30, 15]], {
    base: { bands: 'stripes', rows: [{ t: 'WARRANTY VOID', bold: true, weight: 1.2 }, { t: 'IF REMOVED' }], gap: 0.1 },
  }),
  d('book-price', 'Second-hand book price', 'Retail', 'Price with boxes for the condition.', [...SMALL, [40, 30]], {
    base: { align: 'left', rows: [{ t: '$6.00', bold: true, weight: 1.5 }, { ticks: ['Good', 'Fair', 'Worn'] }] },
  }),
  d('size-strip', 'Size strip', 'Retail', 'A long strip with the size repeated, for hangers and folded clothes.', [[75, 12], [50, 15], [40, 12], [50, 20]], {
    base: { rows: [{ cols: [{ t: 'M', invert: true, bold: true, align: 'center' }, { t: 'MEDIUM', bold: true, spacing: 120 }, { t: 'M', invert: true, bold: true, align: 'center' }], ratios: [1, 3, 1] }] },
  }),
  d('gift-receipt', 'Gift receipt', 'Retail', 'Item and the date of purchase without the price, with the last date for an exchange.', CARD, card('GIFT RECEIPT', [['Item', 'Ceramic mug'], ['Bought', today], ['Exchange by', inDays(30)]])),
];

// ---------- Shipping and storage ----------

const SHIPPING: TemplateDesign[] = [
  d('pallet', 'Pallet label', 'Shipping and storage', 'Destination, purchase order, the pallet count and a barcode. For 80 × 50 mm and larger labels.', [...LARGE, [70, 40], [60, 40]], {
    base: { align: 'left', rows: [{ kv: ['To', 'Example Pty Ltd, Brisbane'] }, { kv: ['PO', '4500012345'] }, { t: 'PALLET 1 OF 4', invert: true, bold: true, align: 'center', weight: 1.4 }, { code: 'code128', value: '4500012345-01', weight: 2.2 }] },
  }),
  d('this-way-up', 'This way up', 'Shipping and storage', 'Two arrows and the words, for cartons that must stay upright.', SIGN, sign('this side up', 'THIS WAY UP')),
  d('heavy', 'Heavy item', 'Shipping and storage', 'Weight warning with the weight and the number of people for the lift.', SIGN, sign('weight', 'HEAVY', '23 kg · two-person lift', 'warn')),
  d('keep-dry', 'Keep dry', 'Shipping and storage', 'Umbrella symbol and the words.', SIGN, sign('keep dry', 'KEEP DRY')),
  d('keep-frozen', 'Keep frozen', 'Shipping and storage', 'Snowflake symbol with the storage temperature.', SIGN, sign('frozen', 'KEEP FROZEN', 'Store at −18 °C or colder', 'info')),
  d('keep-chilled', 'Keep chilled', 'Shipping and storage', 'Storage temperature for chilled goods.', SIGN, sign('keep cold', 'KEEP CHILLED', 'Store at 0 to 5 °C')),
  d('do-not-stack', 'Do not stack', 'Shipping and storage', 'Symbol and words for cartons that must not have a load on top.', SIGN, sign('do not stack', 'DO NOT STACK', '', 'ban')),
  d('handle-with-care', 'Handle with care', 'Shipping and storage', 'Symbol and words for delicate parcels.', SIGN, sign('handle with care', 'HANDLE WITH CARE')),
  d('do-not-bend', 'Do not bend', 'Shipping and storage', 'For envelopes with photos, prints and documents.', [...SMALL, ...NARROW, [50, 30], [40, 30]], sign('picture', 'DO NOT BEND', 'Photographs', 'ban')),
  d('box-contents', 'Box contents list', 'Shipping and storage', 'Room name in a black bar and four lines to write the contents on.', [...BOXY, ...TALL], {
    base: { align: 'left', rows: [{ t: 'KITCHEN', invert: true, bold: true, align: 'center', spacing: 80, weight: 1.2 }, { kv: ['1', ''] }, { kv: ['2', ''] }, { kv: ['3', ''] }, { kv: ['4', ''] }] },
  }),
  d('storage-tub-qr', 'Storage tub with QR contents', 'Shipping and storage', 'Tub number and name, with a QR code that holds the full list of contents.', WIDE,
    coded('qr', 'Tub 12: tent pegs, mallet, guy ropes, groundsheet, repair kit', 'TUB 12', 'Camping · shelter', 'Scan for the contents')),
  d('aisle-bay-level', 'Aisle, bay and level', 'Shipping and storage', 'Location in three boxes, with a barcode on the larger sizes.', [[50, 30], [60, 40], [70, 40], [50, 20], [40, 20]], {
    base: { rows: [{ table: [['AISLE', 'BAY', 'LEVEL'], ['A', '12', '3']], align: 'center', bold: true }, { code: 'code128', value: 'A-12-3', weight: 1.6 }] },
    small: { rows: [{ table: [['AISLE', 'BAY', 'LEVEL'], ['A', '12', '3']], align: 'center', bold: true }] },
  }),
  d('batch-expiry', 'Batch and expiry', 'Shipping and storage', 'Lot number, the date of manufacture and the expiry date, with a Data Matrix code.', [[50, 30], [60, 40], [70, 40], [50, 20], [40, 20]], {
    base: { side: { code: 'datamatrix', value: 'LOT L24117', at: 'right' }, align: 'left', rows: [{ kv: ['Lot', 'L24117'] }, { kv: ['Made', today] }, { kv: ['Expiry', inDays(365)] }] },
    small: { side: { code: 'datamatrix', value: 'LOT L24117', at: 'right' }, align: 'left', rows: [{ kv: ['Lot', 'L24117'] }, { kv: ['Expiry', inDays(365)] }] },
  }),
  d('qc-passed', 'Quality check passed', 'Shipping and storage', 'A tick, the date and the inspector number. Round sizes show the words in a ring.', [...ROUND, ...SMALL, [40, 30]], {
    base: { side: { icon: 'check in circle' }, rows: [{ t: 'QC PASSED', bold: true, weight: 1.4 }, { kv: ['Date', today] }, { kv: ['Inspector', '07'] }] },
    small: { side: { icon: 'check in circle' }, rows: [{ t: 'QC PASSED', bold: true, weight: 1.3 }, { kv: ['Date', today] }] },
    round: { shape: 'ring', rows: [{ t: 'QC', bold: true, weight: 1.6 }, { t: 'PASSED', bold: true }, { date: 'DD/MM/YY', weight: 0.7 }] },
  }),
  d('quarantine', 'Quarantine', 'Shipping and storage', 'Marks stock that must not be used or sent, with a line for the reason.', CARD, {
    base: { bands: 'stripes', align: 'left', rows: [{ t: 'QUARANTINE', bold: true, align: 'center', weight: 1.5 }, { kv: ['Reason', ''] }, { kv: ['Date', today] }] },
    small: { bands: 'stripes', rows: [{ t: 'QUARANTINE', bold: true }, { t: 'DO NOT USE' }] },
  }),
  d('picked-packed', 'Picked and packed', 'Shipping and storage', 'Lines for the picker and the packer, and the date.', CARD, card('ORDER CHECK', [['Picked by', ''], ['Packed by', ''], ['Date', today]])),
  d('order-barcode', 'Order number with barcode', 'Shipping and storage', 'Order number as text and as a Code 128 barcode. The number counts up for each label.', [[50, 30], [40, 30], [60, 40], [50, 20]], {
    base: { rows: [{ serial: { prefix: 'ORD-', digits: 6, start: 100001 }, bold: true }, { code: 'code128', value: 'ORD-{{index:6}}', weight: 2 }] },
  }),
  d('not-for-sale', 'Sample, not for sale', 'Shipping and storage', 'Marks samples and demonstration units.', [...SMALL, ...NARROW, [40, 30], [50, 30]], lines('SAMPLE', 'Not for resale')),
  d('cylinder-state', 'Cylinder state', 'Shipping and storage', 'Boxes to tick for full, in use and empty gas cylinders.', [...SMALL, [40, 30], [50, 30], [50, 15], [75, 12]], {
    base: { align: 'left', rows: [{ t: 'Argon · size E', bold: true }, { ticks: ['Full', 'In use', 'Empty'] }] },
    narrow: { rows: [{ ticks: ['Full', 'In use', 'Empty'] }] },
  }),
  d('stocktake', 'Stocktake count', 'Shipping and storage', 'Date of the count, the quantity and initials.', CARD, card('COUNTED', [['Date', today], ['Quantity', ''], ['By', '']])),
  d('return-to-sender', 'Return to sender', 'Shipping and storage', 'Boxes to tick for the reason that mail goes back.', [[50, 30], [60, 40], [70, 40]], {
    base: { align: 'left', rows: [{ t: 'RETURN TO SENDER', invert: true, bold: true, align: 'center' }, { ticks: ['Not at this address', 'Refused'] }, { ticks: ['Unknown', 'Moved'] }] },
  }),
];

// ---------- Electrical and workshop ----------

const WORKSHOP: TemplateDesign[] = [
  d('test-tag', 'Appliance test record', 'Electrical and workshop', 'Date of the test, the next test date (12 months later), the tester and the plant number. Obey the test rules for your region.', CARD,
    card('TESTED', [['Tested', today], ['Next test', inDays(365)], ['Tester', ''], ['Plant no.', 'P-0142']])),
  d('lock-out', 'Lock-out tag', 'Electrical and workshop', 'Do not operate, with lines for the name and the date.', [[50, 30], [60, 40], [70, 40], ...TALL], {
    base: { bands: 'stripes', align: 'left', rows: [{ t: 'DO NOT OPERATE', bold: true, align: 'center', weight: 1.5 }, { kv: ['Locked by', ''] }, { kv: ['Date', today] }] },
    tall: { bands: 'stripes', align: 'left', rows: [{ icon: 'lock', weight: 2 }, { t: 'DO NOT\nOPERATE', bold: true, align: 'center', weight: 2.4 }, { kv: ['Locked by', ''] }, { kv: ['Date', today] }] },
  }),
  d('danger-voltage', 'Danger, voltage', 'Electrical and workshop', 'High voltage symbol with the voltage.', SIGN, sign('high voltage', 'DANGER', '415 V · isolate before work', 'warn')),
  d('earth-point', 'Earth point', 'Electrical and workshop', 'Earth symbol and the word, for earth bars and bonding points.', [...NARROW_SHORT, ...SMALL, ...ROUND], {
    base: { side: { icon: 'earth' }, rows: [{ t: 'EARTH', bold: true }] },
    round: { rows: [{ icon: 'earth', weight: 2 }, { t: 'EARTH', bold: true }] },
  }),
  d('out-of-service', 'Out of service', 'Electrical and workshop', 'Marks faulty equipment, with the date of the report and a line for the fault.', CARD, {
    base: { bands: 'stripes', align: 'left', rows: [{ t: 'OUT OF SERVICE', bold: true, align: 'center', weight: 1.5 }, { kv: ['Fault', ''] }, { kv: ['Reported', today] }] },
    small: { bands: 'stripes', rows: [{ t: 'OUT OF SERVICE', bold: true }, { date: 'DD/MM/YYYY' }] },
  }),
  d('rcd-test', 'Safety switch test', 'Electrical and workshop', 'Date of the last push-button test and the next date, three months later.', CARD, card('SAFETY SWITCH', [['Tested', today], ['Test next', inDays(91)]])),
  d('solar-isolator', 'Solar isolator', 'Electrical and workshop', 'Marks the DC isolator of a solar system.', SIGN, sign('sun', 'SOLAR DC ISOLATOR', 'Turn off before work', 'info')),
  d('circuit-origin', 'Circuit origin', 'Electrical and workshop', 'Board, circuit number and breaker rating, for socket outlets and fixed equipment.', NARROW, lines('DB-2 · C14 · 20 A')),
  d('phase-markers', 'Phase markers', 'Electrical and workshop', 'L1, L2, L3 and N in black blocks, to cut apart.', [[40, 12], [50, 15], [75, 12], [50, 20], [40, 20]], {
    base: { rows: [{ cols: [{ t: 'L1', invert: true, bold: true, align: 'center' }, { t: 'L2', invert: true, bold: true, align: 'center' }, { t: 'L3', invert: true, bold: true, align: 'center' }, { t: 'N', invert: true, bold: true, align: 'center' }], gap: 1.5 }] },
  }),
  d('voltage', 'Voltage marker', 'Electrical and workshop', 'Voltage and current type, for outlets, transformers and power supplies.', [...NARROW_SHORT, ...SMALL], {
    base: { side: { icon: 'alternating current' }, rows: [{ t: '230 V AC', bold: true }] },
  }),
  d('fasteners', 'Screws and fasteners', 'Electrical and workshop', 'Size in large text, with the head type and the finish.', [...NARROW_SHORT, ...SMALL, [40, 30]], lines('M4 × 12', 'Pan head · zinc', 'Box of 100')),
  d('component-bin', 'Electronic component bin', 'Electrical and workshop', 'Value, package and tolerance, with a Data Matrix code of the part number.', [...NARROW_SHORT, ...SMALL], coded('datamatrix', 'RC0805FR-0710KL', '10 kΩ', '0805 · 1%')),
  d('chemical-container', 'Decanted chemical', 'Electrical and workshop', 'Product name, the hazard and the date that it was decanted. Copy the hazard details from the original container.', BOXY, {
    base: { side: { icon: 'flammable' }, rows: [{ t: 'Isopropyl alcohol', bold: true, weight: 1.4 }, { t: 'Flammable liquid' }, { t: 'Keep away from heat' }, { kv: ['Decanted', today] }] },
  }),
  d('calibration', 'Calibration record', 'Electrical and workshop', 'Instrument number, the calibration date, the due date (12 months later) and the certificate number.', CARD,
    card('CALIBRATED', [['ID', 'MM-014'], ['Date', today], ['Due', inDays(365)], ['Cert.', 'C-26-0412']])),
  d('oil-type', 'Oil and fluid', 'Electrical and workshop', 'Grade and use, for bottles, drums and filler caps.', ANY, iconLines('liquid', '10W-40', 'Engine oil', 'Mower and generator')),
  d('tool-location', 'Tool location', 'Electrical and workshop', 'Bay and hook number, so that each tool goes back to its place.', NARROW, lines('Bay 3 · Hook 12', 'Torque wrench')),
  d('battery-pack', 'Tool battery number', 'Electrical and workshop', 'Battery number in a black block, with the rating and the date of purchase.', [...NARROW_SHORT, ...SMALL], {
    base: { side: { block: '3', width: 0.26 }, rows: [{ t: '18 V · 5 Ah', bold: true, weight: 1.3 }, { t: 'Bought 03/2026' }], gap: 0.2 },
  }),
  d('machine-guard', 'Machine guard', 'Electrical and workshop', 'Reminder to keep the guard in position.', SIGN, sign('shield', 'GUARD MUST BE\nIN POSITION', '', 'warn')),
  d('max-load', 'Maximum load', 'Electrical and workshop', 'Safe working load for shelves, trolleys and lifting gear.', SIGN, sign('weight', 'MAX LOAD 150 kg', 'For each shelf', 'ban')),
  d('compressed-air', 'Pipe contents', 'Electrical and workshop', 'Contents and flow direction for pipes and hoses.', [[75, 12], [50, 15], [40, 12], [50, 20]], {
    base: { rows: [{ cols: [{ t: 'COMPRESSED AIR', bold: true }, { icon: 'big arrow right' }], ratios: [4, 1] }] },
  }),
  d('blade-details', 'Blade or bit details', 'Electrical and workshop', 'Size and type for saw blades, drill bits and router bits.', NARROW, lines('254 mm · 60 T', 'Fine crosscut')),
  d('vehicle-fuel', 'Fuel can', 'Electrical and workshop', 'Fuel type and the mix ratio for two-stroke fuel.', SIGN, sign('fuel', 'TWO-STROKE 50:1', 'Mixed fuel only', 'warn')),
];

// ---------- Lab and health ----------

const LAB: TemplateDesign[] = [
  d('reagent', 'Reagent bottle', 'Lab and health', 'Name, concentration, the date of preparation, the expiry date and initials.', BOXY,
    card('TRIS BUFFER', [['Conc.', '1 M · pH 8.0'], ['Prepared', today], ['Expires', inDays(180)], ['By', '']])),
  d('slide', 'Microscope slide', 'Lab and health', 'Specimen number and the date, for the frosted end of a slide.', [[22, 12], [30, 12], [30, 15], [25, 9.5]], {
    base: { rows: [{ serial: { prefix: 'H', digits: 4 }, bold: true, weight: 1.3 }, { date: 'DD/MM/YY' }], gap: 0.1 },
  }),
  d('petri', 'Petri dish', 'Lab and health', 'Round label with the organism, the medium, the date and initials.', ROUND, {
    base: { frame: 'line', rows: [{ t: 'E. coli K-12', bold: true, weight: 1.3 }, { t: 'LB agar' }, { cols: [{ date: 'DD/MM/YY' }, { t: 'AM' }], ratios: [2.2, 1], gap: 1 }] },
  }, { round: true }),
  d('vial-cap', 'Vial cap number', 'Lab and health', 'A number that counts up, for the cap of a tube or a vial.', [[20, 20], [21, 21]], {
    base: { rows: [{ serial: { digits: 3 }, bold: true }] },
  }, { round: true }),
  d('freezer-box-grid', 'Freezer box grid', 'Lab and health', 'A five by five grid to write the positions in a freezer box.', [[50, 50], [100, 100], [80, 50]], {
    base: { rows: [{ t: 'Box 7 · Rack B · −80 °C', bold: true, weight: 0.5 }, { table: [['A1', 'A2', 'A3', 'A4', 'A5'], ['B1', 'B2', 'B3', 'B4', 'B5'], ['C1', 'C2', 'C3', 'C4', 'C5'], ['D1', 'D2', 'D3', 'D4', 'D5'], ['E1', 'E2', 'E3', 'E4', 'E5']], align: 'center', weight: 4 }] },
  }),
  d('sterilised', 'Cleaned and sterilised', 'Lab and health', 'Date of sterilisation, the cycle number and initials.', CARD, card('STERILE', [['Date', today], ['Cycle', ''], ['By', '']])),
  d('biohazard', 'Biohazard', 'Lab and health', 'Biohazard symbol with the words.', SIGN, sign('biohazard', 'BIOHAZARD', 'Authorised staff only', 'warn')),
  d('pill-days', 'Pill organiser days', 'Lab and health', 'The seven days of the week in a row, to cut apart or to put along an organiser.', [[75, 12], [50, 15], [40, 12], [50, 20]], {
    base: { rows: [{ cols: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((t) => ({ t, invert: true, bold: true, align: 'center' as const })), gap: 0.8 }] },
  }),
  d('allergy-alert', 'Allergy alert', 'Lab and health', 'Allergy warning with the name of the allergen.', SIGN, sign('attention', 'ALLERGY', 'Penicillin', 'ban')),
  d('opened-discard', 'Opened and discard dates', 'Lab and health', 'For eye drops and other items with a short life after opening: the date opened and the discard date, 28 days later.', [...SMALL, [40, 30], [30, 15], [40, 12]], {
    base: { align: 'left', rows: [{ kv: ['Opened', today] }, { kv: ['Discard', inDays(28)] }] },
    narrow: { rows: [{ cols: [{ t: 'Discard', bold: true }, { date: 'DD/MM/YY', offset: 28 }] }] },
  }),
  d('ice-contact', 'In case of emergency', 'Lab and health', 'Name, an emergency contact and medical notes, for a wallet, a helmet or a bag.', BOXY,
    card('IN AN EMERGENCY', [['Name', 'Alex Morgan'], ['Call', 'Sam · 0400 000 000'], ['Medical', 'Asthma'], ['Blood type', 'O+']])),
  d('sharps', 'Sharps', 'Lab and health', 'Marks sharps containers and drawers with blades or needles.', SIGN, sign('syringe', 'SHARPS', 'Do not reach in', 'warn')),
  d('equipment-loan-health', 'Mobility aid loan', 'Lab and health', 'Item number, the date of the loan and the return date.', CARD, card('ON LOAN', [['Item', 'Crutches C-08'], ['Lent', today], ['Return by', inDays(42)]])),
  d('sample-chain', 'Sample with time', 'Lab and health', 'Sample number as a barcode, with the date and time of collection.', [[50, 30], [40, 30], [50, 20], [40, 20]], {
    base: { align: 'left', rows: [{ cols: [{ serial: { prefix: 'S-', digits: 5 }, bold: true }, { date: 'DD/MM/YY HH:mm', align: 'right' }] }, { code: 'code128', value: 'S-{{index:5}}', weight: 1.8 }] },
  }),
];

// ---------- School and events ----------

const SCHOOL: TemplateDesign[] = [
  d('uniform-name', 'Uniform name tape', 'School and events', 'Name and class on a thin strip, for clothing labels and shoes.', NARROW, lines('Charlie Morgan', 'Class 3B')),
  d('exercise-book', 'Exercise book', 'School and events', 'Name, subject, class and year in a frame.', [[50, 30], [60, 40], [70, 40], [80, 50]], {
    base: { frame: 'double', align: 'left', rows: [{ kv: ['Name', 'Charlie Morgan'] }, { kv: ['Subject', 'Mathematics'] }, { kv: ['Class', '3B'] }, { kv: ['Year', '2026'] }] },
  }),
  d('locker', 'Locker number', 'School and events', 'Locker number in a black block with the name.', [...NARROW_SHORT, ...SMALL], {
    base: { side: { block: '214', width: 0.36 }, rows: [{ t: 'Charlie Morgan', bold: true }, { t: 'Class 3B' }], gap: 0.2 },
    narrow: { side: { block: '214', width: 0.36 }, rows: [{ t: 'C. Morgan', bold: true }] },
  }),
  d('place-card', 'Place card', 'School and events', 'Guest name with the table number.', [[50, 30], [60, 40], [70, 40], [50, 20]], {
    base: { frame: 'corners', rows: [{ t: 'Alex Morgan', bold: true, weight: 1.6 }, { t: 'Table 4' }] },
  }),
  d('timetable', 'Timetable', 'School and events', 'A small table of the lessons for each day.', [[70, 40], [60, 40], [80, 50], [100, 100]], {
    base: { rows: [{ table: [['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'], ['1', 'Maths', 'English', 'Science', 'Maths', 'Art'], ['2', 'English', 'Maths', 'Sport', 'History', 'Music'], ['3', 'Science', 'Art', 'Maths', 'English', 'Sport']], colRatios: [0.5, 1, 1, 1, 1, 1], align: 'center' }] },
  }),
  d('library-spine', 'Library spine label', 'School and events', 'Collection code, call number and author letters in three lines.', [[30, 15], [30, 20], [22, 12], [20, 20], [21, 21]], {
    base: { rows: [{ t: 'FIC', bold: true }, { t: '823.9' }, { t: 'MOR', bold: true }], gap: 0.1 },
    narrow: { rows: [{ t: 'FIC', bold: true }, { t: 'MOR', bold: true }], gap: 0.1 },
  }),
  d('due-date', 'Library due date', 'School and events', 'The date of the loan and the due date, three weeks later.', [...SMALL, [40, 30], [50, 30]], card('DUE BACK', [['Borrowed', today], ['Due', inDays(21)]])),
  d('child-allergy', 'Child allergy alert', 'School and events', 'Name of the child and the allergy, for lunchboxes and bags.', SIGN, sign('attention', 'ALLERGY: NUTS', 'Charlie Morgan · 3B', 'ban')),
  d('staff-badge', 'Staff or crew badge', 'School and events', 'Role in a black bar with the name under it.', [[50, 30], [60, 40], [70, 40], [50, 20], [40, 20]], {
    base: { rows: [{ t: 'CREW', invert: true, bold: true, align: 'center', spacing: 200, weight: 1.2 }, { t: 'Alex Morgan', bold: true, weight: 1.5 }, { t: 'Stage and sound' }] },
    small: { rows: [{ t: 'CREW', invert: true, bold: true, align: 'center', spacing: 200 }, { t: 'Alex Morgan', bold: true }], gap: 0.3 },
  }),
  d('cloakroom', 'Cloakroom ticket', 'School and events', 'The same number two times with a line to cut along. One half goes on the item and one to the guest.', [[50, 30], [50, 20], [40, 20], [60, 40], [75, 12], [50, 15]], {
    base: { frame: 'dash', rows: [{ cols: [{ serial: { digits: 3 }, bold: true }, { serial: { digits: 3 }, bold: true }], gap: 4 }] },
    narrow: { rows: [{ cols: [{ serial: { digits: 3 }, bold: true }, { serial: { digits: 3 }, bold: true }], gap: 4 }] },
  }),
  d('race-number', 'Race or competitor number', 'School and events', 'Event name over a large number that counts up.', [[80, 50], [100, 100], [70, 40], [60, 40], [50, 50]], {
    base: { rows: [{ t: 'SCHOOL FUN RUN 2026', invert: true, bold: true, align: 'center', spacing: 60, weight: 0.8 }, { serial: { digits: 3 }, bold: true, weight: 3 }, { t: '5 km' , weight: 0.6 }] },
  }),
  d('drink-token', 'Drink token', 'School and events', 'A round or small token for one drink, with a number.', [...ROUND, [40, 20], [50, 20]], {
    base: { frame: 'dash', side: { icon: 'cocktail' }, rows: [{ t: 'ONE DRINK', bold: true, weight: 1.3 }, { serial: { prefix: 'No. ', digits: 3 } }] },
    round: { frame: 'bold', rows: [{ icon: 'cocktail', weight: 1.6 }, { t: 'ONE DRINK', bold: true }, { serial: { digits: 3 }, weight: 0.8 }] },
  }),
  d('check-in-qr', 'Event check-in QR code', 'School and events', 'A QR code to check in, with the event name and the session.', [[50, 30], [60, 40], [70, 40], [50, 50], ...TALL], coded('qr', 'https://events.example.com/checkin/26-041', 'Check in here', 'Open day 2026', 'Hall B · 9:00 am')),
  d('exam-desk', 'Exam desk', 'School and events', 'Candidate number as a barcode, with the name and the seat.', [[50, 30], [60, 40], [70, 40]], {
    base: { align: 'left', rows: [{ cols: [{ t: 'Charlie Morgan', bold: true }, { t: 'Seat C14', bold: true, align: 'right' }], ratios: [1.6, 1] }, { code: 'code128', value: '26004412', weight: 1.8 }] },
  }),
  d('stall-number', 'Stall or site number', 'School and events', 'Site number in a black block with the name of the stall holder.', [[50, 30], [60, 40], [70, 40], [80, 50], [50, 20]], {
    base: { side: { block: '27', width: 0.34 }, rows: [{ t: 'Bramble Soap Co.', bold: true, weight: 1.3 }, { t: 'Row C · powered site' }] },
  }),
  d('lost-and-found', 'Found item', 'School and events', 'The date and the place that an item was found, for a lost property box.', CARD, card('FOUND', [['Date', today], ['Where', ''], ['Item', '']])),
];

// ---------- Garden and pets ----------

const GARDEN: TemplateDesign[] = [
  d('saved-seeds', 'Saved seeds', 'Garden and pets', 'Plant, variety, the date of collection and the season to sow.', CARD, card('SEEDS', [['Plant', 'Tomato'], ['Variety', 'Black Krim'], ['Collected', { date: 'MMM YYYY' }], ['Sow', 'Spring']])),
  d('seed-tray', 'Seed tray', 'Garden and pets', 'Plant and variety with the date sown.', NARROW, {
    base: { rows: [{ t: 'Tomato · Roma', bold: true, weight: 1.3 }, { cols: [{ t: 'Sown' }, { date: 'DD/MM/YY', bold: true }] }], gap: 0.2 },
  }),
  d('plant-care', 'Plant care card', 'Garden and pets', 'Plant name with the light, water and feed that it needs.', [[50, 30], [60, 40], [70, 40], [50, 50], [80, 50]], {
    base: { side: { icon: 'seedling' }, rows: [{ t: 'Monstera', bold: true, weight: 1.5 }, { kv: ['Light', 'Bright, indirect'] }, { kv: ['Water', 'When top is dry'] }, { kv: ['Feed', 'Each month'] }] },
  }),
  d('row-marker', 'Garden row marker', 'Garden and pets', 'Crop name with the date sown and the weeks to harvest.', STRIP, iconLines('seedling', 'Carrots', 'Sown 12 Sep', 'Harvest in 10 weeks')),
  d('fertiliser-mix', 'Fertiliser or spray mix', 'Garden and pets', 'Product, mix rate and the date mixed.', CARD, card('SEAWEED TONIC', [['Mix rate', '10 mL per 9 L'], ['Mixed', today], ['Use on', 'Vegetables']])),
  d('tree-planted', 'Tree planted', 'Garden and pets', 'Tree name, variety and the date planted.', WIDE, {
    base: { side: { icon: 'tree' }, rows: [{ t: 'Lemon · Eureka', bold: true, weight: 1.5 }, { kv: ['Planted', { date: 'D MMM YYYY' }] }, { t: 'Dwarf rootstock' }] },
    small: { side: { icon: 'tree' }, rows: [{ t: 'Lemon · Eureka', bold: true, weight: 1.4 }, { kv: ['Planted', { date: 'D MMM YYYY' }] }] },
  }),
  d('nursery-price', 'Plant price tag', 'Garden and pets', 'Plant name, pot size and price in a tag shape.', [[50, 30], [40, 30], [60, 40], [50, 20], [40, 20]], {
    base: { frame: 'tag', rows: [{ t: 'Lavender', bold: true, weight: 1.4 }, { t: '140 mm pot · full sun' }, { t: '$12.00', bold: true, weight: 1.3 }] },
    small: { frame: 'tag', rows: [{ t: 'Lavender', bold: true }, { t: '$12.00', bold: true }], gap: 0.2 },
  }),
  d('sprayed', 'Sprayed area', 'Garden and pets', 'The date of spraying and the date until which to keep off.', CARD, {
    base: { bands: 'stripes', align: 'left', rows: [{ t: 'SPRAYED', bold: true, align: 'center', weight: 1.4 }, { kv: ['Date', today] }, { kv: ['Keep off until', inDays(1)] }] },
    small: { bands: 'stripes', rows: [{ t: 'SPRAYED', bold: true }, { date: 'DD/MM/YYYY' }] },
  }),
  d('hive-record', 'Beehive record', 'Garden and pets', 'Hive number, the year of the queen and the date of the last inspection.', CARD, card('HIVE 3', [['Queen', '2025 · marked'], ['Inspected', today], ['Notes', '']])),
  d('pet-id', 'Pet ID tag', 'Garden and pets', 'Pet name and a phone number, for carriers, leads and kennels.', [...STRIP, [40, 30], [50, 30]], {
    base: { side: { pic: 'paw' }, rows: [{ t: 'Biscuit', bold: true, weight: 1.5 }, { t: 'If found, call' }, { t: '0400 000 000', bold: true }] },
    small: { side: { pic: 'paw' }, rows: [{ t: 'Biscuit', bold: true, weight: 1.3 }, { t: '0400 000 000' }], gap: 0.2 },
  }),
  d('pet-food-tub', 'Pet food tub', 'Garden and pets', 'Food name, the amount for each meal and the date that the bag was opened.', WIDE, {
    base: { side: { icon: 'dog' }, rows: [{ t: 'Dog food', bold: true, weight: 1.4 }, { t: '2 scoops each meal' }, { kv: ['Opened', today] }] },
    small: { side: { icon: 'dog' }, rows: [{ t: 'Dog food', bold: true, weight: 1.3 }, { t: '2 scoops each meal' }] },
  }),
  d('pet-medicine', 'Pet medicine', 'Garden and pets', 'Pet name, the medicine, the dose and the end date. Follow the instructions from your vet.', CARD, card('BISCUIT', [['Medicine', 'Name 50 mg'], ['Dose', '1 tablet, twice a day'], ['Until', inDays(10)]])),
  d('aquarium-log', 'Aquarium water change', 'Garden and pets', 'Date of the last water change and the next date, 14 days later.', CARD, card('AQUARIUM', [['Water changed', today], ['Change next', inDays(14)], ['Filter cleaned', '']])),
  d('fed-today', 'Pet fed today', 'Garden and pets', 'Boxes to tick for the morning and the evening meal, so that the pet does not get two dinners.', [...SMALL, [40, 30], [50, 30], [50, 15], [75, 12]], {
    base: { align: 'left', rows: [{ t: 'Biscuit fed?', bold: true }, { ticks: ['Morning', 'Evening'] }] },
    narrow: { align: 'left', rows: [{ cols: [{ t: 'Fed?', bold: true }, { ticks: ['AM', 'PM'] }], ratios: [1, 2] }] },
  }),
  d('kennel-card', 'Kennel or boarding card', 'Garden and pets', 'Pet name, owner, food and medicine notes.', [[50, 30], [60, 40], [70, 40], [50, 50], [80, 50]], card('BISCUIT', [['Owner', 'A. Morgan · 0400 000 000'], ['Food', '2 scoops, twice a day'], ['Medicine', 'None'], ['Collect', inDays(7)]])),
  d('vaccination', 'Vaccination due', 'Garden and pets', 'The date of the last vaccination and the due date, 12 months later.', CARD, card('VACCINATION', [['Given', today], ['Due', inDays(365)]])),
  d('tack-name', 'Tack and rug name', 'Garden and pets', 'Horse name and owner on a thin strip, for bridles, rugs and feed bins.', NARROW, lines('Bramble', 'A. Morgan')),
  d('pool-test', 'Pool water test', 'Garden and pets', 'Date of the test with lines for the pH and the chlorine level.', CARD, card('POOL TEST', [['Date', today], ['pH', ''], ['Chlorine', '']])),
  d('bulbs-stored', 'Stored bulbs and tubers', 'Garden and pets', 'Plant, colour, the date lifted and the month to plant again.', CARD, card('DAHLIA', [['Colour', 'Café au Lait'], ['Lifted', { date: 'MMM YYYY' }], ['Plant again', 'October']])),
  d('beware-dog', 'Dog on premises', 'Garden and pets', 'A sign for gates and doors.', SIGN, {
    base: { frame: 'bold', side: { pic: 'paw' }, rows: [{ t: 'DOG IN YARD', bold: true, weight: 1.5 }, { t: 'Please close the gate' }] },
    small: { side: { pic: 'paw' }, rows: [{ t: 'DOG IN YARD', bold: true, weight: 1.4 }, { t: 'Please close the gate' }] },
    narrow: { side: { pic: 'paw' }, rows: [{ t: 'DOG IN YARD', bold: true }] },
  }),
  d('eggs-collected', 'Eggs collected', 'Garden and pets', 'The date that the eggs were collected, for cartons.', [...SMALL, ...NARROW_SHORT], {
    base: { side: { icon: 'egg' }, rows: [{ t: 'Collected', weight: 0.8 }, { date: 'ddd D MMM', bold: true }], gap: 0.2 },
  }),
];

// ---------- Hobbies and collections ----------

const HOBBY: TemplateDesign[] = [
  d('filament', '3D printer filament', 'Hobbies and collections', 'Material, colour, print temperatures and the date that the spool was opened.', CARD, card('PETG', [['Colour', 'Signal orange'], ['Nozzle / bed', '240 °C / 80 °C'], ['Opened', today], ['Dried', '']])),
  d('film-roll', 'Film roll', 'Hobbies and collections', 'Film stock, the camera and the month it was shot.', [...NARROW_SHORT, ...SMALL], {
    base: { rows: [{ t: 'Portra 400', bold: true, weight: 1.3 }, { cols: [{ t: 'Pentax K1000' }, { date: 'MM/YYYY', align: 'right' }], ratios: [1.6, 1] }], gap: 0.2 },
  }),
  d('record-sleeve', 'Record sleeve', 'Hobbies and collections', 'Artist, title, pressing and grade, for record collections.', CARD, card('LP', [['Artist', 'The Example Band'], ['Title', 'First Album'], ['Pressing', '1974 · AU'], ['Grade', 'VG+ / VG']])),
  d('card-grade', 'Trading card details', 'Hobbies and collections', 'Set, card number and condition, for sleeves and boxes.', [...NARROW_SHORT, ...SMALL], lines('Base set · 58/102', 'Near mint')),
  d('yarn-band', 'Yarn band', 'Hobbies and collections', 'Fibre, weight, dye lot and needle size.', CARD, card('MERINO', [['Weight', '8 ply · 100 g'], ['Dye lot', '4471'], ['Needles', '4 mm']])),
  d('fabric-bolt', 'Fabric details', 'Hobbies and collections', 'Fibre, width, length and whether it has been washed.', CARD, {
    base: { align: 'left', rows: [{ t: 'Linen · natural', bold: true, weight: 1.2 }, { kv: ['Width', '140 cm'] }, { kv: ['Length', '2.5 m'] }, { ticks: ['Pre-washed'] }] },
    small: { align: 'left', rows: [{ t: 'Linen · natural', bold: true }, { t: '140 cm wide · 2.5 m' }] },
  }),
  d('model-paint', 'Model paint', 'Hobbies and collections', 'Colour name and number on a thin strip or a round lid label.', [...NARROW_SHORT, [20, 20], [21, 21]], {
    base: { rows: [{ t: 'XF-63', bold: true, weight: 1.3 }, { t: 'German grey' }], gap: 0.1 },
  }),
  d('brew-log', 'Home brew batch', 'Hobbies and collections', 'Style, batch number, the date brewed and the gravity readings.', CARD, card('BATCH 14', [['Style', 'Pale ale'], ['Brewed', today], ['OG / FG', '1.050 / 1.010'], ['Bottled', '']])),
  d('ferment', 'Ferment jar', 'Hobbies and collections', 'Contents, the start date and the date to taste, 14 days later.', [...SMALL, [40, 30], [50, 30]], card('SAUERKRAUT', [['Started', today], ['Taste on', inDays(14)]])),
  d('memory-card', 'Memory card', 'Hobbies and collections', 'Card number and size, for card cases.', [[22, 12], [30, 12], [30, 15], [20, 20]], lines('Card 3', '64 GB')),
  d('gear-owner', 'Gear owner', 'Hobbies and collections', 'Name and phone number for cameras, cases and instruments.', STRIP, iconLines('camera', 'Alex Morgan', '0400 000 000')),
  d('game-box', 'Board game box', 'Hobbies and collections', 'Player count, play time and boxes to tick after a check of the parts.', CARD, {
    base: { align: 'left', rows: [{ t: '2–4 players · 45 min', bold: true }, { kv: ['Checked', today] }, { ticks: ['Complete', 'Parts missing'] }] },
    small: { align: 'left', rows: [{ t: '2–4 players · 45 min', bold: true }, { ticks: ['Complete', 'Parts missing'] }] },
  }),
  d('coin-holder', 'Coin or stamp holder', 'Hobbies and collections', 'Country, year, denomination and grade.', [...SMALL, [40, 30], [30, 20]], lines('Australia 1966', '50 cents · round', 'Grade: EF')),
  d('collection-specimen', 'Collection specimen', 'Hobbies and collections', 'Species, the place, the date and the collector, for shells, rocks, insects and plants.', CARD, card('No. 0142', [['Species', 'Quartz, smoky'], ['Place', 'Mount Example'], ['Date', today], ['Collector', 'A. Morgan']])),
  d('tackle-box', 'Tackle box', 'Hobbies and collections', 'Contents of each compartment.', NARROW, iconLines('fishing hook', 'Hooks · size 6', 'Long shank')),
  d('bike-service', 'Bike service', 'Hobbies and collections', 'Date of the last service and what was done.', CARD, card('BIKE SERVICE', [['Date', today], ['Chain', 'Replaced'], ['Next', inDays(182)]])),
  d('soap-cure', 'Soap curing rack', 'Hobbies and collections', 'Batch, the date poured and the date that the soap is ready, 28 days later.', CARD, card('LAVENDER & OAT', [['Batch', '22'], ['Poured', today], ['Ready', inDays(28)]])),
  d('glaze-test', 'Glaze test tile', 'Hobbies and collections', 'Glaze, clay body and firing cone.', [...SMALL, [40, 30], ...NARROW_SHORT], lines('Celadon · 2 coats', 'Porcelain · cone 6', 'Oxidation')),
  d('artwork-card', 'Artwork card', 'Hobbies and collections', 'Title, artist, year, medium and price, like a gallery wall card.', [[60, 40], [70, 40], [50, 30], [80, 50]], {
    base: { align: 'left', rows: [{ t: 'Morning on the river', bold: true, weight: 1.4 }, { t: 'Alex Morgan, 2026' }, { t: 'Oil on board, 40 × 30 cm' }, { t: '$480' }] },
  }),
  d('project-bag', 'Project bag', 'Hobbies and collections', 'Project name, pattern, the start date and notes.', CARD, card('CARDIGAN', [['Pattern', 'Harbour, size 3'], ['Started', today], ['Needles', '4 mm · 80 cm']])),
  d('battery-cycles', 'Rechargeable pack record', 'Hobbies and collections', 'Pack number, cell count, capacity and the date of purchase, for model and drone batteries.', [...SMALL, [40, 30], [30, 12], [30, 14], [30, 15], [40, 12]], {
    base: { side: { block: '4', width: 0.24 }, rows: [{ t: '4S · 1500 mAh', bold: true, weight: 1.3 }, { t: 'Bought 03/2026' }], gap: 0.2 },
  }),
  d('photo-back', 'Photo details', 'Hobbies and collections', 'Who, where and when, for the back of a print.', [...SMALL, [50, 30], [40, 30]], {
    base: { align: 'left', rows: [{ kv: ['Who', ''] }, { kv: ['Where', ''] }, { kv: ['When', { date: 'MMM YYYY' }] }] },
    small: { align: 'left', rows: [{ kv: ['Who', ''] }, { kv: ['When', { date: 'MMM YYYY' }] }] },
  }),
  d('cellar-tag', 'Cellar tag', 'Hobbies and collections', 'Wine, vintage and the years to drink it, in a tag shape for the bottle neck.', [[50, 30], [40, 30], [50, 20], [40, 20]], {
    base: { frame: 'tag', rows: [{ t: 'Shiraz 2022', bold: true, weight: 1.4 }, { t: 'Example Estate' }, { t: 'Drink 2028–2035' }] },
    small: { frame: 'tag', rows: [{ t: 'Shiraz 2022', bold: true }, { t: 'Drink 2028–2035' }], gap: 0.2 },
  }),
];

// ---------- Travel and vehicles ----------

const TRAVEL: TemplateDesign[] = [
  d('luggage-tag', 'Luggage tag', 'Travel and vehicles', 'Name, phone number and email address in a tag shape.', [[50, 30], [60, 40], [70, 40], [50, 20]], {
    base: { frame: 'tag', align: 'left', rows: [{ t: 'Alex Morgan', bold: true, weight: 1.4 }, { t: '+61 400 000 000' }, { t: 'alex@example.com' }] },
    small: { frame: 'tag', align: 'left', rows: [{ t: 'Alex Morgan', bold: true }, { t: '+61 400 000 000' }], gap: 0.2 },
  }),
  d('next-service', 'Next vehicle service', 'Travel and vehicles', 'The date of the last service, the next date (six months later) and the odometer reading.', CARD, card('NEXT SERVICE', [['Serviced', today], ['Due', inDays(182)], ['or at', '85 000 km']])),
  d('tyre-storage', 'Stored tyre position', 'Travel and vehicles', 'Boxes to tick for the wheel position, with the vehicle and the tread depth.', CARD, {
    base: { align: 'left', rows: [{ t: 'Wagon · winter set', bold: true }, { ticks: ['FL', 'FR', 'RL', 'RR'] }, { kv: ['Tread mm', ''] }] },
    small: { align: 'left', rows: [{ t: 'Wagon · winter set', bold: true }, { ticks: ['FL', 'FR', 'RL', 'RR'] }] },
  }),
  d('parking-permit', 'Parking permit', 'Travel and vehicles', 'Permit number in a black block, with the registration and the expiry date.', [[50, 30], [60, 40], [70, 40], [50, 20]], {
    base: { side: { block: 'P\n042', width: 0.34 }, rows: [{ t: 'PERMIT', bold: true }, { t: 'Rego 123 ABC' }, { kv: ['Expires', inDays(365)] }] },
    small: { side: { block: 'P 042', width: 0.36 }, rows: [{ t: 'Rego 123 ABC', bold: true }, { date: 'DD/MM/YYYY', offset: 365 }], gap: 0.2 },
  }),
  d('fuel-type', 'Fuel type', 'Travel and vehicles', 'Fuel reminder for the filler cap.', SIGN, sign('fuel', 'DIESEL ONLY', '', 'ban')),
  d('tyre-pressure', 'Tyre pressures', 'Travel and vehicles', 'Table of front and rear pressures for a normal and a full load.', [[50, 30], [60, 40], [70, 40], [40, 30]], {
    base: { rows: [{ table: [['kPa', 'Front', 'Rear'], ['Normal', '230', '230'], ['Full load', '250', '280']], align: 'center' }] },
  }),
  d('key-fob', 'Vehicle key', 'Travel and vehicles', 'Registration and vehicle name, for a key cabinet.', NARROW, iconLines('car', '123 ABC', 'White van'))  ,
  d('bike-owner', 'Bike owner', 'Travel and vehicles', 'Name and phone number, to put under the top tube or the seat.', NARROW, iconLines('bike', 'Alex Morgan', '0400 000 000')),
  d('trailer-details', 'Trailer details', 'Travel and vehicles', 'Tare weight, maximum load and tyre pressure.', CARD, card('TRAILER', [['Tare', '280 kg'], ['Max load', '470 kg'], ['Tyres', '310 kPa']])),
  d('boat-safety', 'Safety gear check', 'Travel and vehicles', 'The date that the safety gear was checked and the expiry dates of the flares and the beacon.', CARD, card('SAFETY GEAR', [['Checked', today], ['Flares expire', inDays(1095)], ['Beacon battery', inDays(1825)]])),
  d('travel-bottle', 'Travel bottle', 'Travel and vehicles', 'Contents on a thin strip, for small bottles and jars.', NARROW_SHORT, lines('Shampoo')),
  d('trip-qr', 'Trip details QR code', 'Travel and vehicles', 'A QR code with the booking details, to put inside a bag.', WIDE, coded('qr', 'Alex Morgan · +61 400 000 000 · Hotel Example, 1 Example St, Sydney · 12–19 March', 'If found', 'Scan for my contact', 'and travel details')),
  d('helmet-id', 'Helmet ID', 'Travel and vehicles', 'Name, an emergency phone number and the blood type, for the inside of a helmet.', [...SMALL, [40, 30], [50, 30]], card('RIDER', [['Name', 'Alex Morgan'], ['Emergency', '0400 000 000'], ['Blood type', 'O+']])),
  d('ski-id', 'Ski and board ID', 'Travel and vehicles', 'Name and phone number on a thin strip.', NARROW, iconLines('snowy mountain', 'Alex Morgan', '0400 000 000')),
  d('camping-box', 'Camping box', 'Travel and vehicles', 'Box name with a short list of what is inside.', ANY, iconLines('tent', 'Kitchen kit', 'Stove, gas, pans, plates', 'Check gas before each trip')),
  d('registration-due', 'Registration due', 'Travel and vehicles', 'The registration number and the date that it is due.', [...SMALL, [40, 30], [50, 30]], card('REGISTRATION', [['Rego', '123 ABC'], ['Due', inDays(365)]])),
  d('oil-change', 'Oil change sticker', 'Travel and vehicles', 'Oil grade, the date of the change and the odometer reading for the next change.', [[50, 30], [40, 30], [50, 50], [40, 40]], card('OIL CHANGE', [['Oil', '5W-30'], ['Date', today], ['Next at', '95 000 km']])),
  d('child-seat', 'Child seat details', 'Travel and vehicles', 'The date of manufacture and the date to stop using the seat.', CARD, card('CHILD SEAT', [['Made', '03/2024'], ['Do not use after', '03/2034'], ['Fitted', today]])),
  d('roof-load', 'Roof load limit', 'Travel and vehicles', 'A reminder of the roof load and the vehicle height with a roof box.', SIGN, sign('car', 'HEIGHT 2.1 m', 'Roof load 75 kg max', 'warn')),
  d('charger-voltage', 'Travel charger', 'Travel and vehicles', 'Owner name and the device, so that chargers come home again.', NARROW, iconLines('plug', 'Alex · laptop', '65 W USB-C')),
];

// ---------- Safety and signs ----------

type SignDef = [id: string, name: string, description: string, icon: string, word: string, sub: string, style: 'plain' | 'warn' | 'ban' | 'info'];

const SIGN_DEFS: SignDef[] = [
  ['no-smoking', 'No smoking', 'No smoking or vaping.', 'no smoking', 'NO SMOKING', 'or vaping', 'ban'],
  ['fire-extinguisher', 'Fire extinguisher', 'Marks the place of a fire extinguisher, with the type.', 'fire extinguisher', 'FIRE EXTINGUISHER', 'Dry powder', 'info'],
  ['first-aid-sign', 'First aid', 'Marks the place of a first aid kit.', 'first aid', 'FIRST AID', 'Kit in this cupboard', 'info'],
  ['defibrillator', 'Defibrillator', 'Marks the place of a defibrillator.', 'heart rate', 'AED', 'Defibrillator', 'info'],
  ['exit', 'Exit', 'Shows the way out.', 'open door', 'EXIT', '', 'info'],
  ['assembly-point', 'Assembly point', 'Where people meet after an evacuation.', 'people', 'ASSEMBLY POINT', 'Car park B', 'info'],
  ['wet-floor', 'Wet floor', 'Slip warning for a wet or a polished floor.', 'liquid', 'CAUTION', 'Wet floor', 'warn'],
  ['cctv', 'Camera surveillance', 'Tells visitors that cameras record the area.', 'camera surveillance', 'CCTV IN USE', 'This area is recorded', 'plain'],
  ['hearing-protection', 'Hearing protection', 'Hearing protection is necessary in the area.', 'hearing protection', 'HEARING PROTECTION', 'Must be worn', 'info'],
  ['eye-protection', 'Eye protection', 'Eye protection is necessary in the area.', 'eye protection', 'EYE PROTECTION', 'Must be worn', 'info'],
  ['hard-hat', 'Hard hat area', 'Head protection is necessary in the area.', 'hard hat', 'HARD HAT AREA', '', 'info'],
  ['authorised-only', 'Authorised persons only', 'Keeps people out of plant rooms and stores.', 'not allowed', 'NO ENTRY', 'Authorised persons only', 'ban'],
  ['staff-only', 'Staff only', 'For doors that are not for the public.', 'id card', 'STAFF ONLY', '', 'plain'],
  ['private', 'Private', 'For doors and gates.', 'lock', 'PRIVATE', 'No public access', 'plain'],
  ['keep-clear', 'Keep clear', 'For doors, switchboards and exits that must stay free.', 'attention', 'KEEP CLEAR', 'Do not block', 'warn'],
  ['fire-door', 'Fire door', 'Reminder to keep a fire door closed.', 'door', 'FIRE DOOR', 'Keep closed', 'info'],
  ['mind-step', 'Mind the step', 'Trip warning for a step or a ramp.', 'walkway', 'MIND THE STEP', '', 'warn'],
  ['mind-head', 'Low headroom', 'Warning for a low beam or a low door.', 'attention', 'MIND YOUR HEAD', 'Low headroom', 'warn'],
  ['hot-water', 'Hot water', 'Scald warning for taps and urns.', 'keep away from heat', 'CAUTION', 'Very hot water', 'warn'],
  ['hot-surface', 'Hot surface', 'Burn warning for ovens, pipes and tools.', 'flammable', 'HOT SURFACE', 'Do not touch', 'warn'],
  ['not-drinking-water', 'Not drinking water', 'For taps with water that is not safe to drink.', 'water', 'NOT DRINKING WATER', '', 'ban'],
  ['drinking-water', 'Drinking water', 'For taps with water that is safe to drink.', 'water', 'DRINKING WATER', '', 'info'],
  ['wash-hands', 'Wash your hands', 'Reminder at sinks and kitchen doors.', 'hand', 'WASH YOUR HANDS', 'Soap, 20 seconds', 'plain'],
  ['push', 'Push', 'For doors.', 'big arrow up', 'PUSH', '', 'plain'],
  ['pull', 'Pull', 'For doors.', 'big arrow down', 'PULL', '', 'plain'],
  ['toilet', 'Toilet', 'Direction sign for a toilet.', 'toilet', 'TOILET', '', 'plain'],
  ['accessible', 'Accessible entry', 'Marks an accessible entry or toilet.', 'accessible', 'ACCESSIBLE ENTRY', '', 'info'],
  ['baby-change', 'Baby change', 'Marks a room with a change table.', 'baby', 'BABY CHANGE', '', 'plain'],
  ['no-junk-mail', 'No junk mail', 'For letterboxes.', 'mail', 'NO JUNK MAIL', 'Thank you', 'plain'],
  ['deliveries', 'Deliveries', 'Tells couriers where to leave parcels.', 'package', 'DELIVERIES', 'Leave at the side door', 'plain'],
  ['ring-bell', 'Ring the bell', 'For a door or a counter.', 'bell', 'PLEASE RING', 'for service', 'plain'],
  ['shoes-off', 'Shoes off', 'For an entry.', 'walkway', 'SHOES OFF', 'please', 'plain'],
  ['quiet', 'Quiet please', 'For libraries, studios and rooms with a sleeping baby.', 'quiet', 'QUIET PLEASE', '', 'plain'],
  ['lights-off', 'Switch off the lights', 'Reminder at a light switch.', 'light', 'LIGHTS OFF', 'when you leave', 'plain'],
  ['close-door', 'Close the door', 'For doors that must stay closed.', 'door', 'CLOSE THE DOOR', 'Air conditioning is on', 'plain'],
  ['flammable-store', 'Flammable store', 'For cabinets and rooms with flammable liquids.', 'flammable', 'FLAMMABLE', 'No naked flames', 'warn'],
  ['chemical-store', 'Chemical store', 'For cabinets with cleaning products and chemicals.', 'flask', 'CHEMICALS', 'Keep locked', 'warn'],
  ['high-voltage-sign', 'High voltage', 'For switch rooms and electrical enclosures.', 'high voltage', 'HIGH VOLTAGE', 'Keep out', 'warn'],
  ['no-parking', 'No parking', 'For driveways and loading areas.', 'parking', 'NO PARKING', 'Driveway in use', 'ban'],
  ['reserved-parking', 'Reserved parking', 'Marks a parking bay for one person or one unit.', 'parking', 'RESERVED', 'Unit 4', 'plain'],
  ['slippery', 'Slippery surface', 'Slip warning for ramps, decks and paths.', 'walkway', 'SLIPPERY', 'when wet', 'warn'],
  ['out-of-order', 'Out of order', 'For machines, lifts and toilets that do not work.', 'cross in circle', 'OUT OF ORDER', 'Sorry for the trouble', 'plain'],
  ['wet-paint', 'Wet paint', 'For doors, rails and benches.', 'paintbrush', 'WET PAINT', 'Do not touch', 'warn'],
  ['no-phones', 'No phones', 'For meeting rooms, theatres and exam rooms.', 'smartphone', 'NO PHONES', 'Switch to silent', 'ban'],
  ['no-food-drink', 'No food or drink', 'For laboratories, server rooms and studios.', 'soft drink', 'NO FOOD OR DRINK', '', 'ban'],
  ['eyewash', 'Eyewash station', 'Marks the place of an eyewash bottle or station.', 'eye protection', 'EYEWASH', 'Station', 'info'],
  ['gas-cylinders', 'Gas cylinders', 'For a cylinder store.', 'flammable', 'GAS CYLINDERS', 'Secure upright', 'warn'],
  ['forklift-area', 'Forklifts in use', 'Warning for a warehouse or a yard.', 'forklift', 'FORKLIFTS', 'Keep to the walkway', 'warn'],
  ['speed-limit', 'Speed limit', 'For car parks and yards.', 'gauge', '10 km/h', 'Speed limit', 'ban'],
  ['recycling-station', 'Recycling station', 'For a shared recycling area.', 'recycle', 'RECYCLING', 'Bottles, cans, paper', 'info'],
  ['general-waste', 'General waste', 'For a waste bin.', 'bin', 'GENERAL WASTE', 'No recycling', 'plain'],
  ['fragile-roof', 'Do not climb', 'For shelves, racks and roofs that are not safe to climb.', 'not allowed', 'DO NOT CLIMB', '', 'ban'],
  ['this-door', 'Use other door', 'Sends people to a different entry.', 'big arrow right', 'USE OTHER DOOR', '', 'plain'],
  ['wifi-sign', 'Free Wi-Fi', 'Tells guests that Wi-Fi is available and where to ask.', 'wifi', 'FREE WI-FI', 'Ask at the counter', 'plain'],
];

const SAFETY: TemplateDesign[] = SIGN_DEFS.map(([id, name, description, icon, word, sub, style]) => d(id, name, 'Safety and signs', description, SIGN, sign(icon, word, sub, style)));

export const PRACTICAL: TemplateDesign[] = [...IT, ...NETWORK, ...OFFICE, ...HOME, ...FOOD, ...RETAIL, ...SHIPPING, ...WORKSHOP, ...LAB, ...SCHOOL, ...GARDEN, ...HOBBY, ...TRAVEL, ...SAFETY];

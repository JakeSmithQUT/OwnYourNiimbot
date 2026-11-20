// Decorative templates for celebrations, seasons and gifts. They use the
// fonts that ship with the app and the vector ornaments.

import { MEDIUM, ROUND, SMALL, TALL, type Size, type TemplateDesign } from './kit';
import { design as d } from './compose';
import { F } from './presets';

const C = 'Celebrations and seasons';
const TAG: Size[] = [[50, 30], [40, 30], [60, 40], [70, 40], [50, 50]];
const TAG_TALL: Size[] = [...TAG, ...TALL];
const ROUND_L: Size[] = [[31, 31], [34, 34], [50, 50]];
const STICKER: Size[] = [...ROUND_L, [50, 30], [40, 30]];
const to = { kv: ['To', ''] as [string, string], font: F.serif, italic: true };
const from = { kv: ['From', ''] as [string, string], font: F.serif, italic: true };

export const OCCASIONS: TemplateDesign[] = [
  // ---------- Christmas and the end of the year ----------
  d('xmas-tag', 'Christmas gift tag', C, 'Pine tree, a script greeting and lines for "to" and "from".', TAG_TALL, {
    base: { frame: 'double', side: { pic: 'pine' }, rows: [{ t: 'Merry Christmas', font: F.retro, weight: 1.5, align: 'center' }, to, from] },
    tall: { frame: 'double', rows: [{ pic: 'pine', weight: 2.2 }, { t: 'Merry Christmas', font: F.retro, weight: 1.3 }, to, from] },
  }),
  d('xmas-do-not-open', 'Do not open until Christmas', C, 'Perforated stamp frame with a heavy warning and the date in script.', [...MEDIUM, [50, 20], [40, 20]], {
    base: { frame: 'stamp', rows: [{ t: 'DO NOT OPEN', font: F.heavy, weight: 1.4 }, { t: 'until 25 December', font: F.script, bold: true }] },
    small: { bands: 'stripes', rows: [{ t: 'DO NOT OPEN', font: F.heavy, weight: 1.3 }, { t: 'until 25 December', font: F.script, bold: true }], gap: 0.2 },
  }),
  d('xmas-snow-seal', 'Snowflake seal', C, 'Round black seal with a white snowflake and a greeting, for envelopes and parcels.', ROUND_L, {
    base: { shape: 'disc', rows: [{ pic: 'snowflake', weight: 1.6 }, { t: "Season's", font: F.script, bold: true }, { t: 'GREETINGS', font: F.sans, bold: true, spacing: 120, weight: 0.7 }] },
  }, { round: true }),
  d('xmas-north-pole', 'Special delivery from the North Pole', C, 'A parcel label from the North Pole with the name of the child.', [[50, 30], [60, 40], [70, 40], [80, 50]], {
    base: { frame: 'stamp', rows: [{ t: 'SPECIAL DELIVERY', font: F.bebas, spacing: 160 }, { t: 'from the North Pole', font: F.script, bold: true, weight: 1.2 }, { band: 'stars', span: 0.5 }, { t: 'For Mia', font: F.round, bold: true, weight: 1.4 }] },
  }),
  d('xmas-baking', 'Christmas baking', C, 'Script heading, the name of the treat and a row of stars.', [...TAG, ...ROUND_L], {
    base: { frame: 'dots', rows: [{ t: 'homemade', font: F.script, bold: true }, { t: 'Gingerbread', font: F.fat, weight: 1.6 }, { band: 'stars', span: 0.5 }, { t: 'MERRY CHRISTMAS', font: F.sans, bold: true, spacing: 140, weight: 0.7 }] },
    round: { shape: 'sealOutline', rows: [{ t: 'homemade', font: F.script, bold: true }, { t: 'Gingerbread', font: F.fat, weight: 1.5 }, { band: 'stars', span: 0.6 }] },
  }),
  d('advent-number', 'Advent numbers', C, 'Round seals with a number that counts up. Print 24 labels for an advent calendar.', ROUND, {
    base: { shape: 'seal', rows: [{ serial: { digits: 1 }, font: F.fat }] },
  }, { round: true }),
  d('secret-santa', 'Secret Santa', C, 'Marker heading with a line for the name.', TAG, {
    base: { frame: 'dash', corners: 'snowflake', rows: [{ t: 'Secret Santa', font: F.marker, weight: 1.5 }, { kv: ['For', ''], font: F.hand }, { t: 'no peeking!', font: F.hand, bold: true }] },
  }),
  d('new-year', 'Happy New Year', C, 'Deco frame, a row of stars and the year in tall capitals.', [...TAG, ...ROUND], {
    base: { frame: 'deco', rows: [{ band: 'stars', span: 0.5 }, { t: 'Happy New Year', font: F.retro, weight: 1.5 }, { t: '2027', font: F.bebas, spacing: 300 }] },
    round: { shape: 'ring', rows: [{ t: 'Happy', font: F.retro }, { t: '2027', font: F.bebas, spacing: 200, weight: 1.5 }, { band: 'stars', span: 0.7 }] },
  }),

  // ---------- Through the year ----------
  d('valentine', "Valentine's Day", C, 'Hearts in the corners, a script greeting and a handwritten line.', TAG, {
    base: { corners: 'heart', rows: [{ t: "Happy Valentine's Day", font: F.script, bold: true, weight: 1.4 }, { band: 'hearts', span: 0.4 }, { t: 'with all my love, Sam', font: F.hand, bold: true }] },
  }),
  d('love-seal', 'Heart seal', C, 'Round scalloped seal with a white heart, for envelopes.', ROUND, {
    base: { shape: 'seal', rows: [{ pic: 'heart', weight: 1.5 }, { t: 'with love', font: F.retro }] },
  }, { round: true }),
  d('easter-tag', 'Easter gift tag', C, 'Decorated egg with a rounded greeting.', TAG_TALL, {
    base: { frame: 'dots', side: { pic: 'egg' }, rows: [{ t: 'Happy Easter', font: F.round, bold: true, weight: 1.5, align: 'center' }, { t: 'from the Morgans', font: F.hand, bold: true, align: 'center' }] },
    tall: { frame: 'dots', rows: [{ pic: 'egg', weight: 2.4 }, { t: 'Happy Easter', font: F.round, bold: true, weight: 1.2 }, { t: 'from the Morgans', font: F.hand, bold: true }] },
  }),
  d('egg-hunt-clue', 'Egg hunt clue', C, 'A numbered clue card for an egg hunt or a treasure hunt. The number counts up.', [[50, 30], [60, 40], [70, 40], [40, 30]], {
    base: { frame: 'dash', rows: [{ serial: { prefix: 'CLUE ', digits: 1 }, font: F.bebas, spacing: 160, weight: 1.2 }, { band: 'zigzag', span: 0.6 }, { t: 'Look where the\nflowers grow', font: F.hand, bold: true, weight: 2 }] },
  }),
  d('halloween-treat', 'Halloween treat bag', C, 'Pumpkin, a marker greeting and zigzag bands.', TAG_TALL, {
    base: { bands: 'zigzag', side: { pic: 'pumpkin' }, rows: [{ t: 'Happy Halloween', font: F.marker, weight: 1.4, align: 'center' }, { t: 'trick or treat!', font: F.hand, bold: true, align: 'center' }] },
    tall: { bands: 'zigzag', rows: [{ pic: 'pumpkin', weight: 2.2 }, { t: 'Happy\nHalloween', font: F.marker, weight: 2 }, { t: 'trick or treat!', font: F.hand, bold: true }] },
  }),
  d('halloween-ghost', 'Ghost sticker', C, 'Round sticker with a ghost and one word.', ROUND, {
    base: { frame: 'bold', rows: [{ pic: 'ghost', weight: 1.8 }, { t: 'BOO!', font: F.marker }] },
  }, { round: true }),
  d('mothers-day', "Mother's Day", C, 'Flower, a formal script greeting and a handwritten line.', TAG_TALL, {
    base: { frame: 'double', side: { pic: 'flower' }, rows: [{ t: "Happy Mother's Day", font: F.formal, weight: 1.6, align: 'center' }, { t: 'with love from Mia and Sam', font: F.hand, bold: true, align: 'center' }] },
    tall: { frame: 'double', rows: [{ pic: 'flower', weight: 2 }, { t: "Happy\nMother's Day", font: F.formal, weight: 2.2 }, { t: 'with love from Mia and Sam', font: F.hand, bold: true }] },
  }),
  d('fathers-day', "Father's Day", C, 'Tall capitals between two rows of stars.', TAG, {
    base: { rows: [{ band: 'stars', span: 0.5 }, { t: 'BEST DAD EVER', font: F.bebas, spacing: 80, weight: 1.6 }, { t: "Happy Father's Day", font: F.script, bold: true }, { band: 'stars', span: 0.5 }] },
  }),
  d('harvest-thanks', 'Harvest and thanks', C, 'A script line over a leaf sprig, for autumn tables and gifts.', [...TAG, ...ROUND], {
    base: { frame: 'corners', rows: [{ t: 'Give thanks', font: F.script, bold: true, weight: 1.7 }, { band: 'sprig', span: 0.5 }, { t: 'HARVEST TABLE 2026', font: F.classic, spacing: 120, weight: 0.8 }] },
    round: { frame: 'line', rows: [{ t: 'Give', font: F.script, bold: true }, { t: 'thanks', font: F.script, bold: true }, { band: 'sprig', span: 0.7 }] },
  }),
  d('eid', 'Eid greeting', C, 'Crescent moon with a classical greeting and an italic line.', TAG_TALL, {
    base: { frame: 'double', side: { pic: 'moon' }, rows: [{ t: 'Eid Mubarak', font: F.classic, bold: true, weight: 1.5, align: 'center' }, { t: 'from our family to yours', font: F.serif, italic: true, align: 'center' }] },
    tall: { frame: 'double', rows: [{ pic: 'moon', weight: 2 }, { t: 'Eid Mubarak', font: F.classic, bold: true, weight: 1.3 }, { t: 'from our family to yours', font: F.serif, italic: true }] },
  }),
  d('diwali', 'Diwali greeting', C, 'Rays of light under a heavy serif greeting.', TAG, {
    base: { rows: [{ t: 'Happy Diwali', font: F.fat, weight: 1.5 }, { t: 'FESTIVAL OF LIGHTS', font: F.sans, bold: true, spacing: 140, weight: 0.7 }, { band: 'rays', weight: 1.2 }] },
  }),
  d('hanukkah', 'Hanukkah greeting', C, 'Classical capitals between dotted rules.', TAG, {
    base: { frame: 'line', rows: [{ band: 'dots', span: 0.6 }, { t: 'Happy Hanukkah', font: F.classic, bold: true, weight: 1.5 }, { t: 'eight nights of light', font: F.serif, italic: true }, { band: 'dots', span: 0.6 }] },
  }),
  d('lunar-new-year', 'Lunar New Year', C, 'Deco frame with classical capitals and an italic wish.', [[50, 30], [60, 40], [70, 40], [50, 50]], {
    base: { frame: 'deco', rows: [{ t: 'HAPPY LUNAR NEW YEAR', font: F.classic, bold: true, spacing: 40, weight: 1.2 }, { band: 'diamond', span: 0.6 }, { t: 'wishing you good fortune', font: F.serif, italic: true }] },
  }),

  // ---------- Birthdays and children ----------
  d('birthday-tag', 'Birthday gift tag', C, 'Balloon, a retro script greeting and lines for "to" and "from".', TAG_TALL, {
    base: { side: { pic: 'balloon' }, rows: [{ t: 'Happy Birthday', font: F.retro, weight: 1.5, align: 'center' }, to, from] },
    tall: { rows: [{ pic: 'balloon', weight: 2.4 }, { t: 'Happy Birthday', font: F.retro, weight: 1.2 }, to, from] },
  }),
  d('birthday-age', 'Birthday age badge', C, 'Star burst with the age in a heavy serif. For party bags and cake boxes.', STICKER, {
    base: { shape: 'burst', rows: [{ t: 'I AM', font: F.sans, bold: true, spacing: 160, weight: 0.6 }, { t: '7', font: F.fat, weight: 2 }, { t: 'TODAY', font: F.sans, bold: true, spacing: 160, weight: 0.6 }] },
    round: { shape: 'seal', rows: [{ t: 'I AM', font: F.sans, bold: true, spacing: 160, weight: 0.6 }, { t: '7', font: F.fat, weight: 2 }, { t: 'TODAY', font: F.sans, bold: true, spacing: 160, weight: 0.6 }] },
  }),
  d('party-thanks', 'Thank you for coming', C, 'Bunting over a rounded thank-you, for party bags.', TAG, {
    base: { rows: [{ band: 'bunting', span: 1, weight: 0.9 }, { t: 'Thank you for coming', font: F.round, bold: true, weight: 1.4 }, { t: "to Mia's 7th birthday", font: F.hand, bold: true }] },
  }),
  d('reward-star', 'Reward sticker', C, 'Round star burst with two words of praise.', ROUND, {
    base: { shape: 'seal', rows: [{ pic: 'star', weight: 1.2 }, { t: 'SUPER', font: F.round, bold: true }, { t: 'STAR', font: F.round, bold: true }] },
  }, { round: true }),
  d('well-done', 'Well done sticker', C, 'A crown and a rounded "well done", for charts and school books.', [...ROUND, [40, 20], [50, 20], [40, 30]], {
    base: { side: { pic: 'crown' }, rows: [{ t: 'Well done!', font: F.round, bold: true, weight: 1.4 }, { t: 'you worked hard', font: F.hand, bold: true }] },
    round: { frame: 'bold', rows: [{ pic: 'crown', weight: 1.4 }, { t: 'Well done!', font: F.round, bold: true }] },
  }),
  d('tooth-fairy', 'Tooth fairy receipt', C, 'An official receipt from the tooth fairy, with the tooth number and the amount paid.', [[50, 30], [60, 40], [70, 40]], {
    base: { frame: 'ticket', rows: [{ t: 'OFFICIAL RECEIPT', font: F.bebas, spacing: 140 }, { t: 'The Tooth Fairy', font: F.formal, weight: 1.6 }, { cols: [{ t: 'Tooth no. 3', font: F.mono }, { t: 'Paid $2', font: F.mono, bold: true }] }] },
  }),
  d('new-baby', 'Welcome, baby', C, 'Cloud, a retro script greeting, the name and the birth details.', TAG_TALL, {
    base: { frame: 'dots', side: { pic: 'cloud' }, rows: [{ t: 'hello, world', font: F.retro, align: 'center' }, { t: 'Emma Rose', font: F.round, bold: true, weight: 1.4, align: 'center' }, { t: '12 March 2026 · 3.4 kg', font: F.sans, align: 'center', weight: 0.7 }] },
    tall: { frame: 'dots', rows: [{ pic: 'cloud', weight: 1.6 }, { t: 'hello, world', font: F.retro }, { t: 'Emma Rose', font: F.round, bold: true, weight: 1.4 }, { t: '12 March 2026 · 3.4 kg', font: F.sans, weight: 0.7 }] },
  }),
  d('baby-months', 'Baby month sticker', C, 'Round sticker with the age in months, for milestone photos.', [[50, 50], [34, 34], [31, 31]], {
    base: { shape: 'ring', rows: [{ t: '3', font: F.fat, weight: 2.2 }, { t: 'MONTHS OLD', font: F.sans, bold: true, spacing: 120, weight: 0.7 }] },
  }, { round: true }),
  d('baby-shower', 'Baby shower', C, 'Dotted frame, a script heading, hearts and the names.', TAG, {
    base: { frame: 'dots', rows: [{ t: 'Baby Shower', font: F.script, bold: true, weight: 1.6 }, { band: 'hearts', span: 0.4 }, { t: 'for Emma and Sam', font: F.serif, italic: true }, { t: 'SATURDAY 14 MARCH', font: F.sans, bold: true, spacing: 120, weight: 0.7 }] },
  }),
  d('naming-day', 'Naming day', C, 'Double frame with the name in formal script and the date in classical capitals.', TAG, {
    base: { frame: 'double', rows: [{ t: 'NAMING DAY', font: F.classic, spacing: 200, weight: 0.8 }, { t: 'Emma Rose', font: F.formal, weight: 2 }, { t: '12 · 04 · 2026', font: F.classic, spacing: 80, weight: 0.8 }] },
  }),

  // ---------- Weddings ----------
  d('save-the-date', 'Save the date', C, 'Formal script, the initials and the date. Round sizes make an envelope seal.', [...TAG, ...ROUND], {
    base: { frame: 'deco', rows: [{ t: 'Save the Date', font: F.formal, weight: 1.6 }, { t: 'A & J', font: F.serif, italic: true, bold: true, weight: 1.2 }, { t: '12 · 03 · 2027', font: F.classic, spacing: 80, weight: 0.8 }] },
    round: { shape: 'ring', rows: [{ t: 'save the date', font: F.script, bold: true, weight: 0.9 }, { t: 'A & J', font: F.serif, italic: true, bold: true, weight: 1.5 }, { t: '12 · 03 · 27', font: F.classic, spacing: 60, weight: 0.7 }] },
  }),
  d('just-married', 'Just married', C, 'Retro script with a row of hearts and the date.', TAG, {
    base: { frame: 'corners', rows: [{ t: 'Just Married', font: F.retro, weight: 1.7 }, { band: 'hearts', span: 0.4 }, { t: 'A & J · 12 MARCH 2027', font: F.sans, bold: true, spacing: 100, weight: 0.7 }] },
  }),
  d('wedding-table', 'Wedding table number', C, 'Deco frame with the word in spaced capitals and a large serif number.', [[50, 50], [50, 70], [50, 80], [60, 40], [50, 30], [80, 50]], {
    base: { frame: 'deco', rows: [{ t: 'TABLE', font: F.classic, spacing: 300, weight: 0.7 }, { t: '4', font: F.serif, bold: true, weight: 2.6 }, { band: 'diamond', span: 0.5 }] },
  }),
  d('monogram-seal', 'Monogram seal', C, 'Round seal with one large initial and the family name.', ROUND_L, {
    base: { shape: 'ring', rows: [{ t: 'M', font: F.classic, bold: true, weight: 2 }, { t: 'THE MORGANS', font: F.sans, bold: true, spacing: 100, weight: 0.6 }] },
  }, { round: true }),
  d('favour-thanks', 'Thank you for celebrating', C, 'Scalloped outline with a script thank-you, for wedding and party favours.', [...ROUND, [50, 30], [40, 30]], {
    base: { frame: 'double', rows: [{ t: 'Thank you', font: F.formal, weight: 1.8 }, { t: 'FOR CELEBRATING WITH US', font: F.sans, bold: true, spacing: 100, weight: 0.6 }, { t: 'A & J', font: F.serif, italic: true }] },
    round: { shape: 'sealOutline', rows: [{ t: 'thank you', font: F.script, bold: true, weight: 1.3 }, { t: 'for celebrating', font: F.serif, italic: true, weight: 0.7 }, { t: 'A & J', font: F.serif, italic: true, bold: true }] },
  }),
  d('engagement', 'Engagement', C, 'A script line, hearts and the names.', TAG, {
    base: { frame: 'line', rows: [{ t: 'She said yes!', font: F.script, bold: true, weight: 1.7 }, { band: 'hearts', span: 0.3 }, { t: 'ALEX & JORDAN', font: F.sans, bold: true, spacing: 160, weight: 0.7 }] },
  }),
  d('anniversary', 'Anniversary wreath', C, 'Leaf wreath round the number of years.', [[50, 50], [40, 40], [34, 34], [31, 31]], {
    base: { shape: 'laurel', rows: [{ t: '25', font: F.fat, weight: 2 }, { t: 'YEARS', font: F.classic, bold: true, spacing: 160, weight: 0.7 }] },
  }),

  // ---------- Good wishes ----------
  d('graduation', 'Graduation', C, 'Graduation cap, a script greeting and the year in tall capitals.', TAG_TALL, {
    base: { side: { icon: 'graduation' }, rows: [{ t: 'Congratulations', font: F.script, bold: true, weight: 1.5, align: 'center' }, { t: 'CLASS OF 2026', font: F.bebas, spacing: 140, align: 'center' }] },
    tall: { rows: [{ icon: 'graduation', weight: 2 }, { t: 'Congratulations', font: F.script, bold: true, weight: 1.2 }, { t: 'CLASS OF 2026', font: F.bebas, spacing: 140 }] },
  }),
  d('congratulations', 'Congratulations', C, 'Rows of stars round a retro script.', [...TAG, [50, 20], [40, 20]], {
    base: { rows: [{ band: 'stars', span: 0.5 }, { t: 'Congratulations!', font: F.retro, weight: 1.6 }, { t: 'you did it', font: F.hand, bold: true }] },
    small: { rows: [{ t: 'Congratulations!', font: F.retro, weight: 1.5 }, { t: 'you did it', font: F.hand, bold: true }], gap: 0.1 },
  }),
  d('retirement', 'Happy retirement', C, 'Rising sun under a serif greeting.', TAG, {
    base: { rows: [{ t: 'Happy Retirement', font: F.serif, italic: true, bold: true, weight: 1.4 }, { t: 'ENJOY EVERY DAY', font: F.sans, bold: true, spacing: 160, weight: 0.6 }, { band: 'rays', weight: 1.3 }] },
  }),
  d('new-home', 'New home', C, 'House symbol with a retro script greeting.', TAG_TALL, {
    base: { frame: 'line', side: { icon: 'home' }, rows: [{ t: 'New Home', font: F.retro, weight: 1.5, align: 'center' }, { t: 'welcome to number 12', font: F.hand, bold: true, align: 'center' }] },
    tall: { frame: 'line', rows: [{ icon: 'home', weight: 2 }, { t: 'New Home', font: F.retro, weight: 1.3 }, { t: 'welcome to number 12', font: F.hand, bold: true }] },
  }),
  d('get-well', 'Get well soon', C, 'Sun with a rounded greeting and a handwritten line.', TAG_TALL, {
    base: { side: { pic: 'sun' }, rows: [{ t: 'Get well soon', font: F.round, bold: true, weight: 1.5, align: 'center' }, { t: 'thinking of you', font: F.hand, bold: true, align: 'center' }] },
    tall: { rows: [{ pic: 'sun', weight: 2 }, { t: 'Get well soon', font: F.round, bold: true, weight: 1.2 }, { t: 'thinking of you', font: F.hand, bold: true }] },
  }),
  d('good-luck', 'Good luck', C, 'Clover with a script greeting.', [...TAG, ...SMALL], {
    base: { side: { icon: 'clover' }, rows: [{ t: 'Good luck!', font: F.script, bold: true, weight: 1.5 }, { t: "you've got this", font: F.hand, bold: true }] },
  }),
  d('teacher-thanks', 'Thank you, teacher', C, 'Apple with a script thank-you and the name of the child.', TAG_TALL, {
    base: { frame: 'double', side: { icon: 'apple' }, rows: [{ t: 'Thank you', font: F.script, bold: true, weight: 1.5, align: 'center' }, { t: 'for a great year', font: F.serif, italic: true, align: 'center' }, { t: 'from Charlie', font: F.hand, bold: true, align: 'center' }] },
    tall: { frame: 'double', rows: [{ icon: 'apple', weight: 1.8 }, { t: 'Thank you', font: F.script, bold: true, weight: 1.4 }, { t: 'for a great year', font: F.serif, italic: true }, { t: 'from Charlie', font: F.hand, bold: true }] },
  }),
  d('sympathy', 'With sympathy', C, 'Formal script over a leaf sprig.', TAG, {
    base: { frame: 'line', rows: [{ t: 'With sympathy', font: F.formal, weight: 1.8 }, { band: 'sprig', span: 0.5 }, { t: 'thinking of you all', font: F.serif, italic: true }] },
  }),
  d('bon-voyage', 'Bon voyage', C, 'Plane with a retro script and a handwritten line.', TAG, {
    base: { frame: 'stamp', side: { icon: 'plane' }, rows: [{ t: 'Bon voyage', font: F.retro, weight: 1.5, align: 'center' }, { t: 'send a postcard!', font: F.hand, bold: true, align: 'center' }] },
  }),
  d('invitation-seal', "You're invited", C, 'Round seal for invitation envelopes.', ROUND, {
    base: { shape: 'sealOutline', rows: [{ t: "you're", font: F.script, bold: true }, { t: 'INVITED', font: F.bebas, spacing: 120, weight: 1.2 }] },
  }, { round: true }),
  d('bottle-tag', 'Bottle gift tag', C, 'Tag shape with a retro "Cheers" and an italic line, for the neck of a bottle.', [[50, 30], [40, 30], [60, 40], [50, 20], [40, 20]], {
    base: { frame: 'tag', rows: [{ t: 'Cheers!', font: F.retro, weight: 1.6 }, { t: 'to the new house', font: F.serif, italic: true }] },
  }),
  d('pet-birthday', 'Pet birthday', C, 'Bone with a rounded greeting, for pet treats and photos.', TAG, {
    base: { corners: 'paw', rows: [{ t: 'Happy Barkday', font: F.round, bold: true, weight: 1.5 }, { pic: 'bone', weight: 0.9 }, { t: 'Biscuit is 3', font: F.hand, bold: true }] },
  }),
  d('gift-voucher', 'Gift voucher', C, 'Ticket shape with the value, a voucher number that counts up and the expiry date.', [[60, 40], [70, 40], [50, 30], [80, 50]], {
    base: { frame: 'ticket', rows: [{ t: 'GIFT VOUCHER', font: F.bebas, spacing: 200 }, { t: '$50', font: F.fat, weight: 2 }, { cols: [{ serial: { prefix: 'No. ', digits: 4 }, font: F.mono }, { date: 'DD/MM/YYYY', offset: 365, font: F.mono }] }] },
  }),
  d('hamper', 'Gift hamper', C, 'Double frame with a script line and a short list of what is inside.', [[50, 50], [60, 40], [70, 40], [50, 70], [50, 80]], {
    base: { frame: 'double', rows: [{ t: 'A little something', font: F.script, bold: true, weight: 1.5 }, { band: 'diamond', span: 0.6 }, { t: 'fig jam · shortbread', font: F.serif, italic: true }, { t: 'tea · honey · candle', font: F.serif, italic: true }] },
  }),
  d('picnic', 'Barbecue or picnic', C, 'Chequered bands with a heavy word and the day.', TAG, {
    base: { bands: 'checks', rows: [{ t: 'BARBECUE', font: F.heavy, weight: 1.5 }, { t: 'Saturday · 3 pm · bring a chair', font: F.sans, bold: true }] },
  }),
];

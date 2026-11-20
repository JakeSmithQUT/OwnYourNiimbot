import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src/i18n/en';
import { LANGUAGES, checkLanguage, shortCode } from '../src/i18n/languages';
import { createTranslator, placeholders, tags, type Catalog } from '../src/i18n/translate';

const ENGLISH = en as Record<string, string>;
const keys = Object.keys(ENGLISH);
/** Base keys of texts with plural forms, for example "history.labels". */
const pluralBases = [...new Set(keys.filter((k) => /_(zero|one|two|few|many|other)$/.test(k)).map((k) => k.replace(/_(zero|one|two|few|many|other)$/, '')))];
const isPluralForm = (key: string) => pluralBases.some((b) => key.startsWith(`${b}_`));

const load = (code: string): Catalog => JSON.parse(readFileSync(join(__dirname, '../src/i18n/locales', `${code}.json`), 'utf8')) as Catalog;

describe('translation system', () => {
  it('fills in values and plural forms', () => {
    const tr = createTranslator('en', {});
    expect(tr.t('settings.blackLevel', { level: 127 })).toBe('Black level 127');
    const pl = createTranslator('pl', { 'x_one': '{count} etykieta', 'x_few': '{count} etykiety', 'x_many': '{count} etykiet', 'x_other': '{count} etykiety' } as Catalog);
    // A key that is not in the English catalogue, to test the plural rules alone.
    const tn = pl.tn as (key: string, n: number) => string;
    expect(tn('x', 1)).toBe('1 etykieta');
    expect(tn('x', 3)).toBe('3 etykiety');
    expect(tn('x', 5)).toBe('5 etykiet');
  });

  it('falls back to English for a missing text', () => {
    expect(createTranslator('de', {}).t('common.save')).toBe('Save');
  });

  it('accepts only the languages of the app', () => {
    expect(checkLanguage('de')).toBe('de');
    expect(checkLanguage('xx')).toBe('en');
    expect(checkLanguage('../../evil')).toBe('en');
    expect(shortCode('pt-BR')).toBe('PT');
  });

  it('has an "other" form for each English plural text', () => {
    for (const base of pluralBases) expect(ENGLISH[`${base}_other`], base).toBeTypeOf('string');
  });
});

describe.each(LANGUAGES.filter((l) => l.code !== 'en'))('translation $english ($code)', ({ code }) => {
  const catalog = load(code);
  const categories = new Intl.PluralRules(code).resolvedOptions().pluralCategories;

  it('has only keys of the English catalogue', () => {
    const unknown = Object.keys(catalog).filter((k) => !(k in ENGLISH) && !pluralBases.some((b) => k.startsWith(`${b}_`)));
    expect(unknown).toEqual([]);
  });

  it('has every text', () => {
    const missing = keys.filter((k) => !isPluralForm(k) && typeof catalog[k] !== 'string');
    expect(missing).toEqual([]);
  });

  it('has every plural form of the language', () => {
    const missing = pluralBases.flatMap((b) => categories.filter((c) => typeof catalog[`${b}_${c}`] !== 'string').map((c) => `${b}_${c}`));
    expect(missing).toEqual([]);
  });

  it('keeps the values and tags of the English text', () => {
    const wrong: string[] = [];
    for (const [key, text] of Object.entries(catalog)) {
      if (typeof text !== 'string' || text.trim() === '') {
        wrong.push(`${key}: empty`);
        continue;
      }
      const base = key.replace(/_(zero|one|two|few|many|other)$/, '');
      const source = ENGLISH[key] ?? ENGLISH[`${base}_other`];
      if (source === undefined) continue;
      // A plural form may leave out {count}, for example "one label" in place of "1 label".
      const want = placeholders(source).filter((p) => !(isPluralForm(key) && p === 'count'));
      const have = placeholders(text).filter((p) => !(isPluralForm(key) && p === 'count'));
      if (JSON.stringify(want) !== JSON.stringify(have)) wrong.push(`${key}: values ${have.join(',')} in place of ${want.join(',')}`);
      if (JSON.stringify(tags(source)) !== JSON.stringify(tags(text))) wrong.push(`${key}: tags`);
    }
    expect(wrong).toEqual([]);
  });

  it('is a translation, not a copy of the English text', () => {
    const same = keys.filter((k) => catalog[k] === ENGLISH[k] && /[a-z]{4}/.test(ENGLISH[k])).length;
    expect(same / keys.length).toBeLessThan(0.15);
  });
});

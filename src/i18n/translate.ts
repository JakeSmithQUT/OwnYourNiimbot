// Text lookup for all parts of the app. It does not need Electron, React or
// the DOM, so the main process, the windows and the tests can all use it.
//
// Rules for the catalogues:
// - A key is "<area>.<name>", for example "settings.theme".
// - "{name}" in a text is a value that the code fills in. Translations keep
//   every "{name}" of the English text.
// - A text with a count has one key for each plural form: "<key>_one" and
//   "<key>_other" in English. Other languages use the forms that
//   Intl.PluralRules gives for that language: zero, one, two, few, many, other.
// - "<b>…</b>" (or another tag name) marks a part of the text that the
//   interface shows in a different style. Translations keep the tags.

import { en, type MessageKey } from './en';
import type { LanguageCode } from './languages';

export type { MessageKey };
export type Catalog = Partial<Record<string, string>>;
export type Vars = Record<string, string | number>;

/** The base keys of texts with plural forms, for example "history.labels" for "history.labels_one". */
export type PluralKey = { [K in MessageKey]: K extends `${infer B}_other` ? B : never }[MessageKey];

const ENGLISH = en as Catalog;

/** Fills in "{name}" values. A value that is missing stays as "{name}". */
export function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all));
}

export interface Translator {
  language: LanguageCode;
  /** The text for a key in this language, or in English if there is no translation. */
  t(key: MessageKey, vars?: Vars): string;
  /** The text with the plural form for `count`. "{count}" is filled in. */
  tn(key: PluralKey, count: number, vars?: Vars): string;
}

export function createTranslator(language: LanguageCode, catalog: Catalog): Translator {
  const rules = new Intl.PluralRules(language);
  const englishRules = new Intl.PluralRules('en');
  const lookup = (key: string): string | undefined => catalog[key] ?? ENGLISH[key];
  return {
    language,
    t: (key, vars) => fill(lookup(key) ?? key, vars),
    tn: (key, count, vars) => {
      const all = { count, ...vars };
      const own = catalog[`${key}_${rules.select(count)}`] ?? catalog[`${key}_other`];
      if (own !== undefined) return fill(own, all);
      // No translation: use the English plural form.
      return fill(ENGLISH[`${key}_${englishRules.select(count)}`] ?? ENGLISH[`${key}_other`] ?? key, all);
    },
  };
}

/** The "{name}" values in a text, sorted, for checks. */
export function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
}

/** The tag names in a text, sorted, for checks. */
export function tags(text: string): string[] {
  return [...text.matchAll(/<(\w+)>/g)].map((m) => m[1]).sort();
}

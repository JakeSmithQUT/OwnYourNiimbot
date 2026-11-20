// The language of the windows. Components call t() and tn() while they
// render. The App remounts its content when the language changes, so every
// text changes at the same time.

import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import { createTranslator, type Catalog, type MessageKey, type PluralKey, type Translator, type Vars } from '../i18n/translate';
import { checkLanguage, DEFAULT_LANGUAGE, type LanguageCode } from '../i18n/languages';

const loaders = import.meta.glob<Catalog>('../i18n/locales/*.json', { import: 'default' });

let current: Translator = createTranslator(DEFAULT_LANGUAGE, {});
const listeners = new Set<() => void>();

/** The text for a key in the current language. */
export function t(key: MessageKey, vars?: Vars): string {
  return current.t(key, vars);
}

/** The text with the plural form for `count`, for example tn('history.labels', 3). */
export function tn(key: PluralKey, count: number, vars?: Vars): string {
  return current.tn(key, count, vars);
}

/** The current language code. */
export function currentLanguage(): LanguageCode {
  return current.language;
}

/** Loads a language. An unknown code loads English. */
export async function setLanguage(code: unknown): Promise<void> {
  const language = checkLanguage(code);
  let catalog: Catalog = {};
  if (language !== DEFAULT_LANGUAGE) {
    const load = loaders[`../i18n/locales/${language}.json`];
    if (load) catalog = await load().catch(() => ({}));
  }
  current = createTranslator(language, catalog);
  document.documentElement.lang = language;
  for (const fn of listeners) fn();
}

/** The current language. A component that calls this renders again when the language changes. */
export function useLanguage(): LanguageCode {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => current.language,
  );
}

/**
 * A text with marked parts as React nodes. `parts` gives the look of each
 * tag, for example tr('print.summary', { b: (s) => <strong>{s}</strong> }).
 */
export function tr(key: MessageKey, parts: Record<string, (chunk: string) => ReactNode>, vars?: Vars): ReactNode {
  const text = t(key, vars);
  const out: ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(re)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    // Own properties only, so that a tag such as <constructor> never finds a function on the prototype.
    const render = Object.hasOwn(parts, m[1]) ? parts[m[1]] : undefined;
    out.push(<Fragment key={i++}>{render ? render(m[2]) : m[2]}</Fragment>);
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

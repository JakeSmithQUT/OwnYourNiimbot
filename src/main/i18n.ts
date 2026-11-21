// The language of the main process: menus, system dialogs and update
// messages. The renderer tells it the language when the user changes it, and
// at start-up the main process reads it from the settings file, because the
// update window opens before the main window. Until the user chooses a
// language, the app uses the language of the system if it has it.
// The renderer gets the language from here at start-up.

import { readFile } from 'node:fs/promises';
import { checkLanguage, DEFAULT_LANGUAGE, isLanguage, type LanguageCode } from '../i18n/languages';
import { createTranslator, type Catalog, type MessageKey, type PluralKey, type Translator, type Vars } from '../i18n/translate';
import bg from '../i18n/locales/bg.json';
import cs from '../i18n/locales/cs.json';
import de from '../i18n/locales/de.json';
import es from '../i18n/locales/es.json';
import fr from '../i18n/locales/fr.json';
import hi from '../i18n/locales/hi.json';
import hr from '../i18n/locales/hr.json';
import hu from '../i18n/locales/hu.json';
import it from '../i18n/locales/it.json';
import ja from '../i18n/locales/ja.json';
import ko from '../i18n/locales/ko.json';
import mr from '../i18n/locales/mr.json';
import pl from '../i18n/locales/pl.json';
import ptBR from '../i18n/locales/pt-BR.json';
import ru from '../i18n/locales/ru.json';
import sv from '../i18n/locales/sv.json';
import tr from '../i18n/locales/tr.json';
import uk from '../i18n/locales/uk.json';
import vi from '../i18n/locales/vi.json';
import zhCN from '../i18n/locales/zh-CN.json';
import zhTW from '../i18n/locales/zh-TW.json';

const CATALOGS: Partial<Record<LanguageCode, Catalog>> = {
  bg,
  cs,
  de,
  es,
  fr,
  hi,
  hr,
  hu,
  it,
  ja,
  ko,
  mr,
  pl,
  'pt-BR': ptBR,
  ru,
  sv,
  tr,
  uk,
  vi,
  'zh-CN': zhCN,
  'zh-TW': zhTW,
};

let current: Translator = createTranslator(DEFAULT_LANGUAGE, {});

export function setMainLanguage(code: unknown): LanguageCode {
  const language = checkLanguage(code);
  current = createTranslator(language, CATALOGS[language] ?? {});
  return language;
}

export function mainLanguage(): LanguageCode {
  return current.language;
}

/** The text for a key in the language of the app. */
export function tm(key: MessageKey, vars?: Vars): string {
  return current.t(key, vars);
}

/** The text with the plural form for `count`. */
export function tmn(key: PluralKey, count: number, vars?: Vars): string {
  return current.tn(key, count, vars);
}

/**
 * Reads the language that the user chose from the settings file of the
 * renderer. If the user did not choose a language, or the file or the value is
 * not correct, the app uses `fallback`, the language of the system.
 */
export async function loadMainLanguage(settingsFile: string, fallback: LanguageCode): Promise<LanguageCode> {
  let chosen: unknown;
  try {
    const raw = await readFile(settingsFile, 'utf8');
    if (raw.length <= 1024 * 1024) chosen = (JSON.parse(raw) as { language?: unknown }).language;
  } catch {
    chosen = undefined;
  }
  return setMainLanguage(isLanguage(chosen) ? chosen : fallback);
}

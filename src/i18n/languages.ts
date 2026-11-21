/** The languages of the app. The name is in the language itself, so that a user can find it. */
export const LANGUAGES = [
  { code: 'en', name: 'English', english: 'English' },
  { code: 'bg', name: 'Български', english: 'Bulgarian' },
  { code: 'zh-CN', name: '简体中文', english: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: '繁體中文', english: 'Chinese (Traditional)' },
  { code: 'hr', name: 'Hrvatski', english: 'Croatian' },
  { code: 'cs', name: 'Čeština', english: 'Czech' },
  { code: 'fr', name: 'Français', english: 'French' },
  { code: 'de', name: 'Deutsch', english: 'German' },
  { code: 'hi', name: 'हिन्दी', english: 'Hindi' },
  { code: 'hu', name: 'Magyar', english: 'Hungarian' },
  { code: 'it', name: 'Italiano', english: 'Italian' },
  { code: 'ko', name: '한국어', english: 'Korean' },
  { code: 'mr', name: 'मराठी', english: 'Marathi' },
  { code: 'pl', name: 'Polski', english: 'Polish' },
  { code: 'pt-BR', name: 'Português (Brasil)', english: 'Portuguese (Brazil)' },
  { code: 'ru', name: 'Русский', english: 'Russian' },
  { code: 'es', name: 'Español', english: 'Spanish' },
  { code: 'sv', name: 'Svenska', english: 'Swedish' },
  { code: 'tr', name: 'Türkçe', english: 'Turkish' },
  { code: 'uk', name: 'Українська', english: 'Ukrainian' },
  { code: 'vi', name: 'Tiếng Việt', english: 'Vietnamese' },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** True if the code is one of the languages of the app. */
export function isLanguage(code: unknown): code is LanguageCode {
  return LANGUAGES.some((l) => l.code === code);
}

/** The language code if it is one of the languages of the app, else English. */
export function checkLanguage(code: unknown): LanguageCode {
  return isLanguage(code) ? code : DEFAULT_LANGUAGE;
}

/**
 * The language of the app for a system language tag, for example "de-AT",
 * "zh-Hant-TW", "pt_PT.UTF-8" or "es-419". Undefined if the app does not have
 * the language. Chinese is Traditional for Taiwan, Hong Kong and Macao, and
 * Portuguese is always Brazilian Portuguese, because the app has only that.
 */
export function matchLanguage(tag: unknown): LanguageCode | undefined {
  if (typeof tag !== 'string') return undefined;
  const parts = tag.split(/[.@]/)[0].replace(/_/g, '-').toLowerCase().split('-');
  const language = parts[0];
  if (language === 'zh') {
    if (parts.includes('hans')) return 'zh-CN';
    return parts.some((p) => p === 'hant' || p === 'tw' || p === 'hk' || p === 'mo') ? 'zh-TW' : 'zh-CN';
  }
  if (language === 'pt') return 'pt-BR';
  return LANGUAGES.find((l) => l.code === language)?.code;
}

/**
 * The language for a new installation: the first preferred language of the
 * system if the app has it, else English. The other languages in the list are
 * not used, so that the app does not start in a language that the system does
 * not show.
 */
export function systemLanguage(preferred: readonly string[]): LanguageCode {
  return matchLanguage(preferred[0]) ?? DEFAULT_LANGUAGE;
}

/** A short label for the language button, for example "EN" or "PT". */
export function shortCode(code: LanguageCode): string {
  return code.split('-')[0].toUpperCase();
}

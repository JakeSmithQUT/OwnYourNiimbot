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
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

/** The language code if it is one of the languages of the app, else English. */
export function checkLanguage(code: unknown): LanguageCode {
  return LANGUAGES.some((l) => l.code === code) ? (code as LanguageCode) : DEFAULT_LANGUAGE;
}

/** A short label for the language button, for example "EN" or "PT". */
export function shortCode(code: LanguageCode): string {
  return code.split('-')[0].toUpperCase();
}

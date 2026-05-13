export const DEFAULT_LANGUAGE = 'en' as const;
export const I18N_STORAGE_KEY = 'threeKingdomsChess.language';

export const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
] as const;

export type Language = (typeof LANGUAGE_OPTIONS)[number]['code'];

export function isLanguage(value: string): value is Language {
  return LANGUAGE_OPTIONS.some((option) => option.code === value);
}

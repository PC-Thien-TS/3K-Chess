import React, { createContext, useCallback, useMemo, useState } from 'react';
import { DEFAULT_LANGUAGE, I18N_STORAGE_KEY, isLanguage, type Language } from './languages';
import en from './translations/en';
import vi from './translations/vi';
import zh from './translations/zh';

const translations = { en, vi, zh } as const;

type TranslationValue = unknown;

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: <T = string>(key: string) => T;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(source: Record<string, unknown>, key: string): TranslationValue {
  return key.split('.').reduce<TranslationValue>((current, segment) => {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[segment];
  }, source);
}

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') {
    return DEFAULT_LANGUAGE;
  }

  const stored = window.localStorage.getItem(I18N_STORAGE_KEY);
  return stored && isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(I18N_STORAGE_KEY, nextLanguage);
    }
  }, []);

  const t = useCallback(<T = string,>(key: string): T => {
    const localized = getNestedValue(translations[language], key);
    if (localized !== undefined) {
      return localized as T;
    }

    const fallback = getNestedValue(translations.en, key);
    return (fallback ?? key) as T;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
  }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export { I18nContext };

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'or' | 'bn' | 'kn' | 'ta' | 'te' | 'ur' | 'as' | 'pa' | 'ml' | 'sa';

export interface Translations {
  [key: string]: string | Translations;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  translations: Translations;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const AVAILABLE_LANGUAGES = {
  en: 'English',
  hi: 'हिंदी',
  mr: 'मराठी',
  gu: 'ગુજરાતી',
  or: 'ଓଡିଆ',
  bn: 'বাংলা',
  kn: 'ಕನ್ನಡ',
  ta: 'தமிழ்',
  te: 'తెలుగు',
  ur: 'اردو',
  as: 'অসমীয়া',
  pa: 'ਪੰਜਾਬੀ',
  ml: 'മലയാളം',
  sa: 'संस्कृतम्'
};

export { AVAILABLE_LANGUAGES };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations for a specific language
  const loadTranslations = async (lang: Language) => {
    try {
      setIsLoading(true);
      const translationModule = await import(`../locales/${lang}/common.json`);
      setTranslations(translationModule.default);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to English if translation fails
      if (lang !== 'en') {
        try {
          const englishModule = await import(`../locales/en/common.json`);
          setTranslations(englishModule.default);
        } catch (fallbackError) {
          console.error('Failed to load fallback English translations:', fallbackError);
          setTranslations({});
        }
      } else {
        setTranslations({});
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Set language and update cookies
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    Cookies.set('language', lang, { expires: 365 }); // Cookie expires in 1 year
    loadTranslations(lang);
  };

  // Initialize language from cookies or default to English
  useEffect(() => {
    const savedLanguage = Cookies.get('language') as Language;
    if (savedLanguage && savedLanguage in AVAILABLE_LANGUAGES) {
      setLanguageState(savedLanguage);
      loadTranslations(savedLanguage);
    } else {
      // Default to English
      loadTranslations('en');
    }
  }, []);

  // Translation function with parameter support
  const t = (key: string, params?: Record<string, string | number>): string => {
    // Return key immediately if translations are still loading or empty
    if (isLoading || !translations || Object.keys(translations).length === 0) {
      return key;
    }

    const keys = key.split('.');
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Return the key if translation not found
        return key;
      }
    }

    if (typeof value === 'string') {
      // Replace parameters in the translation string
      if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
          return params[paramKey]?.toString() || match;
        });
      }
      return value;
    }

    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
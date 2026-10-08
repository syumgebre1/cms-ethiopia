import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import am from './locales/am.json';

i18n
  // Detect user language automatically
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize configuration
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    fallbackLng: 'en',        // If a key is missing, use English
    debug: false,              // Set to true for console logs while developing
    supportedLngs: ['en', 'am'],
    interpolation: {
      escapeValue: false,      // React already escapes by default
    },
    detection: {
      // Order of language detection:
      // 1. Check localStorage
      // 2. Fall back to browser language
      // 3. Fall back to HTML lang attribute
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],  // Save user's choice
      lookupLocalStorage: 'cms_language',
    },
  });

export default i18n;
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';

const STORAGE_KEY = 'ai-studio-language';

// Get saved language or default to English
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved || 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: STORAGE_KEY,
    },
  });

// Save language to localStorage when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng);
});

export default i18n;

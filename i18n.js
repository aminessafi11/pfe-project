import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import fr from './fr.json';

const savedLang = localStorage.getItem('maklada_lang') || 'fr';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    lng: savedLang,
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
  });

// Persist language choice
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('maklada_lang', lng);
});

export default i18n;

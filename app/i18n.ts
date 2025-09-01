import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';

const resources = {
  en: { common: enCommon },
  fr: { common: frCommon },
};

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export default i18n;
export type AppI18n = typeof i18n;

import { createI18n } from 'vue-i18n';
import en from './locales/en.json';
import fa from './locales/fa.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    fa
  }
});

export default i18n;

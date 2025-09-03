import 'i18next';
import enCommon from './locales/en/common';

declare module 'i18next' {
  interface CustomTypeOptions {
    enableSelector: 'optimize';
    defaultNS: 'common';
    resources: {
      common: typeof enCommon;
    };
  }
}

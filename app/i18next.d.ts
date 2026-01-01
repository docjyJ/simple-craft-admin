import 'i18next';
import type EnCommon from './locales/en/common';

declare module 'i18next' {
  interface CustomTypeOptions {
    enableSelector: 'optimize';
    defaultNS: 'common';
    resources: {
      common: EnCommon;
    };
  }
}

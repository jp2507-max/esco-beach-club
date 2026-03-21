import 'i18next';

import type { Translations } from '@/src/lib/i18n/locales/en';
import { defaultNamespace } from '@/src/lib/i18n/types';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNamespace;
    resources: Translations;
    returnNull: false;
  }
}

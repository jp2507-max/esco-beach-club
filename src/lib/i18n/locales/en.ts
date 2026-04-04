import auth from '@/src/lib/i18n/locales/en/auth';
import booking from '@/src/lib/i18n/locales/en/booking';
import common from '@/src/lib/i18n/locales/en/common';
import events from '@/src/lib/i18n/locales/en/events';
import home from '@/src/lib/i18n/locales/en/home';
import membership from '@/src/lib/i18n/locales/en/membership';
import menu from '@/src/lib/i18n/locales/en/menu';
import perks from '@/src/lib/i18n/locales/en/perks';
import profile from '@/src/lib/i18n/locales/en/profile';

export const english = {
  auth,
  common,
  events,
  home,
  membership,
  perks,
  profile,
  booking,
  menu,
} as const;

type TranslationShape<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly TranslationShape<U>[]
    : T extends object
      ? { [K in keyof T]: TranslationShape<T[K]> }
      : T;

export type Translations = TranslationShape<typeof english>;

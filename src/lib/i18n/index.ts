import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import authEn from '@/src/lib/i18n/locales/en/auth';
import commonEn from '@/src/lib/i18n/locales/en/common';
import eventsEn from '@/src/lib/i18n/locales/en/events';
import homeEn from '@/src/lib/i18n/locales/en/home';
import perksEn from '@/src/lib/i18n/locales/en/perks';
import profileEn from '@/src/lib/i18n/locales/en/profile';
import authKo from '@/src/lib/i18n/locales/ko/auth';
import commonKo from '@/src/lib/i18n/locales/ko/common';
import eventsKo from '@/src/lib/i18n/locales/ko/events';
import homeKo from '@/src/lib/i18n/locales/ko/home';
import perksKo from '@/src/lib/i18n/locales/ko/perks';
import profileKo from '@/src/lib/i18n/locales/ko/profile';
import authVi from '@/src/lib/i18n/locales/vi/auth';
import commonVi from '@/src/lib/i18n/locales/vi/common';
import eventsVi from '@/src/lib/i18n/locales/vi/events';
import homeVi from '@/src/lib/i18n/locales/vi/home';
import perksVi from '@/src/lib/i18n/locales/vi/perks';
import profileVi from '@/src/lib/i18n/locales/vi/profile';
import { appLanguages, defaultLanguage, defaultNamespace, type AppLanguage, namespaces } from '@/src/lib/i18n/types';

const i18n = createInstance();

export const resources = {
  en: {
    auth: authEn,
    common: commonEn,
    events: eventsEn,
    home: homeEn,
    perks: perksEn,
    profile: profileEn,
  },
  ko: {
    auth: authKo,
    common: commonKo,
    events: eventsKo,
    home: homeKo,
    perks: perksKo,
    profile: profileKo,
  },
  vi: {
    auth: authVi,
    common: commonVi,
    events: eventsVi,
    home: homeVi,
    perks: perksVi,
    profile: profileVi,
  },
} as const;

function isSupportedLanguage(language: string): language is AppLanguage {
  return appLanguages.includes(language as AppLanguage);
}

function resolveDeviceLanguage(): AppLanguage {
  for (const locale of getLocales()) {
    const languageCode = locale.languageCode?.toLowerCase();
    if (languageCode && isSupportedLanguage(languageCode)) return languageCode;

    const languageTag = locale.languageTag.split('-')[0]?.toLowerCase();
    if (languageTag && isSupportedLanguage(languageTag)) return languageTag;
  }

  return defaultLanguage;
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    defaultNS: defaultNamespace,
    fallbackLng: defaultLanguage,
    interpolation: {
      escapeValue: false,
    },
    lng: resolveDeviceLanguage(),
    ns: namespaces,
    react: {
      useSuspense: false,
    },
    resources,
    returnNull: false,
    supportedLngs: appLanguages,
  });
}

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNamespace;
    resources: (typeof resources)['en'];
    returnNull: false;
  }
}

export default i18n;

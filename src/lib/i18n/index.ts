import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { english } from '@/src/lib/i18n/locales/en';
import { korean } from '@/src/lib/i18n/locales/ko';
import { vietnamese } from '@/src/lib/i18n/locales/vi';
import {
  type AppLanguage,
  appLanguages,
  defaultLanguage,
  defaultNamespace,
  namespaces,
} from '@/src/lib/i18n/types';
import {
  getStoredLanguagePreference,
  useLanguagePreferenceStore,
} from '@/src/stores/language-preference-store';

const i18n = createInstance();

export const resources = {
  en: english,
  ko: korean,
  vi: vietnamese,
} as const;

function isSupportedLanguage(language: string): language is AppLanguage {
  return appLanguages.includes(language as AppLanguage);
}

function findSupportedLanguage(
  language: string | null | undefined
): AppLanguage | undefined {
  if (!language) return undefined;

  const normalizedLanguage = language.toLowerCase();
  if (isSupportedLanguage(normalizedLanguage)) return normalizedLanguage;

  const languagePrefix = normalizedLanguage.split('-')[0];
  if (languagePrefix && isSupportedLanguage(languagePrefix)) {
    return languagePrefix;
  }

  return undefined;
}

export function resolveSupportedLanguage(
  language: string | null | undefined
): AppLanguage {
  return findSupportedLanguage(language) ?? defaultLanguage;
}

function resolveDeviceLanguage(): AppLanguage {
  for (const locale of getLocales()) {
    const languageCode = findSupportedLanguage(locale.languageCode);
    if (languageCode) return languageCode;

    const languageTag = findSupportedLanguage(locale.languageTag);
    if (languageTag) return languageTag;
  }

  return defaultLanguage;
}

function resolveInitialLanguage(): AppLanguage {
  const storedPreference = getStoredLanguagePreference();
  if (storedPreference) return storedPreference;
  return resolveDeviceLanguage();
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  useLanguagePreferenceStore.getState().setOverrideLanguage(language);
}

export async function changeAppLanguageToDevice(): Promise<void> {
  const deviceLanguage = resolveDeviceLanguage();
  await i18n.changeLanguage(deviceLanguage);
  useLanguagePreferenceStore.getState().setOverrideLanguage(null);
}

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      defaultNS: defaultNamespace,
      fallbackLng: defaultLanguage,
      interpolation: {
        escapeValue: false,
      },
      lng: resolveInitialLanguage(),
      ns: namespaces,
      react: {
        useSuspense: false,
      },
      resources,
      returnNull: false,
      supportedLngs: appLanguages,
    })
    .catch((error) => {
      console.error('[i18n] Initialization failed:', error);
    });
}

export default i18n;

import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { type AppLanguage, appLanguages } from '@/src/lib/i18n/types';
import {
  createGetPersistStateStorage,
  readPersistEnvelopeSync,
} from '@/src/lib/stores/zustand-persist-state-storage';

type LanguagePreferenceState = {
  overrideLanguage: AppLanguage | null;
  setOverrideLanguage: (language: AppLanguage | null) => void;
};

type PersistedLanguagePreference = {
  state?: {
    overrideLanguage?: unknown;
  };
};

const LANGUAGE_PREFERENCE_STORAGE_KEY = 'language-preference';
const languagePreferenceStorage = createMMKV({
  id: 'esco.language-preference',
});
const getStateStorage = createGetPersistStateStorage(languagePreferenceStorage);

function isSupportedLanguage(language: unknown): language is AppLanguage {
  return (
    typeof language === 'string' &&
    appLanguages.includes(language as AppLanguage)
  );
}

function parseStoredLanguagePreference(
  rawValue: string | null
): AppLanguage | null {
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as PersistedLanguagePreference;
    const storedLanguage = parsed.state?.overrideLanguage;
    if (isSupportedLanguage(storedLanguage)) return storedLanguage;
  } catch {
    return null;
  }

  return null;
}

export function getStoredLanguagePreference(): AppLanguage | null {
  const rawPreference = readPersistEnvelopeSync(
    languagePreferenceStorage,
    LANGUAGE_PREFERENCE_STORAGE_KEY
  );
  return parseStoredLanguagePreference(rawPreference ?? null);
}

export const useLanguagePreferenceStore = create<LanguagePreferenceState>()(
  persist(
    (set) => ({
      overrideLanguage: null,
      setOverrideLanguage: (overrideLanguage: AppLanguage | null): void => {
        set({ overrideLanguage });
      },
    }),
    {
      name: LANGUAGE_PREFERENCE_STORAGE_KEY,
      partialize: (state) => ({ overrideLanguage: state.overrideLanguage }),
      storage: createJSONStorage(getStateStorage),
      version: 1,
    }
  )
);

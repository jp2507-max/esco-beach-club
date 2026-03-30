import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

import { type AppLanguage, appLanguages } from '@/src/lib/i18n/types';

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

const mmkvStateStorage: StateStorage = {
  getItem: (name: string): string | null =>
    languagePreferenceStorage.getString(name) ?? null,
  removeItem: (name: string): void => {
    languagePreferenceStorage.remove(name);
  },
  setItem: (name: string, value: string): void => {
    languagePreferenceStorage.set(name, value);
  },
};

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
  const rawPreference = languagePreferenceStorage.getString(
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
      storage: createJSONStorage(() => mmkvStateStorage),
      version: 1,
    }
  )
);

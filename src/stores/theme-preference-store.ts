import { Appearance, Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  createGetPersistStateStorage,
  readPersistEnvelopeSync,
} from '@/src/lib/stores/zustand-persist-state-storage';

export const themePreferences = ['system', 'light', 'dark'] as const;

export type ThemePreference = (typeof themePreferences)[number];

type PersistedThemePreferenceState = {
  state?: {
    preference?: ThemePreference;
  };
};

type ThemePreferenceState = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

type ApplyThemePreferenceOptions = {
  allowSystemReset?: boolean;
};

const THEME_PREFERENCE_STORAGE_KEY = 'theme-preference';

const themeStorage = createMMKV({ id: 'esco.theme-preference' });
const getStateStorage = createGetPersistStateStorage(themeStorage);

export function applyThemePreference(
  preference: ThemePreference,
  options: ApplyThemePreferenceOptions = {}
): void {
  if (Platform.OS === 'web' && typeof window === 'undefined') return;

  if (preference === 'system') {
    // Use the native reset value RN passes through to iOS/Android (see AppearanceModule /
    // RCTConvert). `null` is documented for newer RN stacks but on 0.83.x can mis-sync
    // native chrome vs JS theme. Skip reset during cold start; only on explicit change.
    if (!options.allowSystemReset) return;
    Appearance.setColorScheme('unspecified');
    return;
  }

  Appearance.setColorScheme(preference);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    themePreferences.includes(value as ThemePreference)
  );
}

function getStoredThemePreference(): ThemePreference {
  const rawPreferenceState = readPersistEnvelopeSync(
    themeStorage,
    THEME_PREFERENCE_STORAGE_KEY
  );

  if (!rawPreferenceState) return 'system';

  try {
    const parsedPreferenceState = JSON.parse(
      rawPreferenceState
    ) as PersistedThemePreferenceState;
    const storedPreference = parsedPreferenceState.state?.preference;

    return isThemePreference(storedPreference) ? storedPreference : 'system';
  } catch {
    return 'system';
  }
}

/** Resolved from real storage on native and web client; `'system'` on web SSR until rehydrate. */
const initialThemePreference = getStoredThemePreference();

applyThemePreference(initialThemePreference, { allowSystemReset: false });

export function getThemePreferenceLabelKey(
  preference: ThemePreference
): 'theme.options.system' | 'theme.options.light' | 'theme.options.dark' {
  if (preference === 'light') return 'theme.options.light';
  if (preference === 'dark') return 'theme.options.dark';
  return 'theme.options.system';
}

export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(
    (set) => ({
      preference: initialThemePreference,
      setPreference: (preference: ThemePreference): void => {
        set((state) => {
          if (state.preference === preference) return state;
          applyThemePreference(preference, { allowSystemReset: true });
          return { preference };
        });
      },
    }),
    {
      name: THEME_PREFERENCE_STORAGE_KEY,
      partialize: (state) => ({ preference: state.preference }),
      storage: createJSONStorage(getStateStorage),
      version: 1,
      onRehydrateStorage:
        () =>
        (state, error): void => {
          if (error != null || state == null) return;
          applyThemePreference(state.preference, { allowSystemReset: true });
        },
    }
  )
);

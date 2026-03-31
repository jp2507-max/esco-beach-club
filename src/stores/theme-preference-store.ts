import { Appearance } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from 'zustand/middleware';

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

const themeStorage = createMMKV({ id: 'esco.theme-preference' });

const mmkvStateStorage: StateStorage = {
  getItem: (name: string): string | null =>
    themeStorage.getString(name) ?? null,
  removeItem: (name: string): void => {
    themeStorage.remove(name);
  },
  setItem: (name: string, value: string): void => {
    themeStorage.set(name, value);
  },
};

export function applyThemePreference(preference: ThemePreference): void {
  Appearance.setColorScheme(
    preference === 'system' ? 'unspecified' : preference
  );
}

function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    themePreferences.includes(value as ThemePreference)
  );
}

function getStoredThemePreference(): ThemePreference {
  const rawPreferenceState = themeStorage.getString('theme-preference');

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

const initialThemePreference = getStoredThemePreference();

applyThemePreference(initialThemePreference);

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
        applyThemePreference(preference);
        set({ preference });
      },
    }),
    {
      name: 'theme-preference',
      onRehydrateStorage: () => (state) => {
        if (state?.preference) {
          applyThemePreference(state.preference);
        }
      },
      partialize: (state) => ({ preference: state.preference }),
      storage: createJSONStorage(() => mmkvStateStorage),
      version: 1,
    }
  )
);

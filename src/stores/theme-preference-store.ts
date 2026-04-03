import { Appearance, Platform } from 'react-native';
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

type ApplyThemePreferenceOptions = {
  allowSystemReset?: boolean;
};

const themeStorage = createMMKV({ id: 'esco.theme-preference' });
const noopStateStorage: StateStorage = {
  getItem: (): string | null => null,
  removeItem: (): void => {},
  setItem: (): void => {},
};

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

const webStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(name);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(name);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(name, value);
  },
};

function getStateStorage(): StateStorage {
  if (Platform.OS === 'web') {
    return typeof window === 'undefined' ? noopStateStorage : webStateStorage;
  }

  return mmkvStateStorage;
}

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

function readStateStorageItem(storageKey: string): string | null {
  const rawValue = getStateStorage().getItem(storageKey);
  if (typeof rawValue === 'string') return rawValue;
  return null;
}

function getStoredThemePreference(): ThemePreference {
  const rawPreferenceState = readStateStorageItem('theme-preference');

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
      name: 'theme-preference',
      partialize: (state) => ({ preference: state.preference }),
      storage: createJSONStorage(getStateStorage),
      version: 1,
    }
  )
);

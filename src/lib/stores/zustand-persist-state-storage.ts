import { Platform } from 'react-native';
import type { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const noopStateStorage: StateStorage = {
  getItem: (): string | null => null,
  removeItem: (): void => {},
  setItem: (): void => {},
};

const webStateStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {}
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch {}
  },
};

function createMmkvStateStorage(mmkv: MMKV): StateStorage {
  return {
    getItem: (name: string): string | null => mmkv.getString(name) ?? null,
    removeItem: (name: string): void => {
      mmkv.remove(name);
    },
    setItem: (name: string, value: string): void => {
      mmkv.set(name, value);
    },
  };
}

/**
 * Returns a getter suitable for `createJSONStorage(getStateStorage)` so Zustand
 * persist uses localStorage on web (with SSR noop), MMKV on native.
 */
export function createGetPersistStateStorage(mmkv: MMKV): () => StateStorage {
  const mmkvStateStorage = createMmkvStateStorage(mmkv);
  return function getStateStorage(): StateStorage {
    if (Platform.OS === 'web') {
      return typeof window === 'undefined' ? noopStateStorage : webStateStorage;
    }

    return mmkvStateStorage;
  };
}

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
 * Read the raw Zustand persist envelope synchronously for client-side bootstrap
 * (initial store state, etc.). On web without `window` (SSR/prerender/static
 * export in Node), returns `null` — do not treat as a user-cleared preference;
 * rely on persist `onRehydrateStorage` in the browser.
 *
 * Prefer this over calling `createGetPersistStateStorage(mmkv)().getItem` for
 * reads: the persist getter intentionally returns noop storage during SSR.
 */
export function readPersistEnvelopeSync(
  mmkv: MMKV,
  storageName: string
): string | null {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(storageName);
    } catch {
      return null;
    }
  }
  return mmkv.getString(storageName) ?? null;
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

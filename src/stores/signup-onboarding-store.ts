import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';
import {
  createGetPersistStateStorage,
  readPersistEnvelopeSync,
} from '@/src/lib/stores/zustand-persist-state-storage';

export type SignupOnboardingDraft = Partial<SignupOnboardingData>;

export type SignupOnboardingDraftState = {
  draft: SignupOnboardingDraft;
  resetDraft: () => void;
  setDraft: (partialDraft: SignupOnboardingDraft) => void;
};

type PersistedSignupOnboardingEnvelope = {
  state?: {
    draft?: unknown;
  };
};

const SIGNUP_ONBOARDING_DRAFT_STORAGE_KEY = 'signup-onboarding-draft';

const signupOnboardingDraftStorage = createMMKV({
  id: 'esco.signup-onboarding-draft',
});

const getStateStorage = createGetPersistStateStorage(
  signupOnboardingDraftStorage
);

function parsePersistedDraftEnvelope(
  raw: string | null
): SignupOnboardingDraft {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as PersistedSignupOnboardingEnvelope;
    const draft = parsed.state?.draft;
    if (draft != null && typeof draft === 'object' && !Array.isArray(draft)) {
      return draft as SignupOnboardingDraft;
    }
  } catch {
    // Corrupt or non-JSON storage — keep in-memory default
  }

  return {};
}

/** Seed from durable storage before async rehydrate (matches theme / language stores). */
const initialDraft = parsePersistedDraftEnvelope(
  readPersistEnvelopeSync(
    signupOnboardingDraftStorage,
    SIGNUP_ONBOARDING_DRAFT_STORAGE_KEY
  )
);

export const useSignupOnboardingDraftStore =
  create<SignupOnboardingDraftState>()(
    persist(
      (set, _get, api) => ({
        draft: initialDraft,
        resetDraft: (): void => {
          set({ draft: {} });
          api.persist.clearStorage();
        },
        setDraft: (partialDraft): void =>
          set((state) => ({
            draft: {
              ...state.draft,
              ...partialDraft,
            },
          })),
      }),
      {
        name: SIGNUP_ONBOARDING_DRAFT_STORAGE_KEY,
        partialize: (state) => ({ draft: state.draft }),
        storage: createJSONStorage(getStateStorage),
        version: 1,
        onRehydrateStorage:
          () =>
          (_state, error): void => {
            if (error != null) {
              console.error(
                '[SignupOnboardingDraft] Rehydration failed',
                error
              );
            }
          },
      }
    )
  );

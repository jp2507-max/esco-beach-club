import { createMMKV } from 'react-native-mmkv';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';
import {
  createGetPersistStateStorage,
  readPersistEnvelopeSync,
} from '@/src/lib/stores/zustand-persist-state-storage';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

export type SignupOnboardingDraft = Partial<SignupOnboardingData> & {
  ownerUserId?: string;
};

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

function normalizePermissionStatus(
  value: unknown
): OnboardingPermissionStatus | undefined {
  if (typeof value !== 'string') return undefined;

  const normalizedValue = value.trim().toUpperCase();

  if (normalizedValue === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalizedValue === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  if (normalizedValue === onboardingPermissionStatuses.undetermined) {
    return onboardingPermissionStatuses.undetermined;
  }

  return undefined;
}

function sanitizeDraft(rawDraft: unknown): SignupOnboardingDraft {
  if (!rawDraft || typeof rawDraft !== 'object' || Array.isArray(rawDraft)) {
    return {};
  }

  const parsedDraft = rawDraft as Record<string, unknown>;
  const draft: SignupOnboardingDraft = {};

  if (typeof parsedDraft.displayName === 'string') {
    const normalizedDisplayName = parsedDraft.displayName.trim();
    if (normalizedDisplayName.length > 0) {
      draft.displayName = normalizedDisplayName;
    }
  }

  if (typeof parsedDraft.dateOfBirth === 'string') {
    const normalizedDateOfBirth = parsedDraft.dateOfBirth.trim();
    if (normalizedDateOfBirth.length > 0) {
      draft.dateOfBirth = normalizedDateOfBirth;
    }
  }

  if (typeof parsedDraft.hasAcceptedPrivacyPolicy === 'boolean') {
    draft.hasAcceptedPrivacyPolicy = parsedDraft.hasAcceptedPrivacyPolicy;
  }

  if (typeof parsedDraft.hasAcceptedTerms === 'boolean') {
    draft.hasAcceptedTerms = parsedDraft.hasAcceptedTerms;
  }

  if (typeof parsedDraft.hasCompletedSetup === 'boolean') {
    draft.hasCompletedSetup = parsedDraft.hasCompletedSetup;
  }

  const normalizedMemberSegment = normalizeMemberSegment(
    typeof parsedDraft.memberSegment === 'string'
      ? parsedDraft.memberSegment
      : undefined
  );
  if (normalizedMemberSegment) {
    draft.memberSegment = normalizedMemberSegment;
  }

  const locationPermissionStatus = normalizePermissionStatus(
    parsedDraft.locationPermissionStatus
  );
  if (locationPermissionStatus) {
    draft.locationPermissionStatus = locationPermissionStatus;
  }

  const pushNotificationPermissionStatus = normalizePermissionStatus(
    parsedDraft.pushNotificationPermissionStatus
  );
  if (pushNotificationPermissionStatus) {
    draft.pushNotificationPermissionStatus = pushNotificationPermissionStatus;
  }

  if (typeof parsedDraft.ownerUserId === 'string') {
    const normalizedOwnerUserId = parsedDraft.ownerUserId.trim();
    if (normalizedOwnerUserId.length > 0) {
      draft.ownerUserId = normalizedOwnerUserId;
    }
  }

  return draft;
}

function parsePersistedDraftEnvelope(
  raw: string | null
): SignupOnboardingDraft {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as PersistedSignupOnboardingEnvelope;
    const draft = parsed.state?.draft;
    return sanitizeDraft(draft);
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
        version: 2,
        migrate: (persistedState): { draft: SignupOnboardingDraft } => {
          if (
            !persistedState ||
            typeof persistedState !== 'object' ||
            Array.isArray(persistedState)
          ) {
            return { draft: {} };
          }

          const nextState = persistedState as {
            draft?: unknown;
          };

          return {
            draft: sanitizeDraft(nextState.draft),
          };
        },
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

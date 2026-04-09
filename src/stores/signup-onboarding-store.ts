import { create } from 'zustand';

import type { SignupOnboardingData } from '@/src/lib/auth/signup-onboarding';

export type SignupOnboardingDraft = Partial<SignupOnboardingData>;

type SignupOnboardingDraftState = {
  draft: SignupOnboardingDraft;
  resetDraft: () => void;
  setDraft: (partialDraft: SignupOnboardingDraft) => void;
};

export const useSignupOnboardingDraftStore = create<SignupOnboardingDraftState>(
  (set) => ({
    draft: {},
    resetDraft: (): void => set({ draft: {} }),
    setDraft: (partialDraft): void =>
      set((state) => ({
        draft: {
          ...state.draft,
          ...partialDraft,
        },
      })),
  })
);

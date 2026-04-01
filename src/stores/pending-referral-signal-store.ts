import { create } from 'zustand';

/**
 * A lightweight signal store that bridges MMKV writes (from deep-link capture)
 * with the React effect that claims the referral. Incrementing `version`
 * causes `ReferralClaimEffect` to re-evaluate the pending code.
 */
type PendingReferralSignalState = {
  version: number;
  bump: () => void;
};

export const usePendingReferralSignal = create<PendingReferralSignalState>(
  (set) => ({
    version: 0,
    bump: (): void => set((s) => ({ version: s.version + 1 })),
  })
);

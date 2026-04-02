import { createMMKV } from 'react-native-mmkv';

import { normalizeReferralCode } from '@/src/lib/referral/referral-code';

const storage = createMMKV({ id: 'esco.pending-referral' });

const PENDING_CODE_KEY = 'pending_referral_code';

export { normalizeReferralCode } from '@/src/lib/referral/referral-code';

export function setPendingReferralCode(raw: string): boolean {
  const normalized = normalizeReferralCode(raw);
  if (!normalized) return false;
  storage.set(PENDING_CODE_KEY, normalized);
  return true;
}

/**
 * Persists a pending invite code and notifies listeners only when the normalized
 * value differs from what is already stored. Use this (with `bump` from the
 * pending-referral signal store) instead of `setPendingReferralCode` + manual
 * bumps so duplicate links do not re-trigger claim effect bookkeeping.
 */
export function updatePendingReferralCode(
  raw: string,
  onChanged: () => void
): boolean {
  const normalized = normalizeReferralCode(raw);
  if (!normalized) return false;
  if (getPendingReferralCode() === normalized) return false;
  storage.set(PENDING_CODE_KEY, normalized);
  onChanged();
  return true;
}

export function getPendingReferralCode(): string | null {
  const value = storage.getString(PENDING_CODE_KEY);
  return value && value.length > 0 ? value : null;
}

export function clearPendingReferralCode(): void {
  storage.remove(PENDING_CODE_KEY);
}

export { extractInviteCodeFromUrl } from '@/src/lib/referral/referral-code';

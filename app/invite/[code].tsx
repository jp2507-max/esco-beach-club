import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { updatePendingReferralCode } from '@/src/lib/referral/pending-referral';
import { usePendingReferralSignal } from '@/src/stores/pending-referral-signal-store';

export default function InviteDeepLinkScreen(): React.JSX.Element | null {
  const router = useRouter();
  const bumpReferralSignal = usePendingReferralSignal((s) => s.bump);
  const { isAuthenticated, isLoading } = useAuth();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const raw = params.code;
  const code = Array.isArray(raw) ? raw[0] : raw;

  useEffect(() => {
    if (isLoading) return;

    if (!code) {
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
      return;
    }

    updatePendingReferralCode(code, bumpReferralSignal);
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [bumpReferralSignal, code, isAuthenticated, isLoading, router]);

  return null;
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import type React from 'react';
import { useEffect } from 'react';

import { useAuth } from '@/providers/AuthProvider';
import { setPendingReferralCode } from '@/src/lib/referral/pending-referral';

export default function InviteDeepLinkScreen(): React.JSX.Element | null {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const raw = params.code;
  const code = Array.isArray(raw) ? raw[0] : raw;

  useEffect(() => {
    if (isLoading) return;

    if (!code || typeof code !== 'string') {
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
      return;
    }

    setPendingReferralCode(code);
    router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
  }, [code, isAuthenticated, isLoading, router]);

  return null;
}

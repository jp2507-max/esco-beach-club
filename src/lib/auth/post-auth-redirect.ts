import type { Href } from 'expo-router';

import {
  profileBootstrapStates,
  type ProfileBootstrapState,
} from '@/providers/data/context';

type ResolvePostAuthLoginHrefParams = {
  bootstrapState: ProfileBootstrapState;
  resolvedAuthFlow?: string;
};

type ShouldAutoRetryProfileProvisionParams = {
  bootstrapState: ProfileBootstrapState;
  isRetryingProvision: boolean;
  retriedProvisionUserId: string | null;
  userId: string;
};

export function resolvePostAuthLoginHref(
  params: ResolvePostAuthLoginHrefParams
): Href {
  if (params.bootstrapState === profileBootstrapStates.signedOut) {
    return '/(auth)/login';
  }

  if (params.resolvedAuthFlow) {
    return {
      pathname: '/(auth)/login',
      params: { authFlow: params.resolvedAuthFlow },
    };
  }

  return '/(auth)/login';
}

export function shouldAutoRetryProfileProvision(
  params: ShouldAutoRetryProfileProvisionParams
): boolean {
  return (
    params.bootstrapState === profileBootstrapStates.recoverableError &&
    !params.isRetryingProvision &&
    Boolean(params.userId) &&
    params.retriedProvisionUserId !== params.userId
  );
}

import {
  type ProfileBootstrapState,
  profileBootstrapStates,
} from '@/providers/data/context';

type ShouldAutoRetryProfileProvisionParams = {
  bootstrapState: ProfileBootstrapState;
  isRetryingProvision: boolean;
  retriedProvisionUserId: string | null;
  userId: string;
};

export function resolvePostAuthLoginHref(): '/(auth)/login' {
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

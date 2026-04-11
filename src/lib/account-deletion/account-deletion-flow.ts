import { type AuthProviderType, authProviderTypes } from '@/lib/types';

export const APPLE_DELETION_WARNING_STATUSES = [
  'failed',
  'missing_authorization_code',
  'not_configured',
] as const;

export type AccountDeletionRevocationStatus =
  | 'failed'
  | 'missing_authorization_code'
  | 'not_configured'
  | 'not_required'
  | 'revoked';

export type AccountDeletionRevocationResult =
  | { status: 'failed'; message: string }
  | { status: 'missing_authorization_code' }
  | { status: 'not_configured' }
  | { status: 'not_required' }
  | { status: 'revoked' };

export function isProviderSignInCanceled(error: unknown): boolean {
  return error instanceof Error && error.message === 'providerSignInCanceled';
}

export function shouldContinueAfterAppleVerificationError(
  error: unknown
): boolean {
  return !isProviderSignInCanceled(error);
}

export function shouldAttemptGoogleProviderRevocation(
  provider: AuthProviderType | null | undefined
): boolean {
  return provider === authProviderTypes.google;
}

export function isAppleDeletionWarningStatus(
  status: string | null | undefined
): status is (typeof APPLE_DELETION_WARNING_STATUSES)[number] {
  return APPLE_DELETION_WARNING_STATUSES.some(
    (candidate) => candidate === status
  );
}

export function getAppleRevocationPersistenceFields(
  revocation: AccountDeletionRevocationResult
): {
  apple_revocation_error?: string;
  apple_revocation_status?: AccountDeletionRevocationStatus;
} {
  if (revocation.status === 'not_required') {
    return {};
  }

  if (revocation.status === 'failed') {
    return {
      apple_revocation_error: revocation.message,
      apple_revocation_status: revocation.status,
    };
  }

  if (
    revocation.status === 'missing_authorization_code' ||
    revocation.status === 'not_configured'
  ) {
    return {
      apple_revocation_error: revocation.status,
      apple_revocation_status: revocation.status,
    };
  }

  return {
    apple_revocation_status: revocation.status,
  };
}

export function getAccountDeletionRevocationResponse(params: {
  provider: AuthProviderType;
  revocation: AccountDeletionRevocationResult;
}):
  | {
      message?: string;
      status: AccountDeletionRevocationStatus;
    }
  | undefined {
  if (
    params.provider !== authProviderTypes.apple &&
    params.revocation.status === 'not_required'
  ) {
    return undefined;
  }

  if (params.revocation.status === 'failed') {
    return {
      message: params.revocation.message,
      status: params.revocation.status,
    };
  }

  if (
    params.revocation.status === 'missing_authorization_code' ||
    params.revocation.status === 'not_configured'
  ) {
    return {
      message: params.revocation.status,
      status: params.revocation.status,
    };
  }

  return {
    status: params.revocation.status,
  };
}

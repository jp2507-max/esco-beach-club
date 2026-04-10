export const PROFILE_PERMISSION_DENIED_ERROR_KEY = 'profilePermissionDenied';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function mapProfileProvisionErrorToAuthKey(error: unknown): string {
  if (
    error instanceof Error &&
    error.message.trim() === PROFILE_PERMISSION_DENIED_ERROR_KEY
  ) {
    return PROFILE_PERMISSION_DENIED_ERROR_KEY;
  }

  if (
    isRecord(error) &&
    typeof error.message === 'string' &&
    error.message.trim() === PROFILE_PERMISSION_DENIED_ERROR_KEY
  ) {
    return PROFILE_PERMISSION_DENIED_ERROR_KEY;
  }

  return 'unableToCompleteProfileSetup';
}

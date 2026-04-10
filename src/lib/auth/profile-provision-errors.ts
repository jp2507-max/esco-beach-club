export const PROFILE_PERMISSION_DENIED_ERROR_KEY = 'profilePermissionDenied';

type ProfileProvisionErrorDetails = {
  canonicalProfileExists?: boolean;
  operation?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getProfileProvisionErrorDetails(
  error: unknown
): ProfileProvisionErrorDetails {
  if (!isRecord(error)) return {};

  const canonicalProfileExists =
    typeof error.canonicalProfileExists === 'boolean'
      ? error.canonicalProfileExists
      : undefined;
  const operation =
    typeof error.operation === 'string' ? error.operation : undefined;

  return {
    ...(canonicalProfileExists !== undefined ? { canonicalProfileExists } : {}),
    ...(operation ? { operation } : {}),
  };
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

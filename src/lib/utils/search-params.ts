import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';

export function readSingleSearchParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function readTrimmedSearchParam(
  value: string | string[] | undefined
): string | undefined {
  const normalized = readSingleSearchParam(value)?.trim();
  return normalized ? normalized : undefined;
}

export function parseBooleanSearchParam(
  value: string | string[] | undefined
): boolean | undefined {
  const normalized = readTrimmedSearchParam(value)?.toLowerCase();

  if (normalized === '1' || normalized === 'true') {
    return true;
  }

  if (normalized === '0' || normalized === 'false') {
    return false;
  }

  return undefined;
}

export function parseOnboardingPermissionStatusSearchParam(
  value: string | string[] | undefined
): OnboardingPermissionStatus | undefined {
  const normalized = readTrimmedSearchParam(value)?.toUpperCase();

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  if (normalized === onboardingPermissionStatuses.undetermined) {
    return onboardingPermissionStatuses.undetermined;
  }

  return undefined;
}

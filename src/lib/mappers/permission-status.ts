import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';

import { toOnboardingPermissionStatus } from './shared';

export type PushPermissionSnapshot = {
  granted?: boolean | null;
  status?: string | null;
  ios?: {
    status?: number | string | null;
  } | null;
};

const iosAuthorizationStatuses = {
  authorized: 2,
  denied: 1,
  ephemeral: 4,
  notDetermined: 0,
  provisional: 3,
} as const;

export function resolvePushPermissionStatus(
  permission: PushPermissionSnapshot
): OnboardingPermissionStatus {
  const iosStatus = permission.ios?.status;

  if (
    iosStatus === iosAuthorizationStatuses.authorized ||
    iosStatus === 'AUTHORIZED'
  ) {
    return onboardingPermissionStatuses.granted;
  }

  if (
    iosStatus === iosAuthorizationStatuses.provisional ||
    iosStatus === 'PROVISIONAL'
  ) {
    return onboardingPermissionStatuses.granted;
  }

  if (
    iosStatus === iosAuthorizationStatuses.ephemeral ||
    iosStatus === 'EPHEMERAL'
  ) {
    return onboardingPermissionStatuses.granted;
  }

  if (iosStatus === iosAuthorizationStatuses.denied || iosStatus === 'DENIED') {
    return onboardingPermissionStatuses.denied;
  }

  if (
    iosStatus === iosAuthorizationStatuses.notDetermined ||
    iosStatus === 'NOT_DETERMINED'
  ) {
    return onboardingPermissionStatuses.undetermined;
  }

  if (permission.granted) {
    return onboardingPermissionStatuses.granted;
  }

  return toOnboardingPermissionStatus(permission.status);
}

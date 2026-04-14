import {
  type MemberSegment,
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

export type SignupOnboardingData = {
  dateOfBirth?: string;
  displayName: string;
  hasCompletedSetup?: boolean;
  hasAcceptedPrivacyPolicy?: boolean;
  hasAcceptedTerms?: boolean;
  memberSegment?: MemberSegment;
  locationPermissionStatus?: OnboardingPermissionStatus;
  pushNotificationPermissionStatus?: OnboardingPermissionStatus;
};

function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeOnboardingPermissionStatus(
  value: string | undefined
): OnboardingPermissionStatus | undefined {
  if (!value) return undefined;

  const normalized = value.trim().toUpperCase();

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

export function normalizeSignupOnboardingData(
  value?: SignupOnboardingData
): SignupOnboardingData | null {
  if (!value) return null;

  const normalizedDisplayName = value.displayName?.trim() ?? '';
  const normalizedDateOfBirth = value.dateOfBirth?.trim();

  const hasValidDisplayName =
    normalizedDisplayName.length >= 2 && normalizedDisplayName.length <= 60;

  if (!hasValidDisplayName) {
    return null;
  }

  if (
    normalizedDateOfBirth !== undefined &&
    !isValidCalendarDate(normalizedDateOfBirth)
  ) {
    return null;
  }

  const normalizedMemberSegment = normalizeMemberSegment(value.memberSegment);
  const locationPermissionStatus = normalizeOnboardingPermissionStatus(
    value.locationPermissionStatus
  );
  const pushNotificationPermissionStatus = normalizeOnboardingPermissionStatus(
    value.pushNotificationPermissionStatus
  );

  const hasAcceptedTerms = value.hasAcceptedTerms === true;
  const hasAcceptedPrivacyPolicy = value.hasAcceptedPrivacyPolicy === true;
  const hasCompletedSetup = value.hasCompletedSetup === true;

  return {
    displayName: normalizedDisplayName,
    ...(normalizedDateOfBirth ? { dateOfBirth: normalizedDateOfBirth } : {}),
    ...(hasCompletedSetup ? { hasCompletedSetup } : {}),
    ...(normalizedMemberSegment
      ? { memberSegment: normalizedMemberSegment }
      : {}),
    ...(locationPermissionStatus ? { locationPermissionStatus } : {}),
    ...(pushNotificationPermissionStatus
      ? { pushNotificationPermissionStatus }
      : {}),
    ...(hasAcceptedTerms ? { hasAcceptedTerms } : {}),
    ...(hasAcceptedPrivacyPolicy ? { hasAcceptedPrivacyPolicy } : {}),
  };
}

export function hasRequiredSignupConsent(
  onboardingData: SignupOnboardingData | null
): boolean {
  return (
    onboardingData?.hasAcceptedTerms === true &&
    onboardingData?.hasAcceptedPrivacyPolicy === true
  );
}

export function extractSignInUser(result: unknown): {
  created: boolean;
  email: string | null;
  id: string | null;
} {
  if (!result || typeof result !== 'object') {
    return { created: false, email: null, id: null };
  }

  const created =
    'created' in result && typeof result.created === 'boolean'
      ? result.created
      : false;

  const userRecord =
    'user' in result && result.user && typeof result.user === 'object'
      ? result.user
      : null;

  if (!userRecord) {
    return { created, email: null, id: null };
  }

  const id =
    'id' in userRecord && typeof userRecord.id === 'string'
      ? userRecord.id
      : null;
  const email =
    'email' in userRecord && typeof userRecord.email === 'string'
      ? userRecord.email
      : null;

  return {
    created,
    email,
    id,
  };
}

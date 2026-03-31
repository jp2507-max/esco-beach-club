import { ensureProfile, updateProfile } from '@/lib/api';
import {
  type MemberSegment,
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import { normalizeMemberSegment } from '@/src/lib/utils/member-segment';

export type SignupOnboardingData = {
  dateOfBirth: string;
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

function nowIso(): string {
  return new Date().toISOString();
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

  const normalizedDisplayName = value.displayName.trim();
  const normalizedDateOfBirth = value.dateOfBirth.trim();

  const hasValidDisplayName =
    normalizedDisplayName.length >= 2 && normalizedDisplayName.length <= 60;

  if (!hasValidDisplayName || !isValidCalendarDate(normalizedDateOfBirth)) {
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
    dateOfBirth: normalizedDateOfBirth,
    displayName: normalizedDisplayName,
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

function extractSignInUser(result: unknown): {
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

export async function applyOnboardingProfileDataForNewUser(params: {
  onboardingData: SignupOnboardingData | null;
  signInResult: unknown;
}): Promise<void> {
  if (!params.onboardingData) return;

  const signInUser = extractSignInUser(params.signInResult);
  if (!signInUser.created || !signInUser.id) return;

  const profile = await ensureProfile({
    userId: signInUser.id,
    email: signInUser.email ?? undefined,
    displayName: params.onboardingData.displayName,
    dateOfBirth: params.onboardingData.dateOfBirth,
  });

  if (!profile) return;

  const needsDateOfBirthUpdate =
    profile.date_of_birth !== params.onboardingData.dateOfBirth;
  const needsFullNameUpdate =
    profile.full_name !== params.onboardingData.displayName;
  const hasMemberSegmentData =
    params.onboardingData.memberSegment !== undefined;
  const needsMemberSegmentUpdate =
    hasMemberSegmentData &&
    profile.member_segment !== params.onboardingData.memberSegment;
  const hasLocationPermissionStatus =
    params.onboardingData.locationPermissionStatus !== undefined;
  const needsLocationPermissionStatusUpdate =
    hasLocationPermissionStatus &&
    profile.location_permission_status !==
      params.onboardingData.locationPermissionStatus;
  const hasPushPermissionStatus =
    params.onboardingData.pushNotificationPermissionStatus !== undefined;
  const needsPushPermissionStatusUpdate =
    hasPushPermissionStatus &&
    profile.push_notification_permission_status !==
      params.onboardingData.pushNotificationPermissionStatus;
  const hasCompletedIdentityOnboarding =
    params.onboardingData.hasCompletedSetup === true;
  const needsCompletedAtUpdate =
    hasCompletedIdentityOnboarding && !profile.onboarding_completed_at;

  if (
    !needsDateOfBirthUpdate &&
    !needsFullNameUpdate &&
    !needsMemberSegmentUpdate &&
    !needsLocationPermissionStatusUpdate &&
    !needsPushPermissionStatusUpdate &&
    !needsCompletedAtUpdate
  ) {
    return;
  }

  await updateProfile(signInUser.id, {
    ...(needsDateOfBirthUpdate
      ? { date_of_birth: params.onboardingData.dateOfBirth }
      : {}),
    ...(needsFullNameUpdate
      ? { full_name: params.onboardingData.displayName }
      : {}),
    ...(needsMemberSegmentUpdate
      ? { member_segment: params.onboardingData.memberSegment }
      : {}),
    ...(needsLocationPermissionStatusUpdate
      ? {
          location_permission_status:
            params.onboardingData.locationPermissionStatus,
        }
      : {}),
    ...(needsPushPermissionStatusUpdate
      ? {
          push_notification_permission_status:
            params.onboardingData.pushNotificationPermissionStatus,
        }
      : {}),
    ...(needsCompletedAtUpdate ? { onboarding_completed_at: nowIso() } : {}),
  });
}

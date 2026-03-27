import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

import {
  ensureProfile,
  updateProfile,
  uploadProfilePhotoAndGetUrl,
} from '@/lib/api';
import {
  type OnboardingPermissionStatus,
  onboardingPermissionStatuses,
} from '@/lib/types';
import {
  canTryGoogleAudienceFallback,
  getAppleIdToken,
  getGoogleIdToken,
  getGoogleIdTokenWithOptions,
} from '@/src/lib/auth/social-auth';
import { isAuthErrorKey } from '@/src/lib/auth-errors';
import { db } from '@/src/lib/instant';

type SendCodeParams = {
  email: string;
};

type VerifyCodeParams = {
  code: string;
  email: string;
  onboardingData?: SignupOnboardingData;
};

export type SignupOnboardingData = {
  avatarLocalUri?: string;
  avatarMimeType?: string;
  dateOfBirth: string;
  displayName: string;
  hasCompletedSetup?: boolean;
  hasAcceptedPrivacyPolicy?: boolean;
  hasAcceptedTerms?: boolean;
  isDanangCitizen?: boolean;
  locationPermissionStatus?: OnboardingPermissionStatus;
  pushNotificationPermissionStatus?: OnboardingPermissionStatus;
};

type SignInProviderParams = {
  onboardingData?: SignupOnboardingData;
};

const DEFAULT_GOOGLE_CLIENT_NAME = 'google';

type JwtPayload = Record<string, unknown>;

function decodeJwtPayload(idToken: string): JwtPayload | null {
  const tokenParts = idToken.split('.');

  if (tokenParts.length < 2) {
    return null;
  }

  const base64Url = tokenParts[1];
  const paddedBase64 = `${base64Url}${'='.repeat((4 - (base64Url.length % 4)) % 4)}`;
  const base64 = paddedBase64.replace(/-/g, '+').replace(/_/g, '/');
  const atobFn = (globalThis as { atob?: (value: string) => string }).atob;

  if (!atobFn) {
    return null;
  }

  try {
    const decoded = atobFn(base64);
    const parsed = JSON.parse(decoded) as unknown;

    if (parsed && typeof parsed === 'object') {
      return parsed as JwtPayload;
    }

    return null;
  } catch {
    return null;
  }
}

function getIdTokenAudienceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.aud === undefined || payload.aud === null) {
    return null;
  }

  if (typeof payload.aud === 'string') {
    return payload.aud;
  }

  if (Array.isArray(payload.aud)) {
    const audValues = payload.aud.filter(
      (value): value is string => typeof value === 'string'
    );

    if (audValues.length > 0) {
      return audValues.join(',');
    }
  }

  return null;
}

function getIdTokenNonceClaim(idToken: string): string | null {
  const payload = decodeJwtPayload(idToken);

  if (!payload || payload.nonce === undefined || payload.nonce === null) {
    return null;
  }

  if (typeof payload.nonce === 'string') {
    const normalizedNonce = payload.nonce.trim();
    return normalizedNonce || null;
  }

  return null;
}

function extractAuthErrorMessage(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'body' in error &&
    error.body &&
    typeof error.body === 'object' &&
    'message' in error.body &&
    typeof error.body.message === 'string'
  ) {
    return error.body.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return null;
}

function normalizeDisplayNameForCreate(
  value: string | null | undefined
): string {
  const trimmed = value?.trim().replace(/\s+/g, ' ');

  if (!trimmed) return '';

  return trimmed.slice(0, 60);
}

function deriveDisplayNameFromEmail(email: string | null | undefined): string {
  if (!email) return '';

  const emailPrefix = email.split('@')[0]?.trim() ?? '';
  if (!emailPrefix) return '';

  const normalized = emailPrefix
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return normalizeDisplayNameForCreate(normalized);
}

function deriveDisplayNameFromIdToken(idToken: string): string {
  const payload = decodeJwtPayload(idToken);
  if (!payload) return '';

  const directClaims = [
    payload.name,
    payload.given_name,
    payload.preferred_username,
    payload.nickname,
  ];

  for (const claim of directClaims) {
    if (typeof claim !== 'string') continue;

    const normalized = normalizeDisplayNameForCreate(claim);
    if (normalized.length >= 2) return normalized;
  }

  const claimEmail = typeof payload.email === 'string' ? payload.email : null;
  return deriveDisplayNameFromEmail(claimEmail);
}

function resolveDisplayNameForCreate(params: {
  onboardingDisplayName?: string;
  email?: string | null;
  idToken?: string;
}): string {
  const fromOnboarding = normalizeDisplayNameForCreate(
    params.onboardingDisplayName
  );
  if (fromOnboarding.length >= 2) return fromOnboarding;

  if (params.idToken) {
    const fromIdToken = deriveDisplayNameFromIdToken(params.idToken);
    if (fromIdToken.length >= 2) return fromIdToken;
  }

  const fromEmail = deriveDisplayNameFromEmail(params.email);
  if (fromEmail.length >= 2) return fromEmail;

  return 'Member';
}

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

function normalizeSignupOnboardingData(
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

  const normalizedCitizenValue =
    typeof value.isDanangCitizen === 'boolean' ? value.isDanangCitizen : null;
  const locationPermissionStatus = normalizeOnboardingPermissionStatus(
    value.locationPermissionStatus
  );
  const pushNotificationPermissionStatus = normalizeOnboardingPermissionStatus(
    value.pushNotificationPermissionStatus
  );

  const hasAcceptedTerms = value.hasAcceptedTerms === true;
  const hasAcceptedPrivacyPolicy = value.hasAcceptedPrivacyPolicy === true;
  const hasCompletedSetup = value.hasCompletedSetup === true;
  const avatarLocalUri = value.avatarLocalUri?.trim() || undefined;
  const avatarMimeType = value.avatarMimeType?.trim() || undefined;

  return {
    dateOfBirth: normalizedDateOfBirth,
    displayName: normalizedDisplayName,
    ...(avatarLocalUri ? { avatarLocalUri } : {}),
    ...(avatarMimeType ? { avatarMimeType } : {}),
    ...(hasCompletedSetup ? { hasCompletedSetup } : {}),
    ...(normalizedCitizenValue !== null
      ? { isDanangCitizen: normalizedCitizenValue }
      : {}),
    ...(locationPermissionStatus ? { locationPermissionStatus } : {}),
    ...(pushNotificationPermissionStatus
      ? { pushNotificationPermissionStatus }
      : {}),
    ...(hasAcceptedTerms ? { hasAcceptedTerms } : {}),
    ...(hasAcceptedPrivacyPolicy ? { hasAcceptedPrivacyPolicy } : {}),
  };
}

function hasRequiredSignupConsent(
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

async function applyOnboardingProfileDataForNewUser(params: {
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
  const hasCitizenData =
    typeof params.onboardingData.isDanangCitizen === 'boolean';
  const needsCitizenUpdate =
    hasCitizenData &&
    profile.is_danang_citizen !== params.onboardingData.isDanangCitizen;
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

  let avatarUrlFromUpload: string | undefined;

  if (params.onboardingData.avatarLocalUri) {
    try {
      avatarUrlFromUpload = await uploadProfilePhotoAndGetUrl({
        localUri: params.onboardingData.avatarLocalUri,
        mimeType: params.onboardingData.avatarMimeType,
        userId: signInUser.id,
      });
    } catch (error: unknown) {
      console.error('[AuthProvider] Failed to upload onboarding avatar:', {
        error,
      });
    }
  }

  const needsAvatarUpdate =
    avatarUrlFromUpload !== undefined &&
    profile.avatar_url !== avatarUrlFromUpload;

  if (
    !needsDateOfBirthUpdate &&
    !needsFullNameUpdate &&
    !needsCitizenUpdate &&
    !needsLocationPermissionStatusUpdate &&
    !needsPushPermissionStatusUpdate &&
    !needsAvatarUpdate &&
    !needsCompletedAtUpdate
  ) {
    return;
  }

  await updateProfile(signInUser.id, {
    ...(needsAvatarUpdate ? { avatar_url: avatarUrlFromUpload } : {}),
    ...(needsDateOfBirthUpdate
      ? { date_of_birth: params.onboardingData.dateOfBirth }
      : {}),
    ...(needsFullNameUpdate
      ? { full_name: params.onboardingData.displayName }
      : {}),
    ...(needsCitizenUpdate
      ? { is_danang_citizen: params.onboardingData.isDanangCitizen }
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

type MapAuthErrorOptions = {
  /** Set when handling Google OAuth so oauth-client errors map without relying on server wording. */
  oauthProvider?: 'google';
};

function mapAuthErrorMessageToKey(
  message: string,
  options?: MapAuthErrorOptions
): string | null {
  const normalizedMessage = message.trim().toLowerCase();

  const isOauthClientNotFound =
    normalizedMessage.includes('record not found') &&
    (normalizedMessage.includes('oauth-client') ||
      normalizedMessage.includes('oauth_client') ||
      normalizedMessage.includes('oauth client'));

  const isGoogleAudienceMismatch =
    normalizedMessage.includes('audience') ||
    normalizedMessage.includes('claim aud') ||
    normalizedMessage.includes('invalid aud') ||
    normalizedMessage.includes('jwt aud') ||
    normalizedMessage.includes('wrong audience') ||
    normalizedMessage.includes('id token') ||
    normalizedMessage.includes('id_token') ||
    normalizedMessage.includes('token verification') ||
    normalizedMessage.includes('nonce parameter was not provided') ||
    normalizedMessage.includes('nonce') ||
    normalizedMessage.includes('nonces mismatch');

  if (!isOauthClientNotFound && !isGoogleAudienceMismatch) {
    return null;
  }

  const isGoogleScoped =
    normalizedMessage.includes('google') || options?.oauthProvider === 'google';

  if (isGoogleScoped) {
    return 'googleOauthClientNotConfigured';
  }

  return null;
}

function shouldRetryGoogleSignInWithDefaultClientName(
  error: unknown,
  clientName: string
): boolean {
  if (clientName === DEFAULT_GOOGLE_CLIENT_NAME) {
    return false;
  }

  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  return (
    message.includes('record not found:') &&
    (message.includes(clientName.toLowerCase()) ||
      message.includes('oauth-client'))
  );
}

function shouldTryGoogleAudienceFallback(error: unknown): boolean {
  const message = extractAuthErrorMessage(error)?.trim().toLowerCase();

  if (!message) {
    return false;
  }

  const mismatchMarkers = [
    'audience',
    'claim aud',
    'invalid aud',
    'jwt aud',
    'wrong audience',
    'token verification',
    'nonce parameter was not provided',
    'nonces mismatch',
  ] as const;

  return mismatchMarkers.some((marker) => message.includes(marker));
}

function toError(
  error: unknown,
  fallbackMessage: string,
  mapOptions?: MapAuthErrorOptions
): Error {
  const message = extractAuthErrorMessage(error);

  if (message) {
    const mappedKey = mapAuthErrorMessageToKey(message, mapOptions);
    if (mappedKey) {
      return new Error(mappedKey);
    }

    const normalizedMessage = message.trim();
    if (isAuthErrorKey(normalizedMessage)) {
      return new Error(normalizedMessage);
    }

    if (__DEV__) {
      return new Error(normalizedMessage);
    }

    return new Error(fallbackMessage);
  }

  return new Error(fallbackMessage);
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const { error: authError, isLoading, user } = db.useAuth();
  const [appleSignInLoading, setAppleSignInLoading] = useState<boolean>(false);
  const [googleSignInLoading, setGoogleSignInLoading] =
    useState<boolean>(false);
  const [sendCodeLoading, setSendCodeLoading] = useState<boolean>(false);
  const [verifyCodeLoading, setVerifyCodeLoading] = useState<boolean>(false);
  const [signOutLoading, setSignOutLoading] = useState<boolean>(false);
  const [appleSignInError, setAppleSignInError] = useState<Error | null>(null);
  const [googleSignInError, setGoogleSignInError] = useState<Error | null>(
    null
  );
  const [sendCodeError, setSendCodeError] = useState<Error | null>(null);
  const [verifyCodeError, setVerifyCodeError] = useState<Error | null>(null);
  const [signOutError, setSignOutError] = useState<Error | null>(null);

  function resetProviderErrors(): void {
    setAppleSignInError(null);
    setGoogleSignInError(null);
  }

  function resetEmailErrors(): void {
    setSendCodeError(null);
    setVerifyCodeError(null);
  }

  async function signInWithApple(params?: SignInProviderParams): Promise<void> {
    setAppleSignInLoading(true);
    setAppleSignInError(null);
    setGoogleSignInError(null);
    resetEmailErrors();

    try {
      const { clientName, idToken, nonce } = await getAppleIdToken();
      const hasSignupOnboardingPayload = params?.onboardingData !== undefined;

      const onboardingData = normalizeSignupOnboardingData(
        params?.onboardingData
      );
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const displayNameForCreate = resolveDisplayNameForCreate({
        idToken,
        onboardingDisplayName: onboardingData?.displayName,
      });
      const createFields = {
        display_name: displayNameForCreate,
      };

      const signInResult: unknown = await db.auth.signInWithIdToken({
        clientName,
        idToken,
        nonce,
        ...(createFields ? { extraFields: createFields } : {}),
      });

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignInWithApple');
      setAppleSignInError(nextError);
      throw nextError;
    } finally {
      setAppleSignInLoading(false);
    }
  }

  async function signInWithGoogle(
    params?: SignInProviderParams
  ): Promise<void> {
    setGoogleSignInLoading(true);
    setGoogleSignInError(null);
    setAppleSignInError(null);
    resetEmailErrors();

    try {
      const hasSignupOnboardingPayload = params?.onboardingData !== undefined;
      const onboardingData = normalizeSignupOnboardingData(
        params?.onboardingData
      );
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const primaryToken = await getGoogleIdToken();
      const { clientName, idToken } = primaryToken;
      const primaryTokenNonce = getIdTokenNonceClaim(idToken);
      const primaryDisplayNameForCreate = resolveDisplayNameForCreate({
        idToken,
        onboardingDisplayName: onboardingData?.displayName,
      });
      const primaryCreateFields = {
        display_name: primaryDisplayNameForCreate,
      };
      let signInResult: unknown = null;

      try {
        signInResult = await db.auth.signInWithIdToken({
          clientName,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
          ...(primaryCreateFields ? { extraFields: primaryCreateFields } : {}),
        });
      } catch (error: unknown) {
        if (__DEV__) {
          console.error(
            '[AuthProvider] Instant Google idToken sign-in failed',
            {
              clientName,
              error,
              extractedMessage: extractAuthErrorMessage(error),
              audience: primaryToken.audience,
              tokenAudClaim: getIdTokenAudienceClaim(idToken),
              tokenNonceClaim: primaryTokenNonce,
            }
          );
        }

        if (!shouldRetryGoogleSignInWithDefaultClientName(error, clientName)) {
          if (
            shouldTryGoogleAudienceFallback(error) &&
            canTryGoogleAudienceFallback()
          ) {
            const fallbackAudience =
              primaryToken.audience === 'ios' ? 'web' : 'ios';

            const fallbackToken = await getGoogleIdTokenWithOptions({
              audience: fallbackAudience,
              forceReconfigure: true,
            });
            const fallbackTokenNonce = getIdTokenNonceClaim(
              fallbackToken.idToken
            );
            const fallbackDisplayNameForCreate = resolveDisplayNameForCreate({
              idToken: fallbackToken.idToken,
              onboardingDisplayName: onboardingData?.displayName,
            });
            const fallbackCreateFields = {
              display_name: fallbackDisplayNameForCreate,
            };

            if (__DEV__) {
              console.error(
                '[AuthProvider] Retrying Google sign-in with fallback audience',
                {
                  fallbackAudience,
                  fallbackClientName: fallbackToken.clientName,
                  fallbackTokenAudClaim: getIdTokenAudienceClaim(
                    fallbackToken.idToken
                  ),
                  fallbackTokenNonceClaim: fallbackTokenNonce,
                }
              );
            }

            signInResult = await db.auth.signInWithIdToken({
              clientName: fallbackToken.clientName,
              idToken: fallbackToken.idToken,
              ...(fallbackTokenNonce ? { nonce: fallbackTokenNonce } : {}),
              ...(fallbackCreateFields
                ? { extraFields: fallbackCreateFields }
                : {}),
            });

            await applyOnboardingProfileDataForNewUser({
              onboardingData,
              signInResult,
            });

            return;
          }

          throw error;
        }

        signInResult = await db.auth.signInWithIdToken({
          clientName: DEFAULT_GOOGLE_CLIENT_NAME,
          idToken,
          ...(primaryTokenNonce ? { nonce: primaryTokenNonce } : {}),
          ...(primaryCreateFields ? { extraFields: primaryCreateFields } : {}),
        });
      }

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });
    } catch (error: unknown) {
      if (__DEV__) {
        console.error('[AuthProvider] Google sign-in flow failed', {
          error,
          extractedMessage: extractAuthErrorMessage(error),
        });
      }

      const nextError = toError(error, 'unableToSignInWithGoogle', {
        oauthProvider: 'google',
      });
      setGoogleSignInError(nextError);
      throw nextError;
    } finally {
      setGoogleSignInLoading(false);
    }
  }

  async function sendCode({ email }: SendCodeParams): Promise<string> {
    setSendCodeLoading(true);
    setSendCodeError(null);
    resetProviderErrors();

    try {
      const trimmedEmail = email.trim();

      if (!trimmedEmail) {
        throw new Error('emailRequired');
      }

      await db.auth.sendMagicCode({ email: trimmedEmail });
      return trimmedEmail;
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSendCode');
      setSendCodeError(nextError);
      throw nextError;
    } finally {
      setSendCodeLoading(false);
    }
  }

  async function verifyCode({
    code,
    email,
    onboardingData: rawOnboardingData,
  }: VerifyCodeParams): Promise<void> {
    setVerifyCodeLoading(true);
    setVerifyCodeError(null);
    resetProviderErrors();

    try {
      const trimmedEmail = email.trim();
      const trimmedCode = code.trim();

      if (!trimmedEmail || !trimmedCode) {
        throw new Error('emailAndCodeRequired');
      }

      const hasSignupOnboardingPayload = rawOnboardingData !== undefined;
      const onboardingData = normalizeSignupOnboardingData(rawOnboardingData);
      if (
        hasSignupOnboardingPayload &&
        !hasRequiredSignupConsent(onboardingData)
      ) {
        throw new Error('signupConsentRequired');
      }
      const displayNameForCreate = resolveDisplayNameForCreate({
        email: trimmedEmail,
        onboardingDisplayName: onboardingData?.displayName,
      });
      const createFields = {
        display_name: displayNameForCreate,
      };
      const signInResult: unknown = await db.auth.signInWithMagicCode({
        code: trimmedCode,
        email: trimmedEmail,
        ...(createFields ? { extraFields: createFields } : {}),
      });

      await applyOnboardingProfileDataForNewUser({
        onboardingData,
        signInResult,
      });
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToVerifyCode');
      setVerifyCodeError(nextError);
      throw nextError;
    } finally {
      setVerifyCodeLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    setSignOutLoading(true);
    setSignOutError(null);

    try {
      await db.auth.signOut();
    } catch (error: unknown) {
      const nextError = toError(error, 'unableToSignOut');
      setSignOutError(nextError);
      throw nextError;
    } finally {
      setSignOutLoading(false);
    }
  }

  return {
    authError,
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithApple,
    signInWithGoogle,
    sendCode,
    verifyCode,
    signOut,
    appleSignInLoading,
    googleSignInLoading,
    sendCodeLoading,
    verifyCodeLoading,
    signOutLoading,
    appleSignInError,
    googleSignInError,
    sendCodeError,
    verifyCodeError,
    signOutError,
  };
});

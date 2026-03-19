/** Auth error keys that map to i18n translations in the auth namespace */
export const AUTH_ERROR_KEYS = [
  'emailRequired',
  'emailAndCodeRequired',
  'appleAuthUnavailable',
  'appleIdTokenMissing',
  'googleAuthNotConfigured',
  'googleIdTokenMissing',
  'googlePlayServicesUnavailable',
  'providerSignInCanceled',
  'providerSignInInProgress',
  'unableToSendCode',
  'unableToSignInWithApple',
  'unableToSignInWithGoogle',
  'unableToVerifyCode',
  'unableToSignOut',
] as const;

export type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];
const AUTH_ERROR_KEY_SET: ReadonlySet<string> = new Set(AUTH_ERROR_KEYS);

export function isAuthErrorKey(message: unknown): message is AuthErrorKey {
  return typeof message === 'string' && AUTH_ERROR_KEY_SET.has(message);
}

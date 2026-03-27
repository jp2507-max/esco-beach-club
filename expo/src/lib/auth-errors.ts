/** Auth error keys that map to i18n translations in the auth namespace */
export const AUTH_ERROR_KEYS = [
  'emailRequired',
  'emailAndCodeRequired',
  'unableToSendCode',
  'unableToVerifyCode',
  'unableToSignOut',
] as const;

export type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];
const AUTH_ERROR_KEY_SET: ReadonlySet<string> = new Set(AUTH_ERROR_KEYS);

export function isAuthErrorKey(message: string): message is AuthErrorKey {
  return AUTH_ERROR_KEY_SET.has(message);
}

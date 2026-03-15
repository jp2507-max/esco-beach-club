/** Auth error keys that map to i18n translations in the auth namespace */
export const AUTH_ERROR_KEYS = [
  'emailRequired',
  'emailAndCodeRequired',
  'unableToSendCode',
  'unableToVerifyCode',
] as const;

export type AuthErrorKey = (typeof AUTH_ERROR_KEYS)[number];

export function isAuthErrorKey(message: string): message is AuthErrorKey {
  return AUTH_ERROR_KEYS.includes(message as AuthErrorKey);
}

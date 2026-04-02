import type { TFunction } from 'i18next';

import type { AccountDeletionApiResult } from '@/src/lib/account-deletion/account-deletion-api';

type AccountDeletionApiFailure = Extract<
  AccountDeletionApiResult<unknown>,
  { ok: false }
>;

export function getAccountDeletionErrorMessage(
  result: AccountDeletionApiFailure,
  t: TFunction<'profile'>,
  options?: {
    fallbackKey?: 'restoreFailed' | 'scheduleFailed';
  }
): string {
  const fallbackKey = options?.fallbackKey ?? 'scheduleFailed';

  if (result.reason === 'no_endpoint') {
    return t('deleteAccount.errors.apiUnavailable');
  }

  if (result.reason === 'network') {
    return t('deleteAccount.errors.networkUnavailable');
  }

  if (result.status === 401) {
    return t('deleteAccount.errors.sessionExpired');
  }

  if (result.status === 503 && result.code === 'instant_auth_unreachable') {
    return t('deleteAccount.errors.instantAuthUnavailable');
  }

  if (
    result.status === 503 &&
    (result.code === 'server_misconfigured' ||
      result.message === 'Missing admin or app id')
  ) {
    return t('deleteAccount.errors.serverMisconfigured');
  }

  return t(`deleteAccount.errors.${fallbackKey}`);
}

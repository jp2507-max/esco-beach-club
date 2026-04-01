import { useMemo } from 'react';

import {
  type AccountDeletionRequest,
  accountDeletionStatuses,
} from '@/lib/types';
import { db } from '@/src/lib/instant';
import {
  type InstantRecord,
  mapAccountDeletionRequest,
} from '@/src/lib/mappers';

type UseAccountDeletionRequestResult = {
  accountDeletionRequest: AccountDeletionRequest | null;
  isDeletionPending: boolean;
  isLoading: boolean;
};

export function useAccountDeletionRequest(
  userId: string | null | undefined
): UseAccountDeletionRequestResult {
  const query = db.useQuery(
    userId
      ? {
          account_deletion_requests: {
            $: {
              where: { auth_user_id: userId },
            },
          },
        }
      : null
  );

  const accountDeletionRequest = useMemo(() => {
    if (!userId) return null;

    const record = query.data?.account_deletion_requests?.[0] as
      | InstantRecord
      | undefined;

    return record ? mapAccountDeletionRequest(record) : null;
  }, [query.data, userId]);

  return useMemo(
    () => ({
      accountDeletionRequest,
      isDeletionPending:
        accountDeletionRequest?.status === accountDeletionStatuses.pending,
      isLoading: Boolean(userId) && query.isLoading,
    }),
    [accountDeletionRequest, query.isLoading, userId]
  );
}

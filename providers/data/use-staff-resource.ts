import { useMemo } from 'react';

import { db } from '@/src/lib/instant';
import { type InstantRecord, mapStaffAccess } from '@/src/lib/mappers';
import { isManagerRole, isStaffRole } from '@/src/lib/loyalty';

import type { StaffAccessData } from './context';

type StaffResourceParams = {
  userId: string;
};

export function useStaffResource(
  params: StaffResourceParams
): StaffAccessData {
  const { userId } = params;
  const staffAccessQuery = db.useQuery(
    userId
      ? {
          staff_access: {
            $: {
              where: { 'user.id': userId },
            },
            user: {},
          },
        }
      : null
  );

  const staffAccess = useMemo(() => {
    if (!userId) return null;

    const record = staffAccessQuery.data?.staff_access?.[0] as
      | InstantRecord
      | undefined;
    if (!record) return null;

    const mapped = mapStaffAccess(record);
    return { ...mapped, user_id: mapped.user_id ?? userId };
  }, [staffAccessQuery.data, userId]);

  return useMemo(
    () => ({
      isManagerUser: Boolean(
        staffAccess?.is_active && isManagerRole(staffAccess.role)
      ),
      isStaffUser: Boolean(
        staffAccess?.is_active && isStaffRole(staffAccess.role)
      ),
      staffAccess,
      staffAccessLoading: Boolean(userId) && staffAccessQuery.isLoading,
    }),
    [staffAccess, staffAccessQuery.isLoading, userId]
  );
}

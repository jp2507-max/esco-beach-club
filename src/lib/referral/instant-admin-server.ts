import { init } from '@instantdb/admin';

import schema from '@/instant.schema';
import { getInstantAppIdForServer } from '@/src/lib/referral/instant-runtime-server';

let cached: ReturnType<typeof init> | null = null;

export function getInstantAdminDb(): ReturnType<typeof init> | null {
  const appId = getInstantAppIdForServer();
  const adminToken = process.env.INSTANT_APP_ADMIN_TOKEN?.trim();
  if (!appId || !adminToken) {
    if (__DEV__) {
      console.warn('[InstantDB Admin] Missing appId or adminToken');
    }
    return null;
  }

  if (!cached) {
    cached = init({
      appId,
      adminToken,
      schema,
      useDateObjects: true,
    });
  }

  return cached;
}

import { describe, expect, test } from 'bun:test';

import { isAllowedPendingDeletionPath } from '@/src/lib/account-deletion/pending-deletion-routing';

describe('isAllowedPendingDeletionPath', () => {
  test('allows the delete-account review screen', () => {
    expect(isAllowedPendingDeletionPath('/profile/delete-account')).toBe(true);
  });

  test('allows legal and support pages', () => {
    expect(isAllowedPendingDeletionPath('/privacy')).toBe(true);
    expect(isAllowedPendingDeletionPath('/support')).toBe(true);
    expect(isAllowedPendingDeletionPath('/terms')).toBe(true);
  });

  test('blocks normal signed-in routes', () => {
    expect(isAllowedPendingDeletionPath('/home')).toBe(false);
    expect(isAllowedPendingDeletionPath('/profile')).toBe(false);
    expect(isAllowedPendingDeletionPath('/events/abc')).toBe(false);
  });
});

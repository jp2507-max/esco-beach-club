import { describe, expect, test } from 'bun:test';

import {
  buildAccountDeletionAdminErrorResponse,
  isLikelyAccountDeletionSchemaError,
} from '@/src/lib/account-deletion/account-deletion-server-errors';

describe('account deletion server error helpers', () => {
  test('detects schema drift from Instant attr-not-found errors', () => {
    expect(
      isLikelyAccountDeletionSchemaError({
        body: {
          message:
            'attr not found: account_deletion_requests.processing_lock_id',
          type: 'attr-not-found',
        },
      })
    ).toBe(true);
  });

  test('maps schema drift to a 503 schema-misconfigured response', () => {
    const response = buildAccountDeletionAdminErrorResponse({
      context: { userId: 'user_123' },
      error: {
        body: {
          message: 'entity not found: account_deletion_requests',
          type: 'entity-not-found',
        },
      },
      failureCode: 'admin_query_failed',
      operation: 'query_existing_deletion_request',
    });

    expect(response.status).toBe(503);
    expect(response.body.error).toBe('server_schema_misconfigured');
  });

  test('maps non-schema admin failures to the requested fallback code', () => {
    const response = buildAccountDeletionAdminErrorResponse({
      context: { userId: 'user_123' },
      error: new Error('admin write failed'),
      failureCode: 'admin_write_failed',
      operation: 'persist_deletion_request',
    });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('admin_write_failed');
  });
});

import { describe, expect, test } from 'bun:test';

import { posBillSyncRequestSchema } from '@/src/lib/reward-backend-contract';

describe('pos bill sync contract', () => {
  test('accepts valid ISO datetime timestamps', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          closedAt: '2026-04-06T14:03:11.000Z',
          currency: 'VND',
          paidAt: '2026-04-06T14:03:11.000Z',
          posBillId: 'BILL-1001',
          receiptReference: 'CHK-20260406-1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
          terminalId: 'BAR-01',
        },
      ],
    });

    expect(parsed.success).toBe(true);
  });

  test('rejects invalid sourceUpdatedAt timestamp values', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'VND',
          paidAt: '2026-04-06T14:03:11.000Z',
          posBillId: 'BILL-1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: 'not-a-date',
          status: 'PAID',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects date-only paidAt values without time component', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'VND',
          paidAt: '2026-04-06',
          posBillId: 'BILL-1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects unsupported currencies', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'USD',
          paidAt: '2026-04-06T14:03:11.000Z',
          posBillId: 'BILL-1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects invalid restaurantId formats', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'VND',
          paidAt: '2026-04-06T14:03:11.000Z',
          posBillId: 'BILL-1001',
          restaurantId: 'esco danang',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  test('rejects posBillId values that cannot be encoded in bill QR payloads', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'VND',
          posBillId: 'BILL 1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
          paidAt: '2026-04-06T14:03:11.000Z',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });

  test('requires paidAt when status is PAID', () => {
    const parsed = posBillSyncRequestSchema.safeParse({
      bills: [
        {
          amountVnd: 450000,
          currency: 'VND',
          posBillId: 'BILL-1001',
          restaurantId: 'ESCO_DANANG',
          sourceUpdatedAt: '2026-04-06T14:03:11.000Z',
          status: 'PAID',
        },
      ],
    });

    expect(parsed.success).toBe(false);
  });
});

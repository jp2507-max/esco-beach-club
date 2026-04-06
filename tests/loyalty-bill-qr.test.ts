import { describe, expect, test } from 'bun:test';

import {
  buildBillQrSigningPayload,
  buildBillQrValue,
  parseBillQrValue,
} from '@/src/lib/loyalty';

describe('bill qr payloads', () => {
  test('parses compact Esco bill QR payloads', () => {
    const payload = parseBillQrValue(
      'esco:bill:v1:ESCO_DANANG:BILL-1001:demo-signature-token'
    );

    expect(payload).toEqual({
      posBillId: 'BILL-1001',
      restaurantId: 'ESCO_DANANG',
      signature: 'demo-signature-token',
      version: 'v1',
    });
  });

  test('parses JSON Esco bill QR payloads', () => {
    const payload = parseBillQrValue(
      JSON.stringify({
        posBillId: 'RESTAURANT-7788',
        restaurantId: 'ESCO_DANANG',
        signature: 'demo-signature-token',
        type: 'esco_bill',
        version: 'v1',
      })
    );

    expect(payload).toEqual({
      posBillId: 'RESTAURANT-7788',
      restaurantId: 'ESCO_DANANG',
      signature: 'demo-signature-token',
      version: 'v1',
    });
  });

  test('builds compact Esco bill QR payloads', () => {
    expect(
      buildBillQrValue({
        posBillId: 'BILL-AC-77',
        restaurantId: 'ESCO_DANANG',
        signature: 'demo-signature-token',
      })
    ).toBe('esco:bill:v1:ESCO_DANANG:BILL-AC-77:demo-signature-token');
  });

  test('builds a stable signing payload for server verification', () => {
    expect(
      buildBillQrSigningPayload({
        posBillId: 'bill-ac-77',
        restaurantId: 'esco_danang',
      })
    ).toBe('esco:bill:v1:ESCO_DANANG:bill-ac-77');
  });

  test('rejects unsigned compact bill QR payloads', () => {
    expect(parseBillQrValue('esco:bill:v1:ESCO_DANANG:BILL-1001')).toBeNull();
  });
});

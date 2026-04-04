import { describe, expect, test } from 'bun:test';

import { extractInviteCodeFromUrl } from '@/src/lib/referral/referral-code';

import { redirectSystemPath } from '../app/+native-intent';

describe('referral link parsing', () => {
  test('extracts invite code from public invite URLs', () => {
    expect(
      extractInviteCodeFromUrl('https://escolife.expo.app/invite/ESCO-A1B2')
    ).toBe('ESCO-A1B2');
  });

  test('extracts invite code from app-scheme invite URLs', () => {
    expect(extractInviteCodeFromUrl('esco-beach-club://invite/ESCO-C3D4')).toBe(
      'ESCO-C3D4'
    );
  });
});

describe('native intent referral rewrite', () => {
  test('rewrites invite URLs to in-app invite route', () => {
    const rewrittenPath = redirectSystemPath({
      initial: true,
      path: 'https://escolife.expo.app/invite/ESCO-E5F6',
    });

    expect(rewrittenPath).toBe('/invite/ESCO-E5F6');
  });

  test('rewrites invite paths to normalized in-app invite route', () => {
    const rewrittenPath = redirectSystemPath({
      initial: true,
      path: '/invite/esco-g7h8',
    });

    expect(rewrittenPath).toBe('/invite/ESCO-G7H8');
  });

  test('passes through non-invite paths', () => {
    const rewrittenPath = redirectSystemPath({
      initial: false,
      path: '/(tabs)',
    });

    expect(rewrittenPath).toBe('/(tabs)');
  });
});

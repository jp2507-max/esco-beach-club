import { describe, expect, test } from 'bun:test';

import { onboardingPermissionStatuses } from '@/lib/types';
import { resolvePushPermissionStatus } from '@/src/lib/mappers';

type PushPermissionLike = Parameters<typeof resolvePushPermissionStatus>[0];

function buildPermission(
  overrides: Partial<PushPermissionLike>
): PushPermissionLike {
  return {
    canAskAgain: true,
    expires: 'never',
    granted: false,
    status: 'undetermined',
    ...overrides,
  } as PushPermissionLike;
}

describe('resolvePushPermissionStatus', () => {
  test('maps iOS authorized status to granted', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 2,
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps iOS denied status to denied', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 1,
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.denied
    );
  });

  test('maps iOS provisional status to granted', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 3,
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps iOS provisional string status to granted', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 'PROVISIONAL',
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps iOS ephemeral status to granted', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 4,
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps iOS ephemeral string status to granted', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 'EPHEMERAL',
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps iOS notDetermined status to undetermined', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 0,
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });

  test('maps iOS notDetermined string status to undetermined', () => {
    const permission = buildPermission({
      granted: false,
      ios: {
        status: 'NOT_DETERMINED',
      },
      status: 'undetermined',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });

  test('maps granted boolean to granted', () => {
    const permission = buildPermission({
      granted: true,
      status: 'denied',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('maps denied status string to denied', () => {
    const permission = buildPermission({
      granted: false,
      status: 'denied',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.denied
    );
  });

  test('maps granted status string to granted', () => {
    const permission = buildPermission({
      granted: false,
      status: 'granted',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.granted
    );
  });

  test('falls back to undetermined on unsupported status', () => {
    const permission = buildPermission({
      granted: false,
      status: 'unknown-status',
    });

    expect(resolvePushPermissionStatus(permission)).toBe(
      onboardingPermissionStatuses.undetermined
    );
  });
});

import { describe, expect, test } from 'bun:test';

import { onboardingPermissionStatuses } from '../lib/types';
import {
  parseBooleanSearchParam,
  parseOnboardingPermissionStatusSearchParam,
  readSingleSearchParam,
  readTrimmedSearchParam,
} from '../src/lib/utils/search-params';

describe('search param helpers', () => {
  test('reads the first value from array params', () => {
    expect(readSingleSearchParam(['first', 'second'])).toBe('first');
  });

  test('trims optional string params and rejects blanks', () => {
    expect(readTrimmedSearchParam('  Peter  ')).toBe('Peter');
    expect(readTrimmedSearchParam('   ')).toBeUndefined();
  });

  test('parses boolean search params', () => {
    expect(parseBooleanSearchParam('1')).toBe(true);
    expect(parseBooleanSearchParam('false')).toBe(false);
    expect(parseBooleanSearchParam(['true'])).toBe(true);
    expect(parseBooleanSearchParam('maybe')).toBeUndefined();
  });

  test('parses onboarding permission status params', () => {
    expect(parseOnboardingPermissionStatusSearchParam('granted')).toBe(
      onboardingPermissionStatuses.granted
    );
    expect(parseOnboardingPermissionStatusSearchParam('DENIED')).toBe(
      onboardingPermissionStatuses.denied
    );
    expect(parseOnboardingPermissionStatusSearchParam('undetermined')).toBe(
      onboardingPermissionStatuses.undetermined
    );
    expect(
      parseOnboardingPermissionStatusSearchParam('unknown')
    ).toBeUndefined();
  });
});

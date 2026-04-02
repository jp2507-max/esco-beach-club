import { describe, expect, test } from 'bun:test';

import rules from '../instant.perms';

describe('profiles permission whitelist', () => {
  test('does not allow auth_provider writes', () => {
    expect(rules.profiles.bind.onlySafeProfileFields).not.toContain(
      'auth_provider'
    );
  });
});

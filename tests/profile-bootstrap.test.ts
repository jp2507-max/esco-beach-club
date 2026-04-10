import { beforeEach, describe, expect, mock, test } from 'bun:test';

mock.module('@/src/lib/instant', () => ({
  db: {
    queryOnce: async () => ({ data: {} }),
    transact: async () => ({}),
    tx: {
      profiles: new Proxy(
        {},
        {
          get() {
            return {
              create(payload: Record<string, unknown>) {
                return payload;
              },
              update(payload: Record<string, unknown>) {
                return payload;
              },
            };
          },
        }
      ),
    },
  },
}));
mock.module('@/src/lib/monitoring', () => ({
  captureHandledError() {},
}));
let generatedPublicIdentifierIndex = 0;

function nextPublicIdentifier(): string {
  generatedPublicIdentifierIndex += 1;
  return `ESCO-${generatedPublicIdentifierIndex.toString().padStart(16, '0')}`;
}

mock.module('@/lib/api/shared', () => ({
  buildMemberId() {
    return nextPublicIdentifier();
  },
  buildProfileId(userId: string) {
    return userId;
  },
  buildReferralCode() {
    return nextPublicIdentifier();
  },
  firstInstantRecord(value: unknown) {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  },
  getDefaultProfileValues({
    displayName,
    userId,
  }: {
    displayName?: string;
    userId: string;
  }) {
    const now = '2026-01-01T00:00:00.000Z';
    const normalizedDisplayName = displayName
      ?.trim()
      .replace(/\s+/g, ' ')
      .slice(0, 60);

    return {
      avatar_url: null,
      bio: '',
      cashback_points_balance: 0,
      cashback_points_lifetime_earned: 0,
      created_at: now,
      date_of_birth: null,
      full_name: normalizedDisplayName || 'Member',
      has_seen_welcome_voucher: false,
      lifetime_tier_key: 'MEMBER',
      location_permission_status: 'UNDETERMINED',
      member_id: nextPublicIdentifier(),
      member_segment: null,
      member_since: now,
      next_tier_key: 'LEGEND',
      nights_left: 0,
      push_notification_permission_status: 'UNDETERMINED',
      referral_code: nextPublicIdentifier(),
      saved: 0,
      tier_progress_expires_at: null,
      tier_progress_points: 0,
      tier_progress_started_at: null,
      tier_progress_target_points: 10,
      updated_at: now,
      userId,
    };
  },
  isMemberIdConflict(error: Error) {
    return error.message.includes('member_id');
  },
  isProfileIdConflict() {
    return false;
  },
  isReferralCodeConflict(error: Error) {
    return error.message.includes('referral_code');
  },
  normalizeDateOfBirth(value: string | null | undefined) {
    return value;
  },
  normalizeMemberSince(value: string | null | undefined) {
    return value;
  },
  normalizeOnboardingCompletedAt(value: string | null | undefined) {
    return value;
  },
  normalizePermissionStatus(value: string | undefined) {
    return value;
  },
  nowIso() {
    return '2026-01-01T00:00:00.000Z';
  },
  withoutUndefined<T extends Record<string, unknown>>(value: T) {
    return Object.fromEntries(
      Object.entries(value).filter(([, current]) => current !== undefined)
    ) as Partial<T>;
  },
}));

const { ensureProfileWithDb } = await import('@/lib/api/profile');

const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';

type FakeProfileRecord = Record<string, unknown> & { id: string };

function createFakeProfileDb(initialProfiles: FakeProfileRecord[] = []) {
  const profiles = new Map<string, FakeProfileRecord>(
    initialProfiles.map((profile) => [profile.id, profile])
  );
  const queries: unknown[] = [];
  const txCalls: unknown[] = [];

  const tx = {
    profiles: new Proxy(
      {},
      {
        get(_target, id: string) {
          return {
            create(payload: Record<string, unknown>) {
              return { id, payload, type: 'create' as const };
            },
            update(payload: Record<string, unknown>) {
              return { id, payload, type: 'update' as const };
            },
          };
        },
      }
    ),
  };

  const database = {
    async queryOnce(query: Record<string, unknown>) {
      queries.push(query);

      if ('profiles' in query) {
        const profileQuery = query.profiles as {
          $?: { where?: { id?: string } };
        };
        const id = profileQuery.$?.where?.id ?? '';
        const profile = id ? profiles.get(id) : null;

        return {
          data: {
            profiles: profile ? [profile] : [],
          },
        };
      }

      if ('$users' in query) {
        return {
          data: {
            $users: [],
          },
        };
      }

      return {
        data: {},
      };
    },
    async transact(step: {
      id: string;
      payload: Record<string, unknown>;
      type: 'create' | 'update';
    }) {
      txCalls.push(step);

      if (step.type === 'create') {
        profiles.set(step.id, {
          id: step.id,
          ...step.payload,
        });
      }

      if (step.type === 'update') {
        const current = profiles.get(step.id);
        if (!current) throw new Error('missing profile');

        profiles.set(step.id, {
          ...current,
          ...step.payload,
        });
      }

      return {};
    },
    tx,
  };

  return {
    database,
    profiles,
    queries,
    txCalls,
  };
}

describe('profile bootstrap', () => {
  beforeEach(() => {
    generatedPublicIdentifierIndex = 0;
  });

  test('creates a canonical profile without requiring a user link', async () => {
    const fakeDb = createFakeProfileDb();

    const profile = await ensureProfileWithDb(
      fakeDb.database as Parameters<typeof ensureProfileWithDb>[0],
      {
        displayName: 'Alice Member',
        userId: TEST_USER_ID,
      }
    );

    expect(profile?.id).toBe(TEST_USER_ID);
    expect(profile?.full_name).toBe('Alice Member');
    expect(fakeDb.txCalls).toHaveLength(1);
    expect(fakeDb.txCalls[0]).toEqual(
      expect.objectContaining({
        id: TEST_USER_ID,
        type: 'create',
      })
    );
    expect(fakeDb.queries.some((query) => '$users' in (query as object))).toBe(
      false
    );
  });

  test('returns the canonical profile even when no user->profile link exists', async () => {
    const fakeDb = createFakeProfileDb();

    await ensureProfileWithDb(
      fakeDb.database as Parameters<typeof ensureProfileWithDb>[0],
      {
        userId: TEST_USER_ID,
      }
    );

    const storedProfile = fakeDb.profiles.get(TEST_USER_ID);
    expect(storedProfile).toBeDefined();
    expect(storedProfile?.id).toBe(TEST_USER_ID);
    expect(fakeDb.txCalls).toHaveLength(1);
    expect(fakeDb.queries.some((query) => '$users' in (query as object))).toBe(
      false
    );
  });

  test('returns an existing canonical profile without attempting repair or create', async () => {
    const fakeDb = createFakeProfileDb([
      {
        id: TEST_USER_ID,
        avatar_url: null,
        bio: '',
        cashback_points_balance: 0,
        cashback_points_lifetime_earned: 0,
        created_at: '2026-01-01T00:00:00.000Z',
        date_of_birth: null,
        full_name: 'Existing Member',
        has_seen_welcome_voucher: false,
        lifetime_tier_key: 'MEMBER',
        location_permission_status: 'UNDETERMINED',
        member_id: 'ESCO-0000000000000001',
        member_segment: null,
        member_since: '2026-01-01T00:00:00.000Z',
        next_tier_key: 'LEGEND',
        nights_left: 0,
        onboarding_completed_at: null,
        push_notification_permission_status: 'UNDETERMINED',
        referral_code: 'ESCO-0000000000000002',
        saved: 0,
        tier_progress_expires_at: null,
        tier_progress_points: 0,
        tier_progress_started_at: null,
        tier_progress_target_points: 10,
        updated_at: '2026-01-01T00:00:00.000Z',
        userId: TEST_USER_ID,
      },
    ]);

    const profile = await ensureProfileWithDb(
      fakeDb.database as Parameters<typeof ensureProfileWithDb>[0],
      {
        userId: TEST_USER_ID,
      }
    );

    expect(profile?.id).toBe(TEST_USER_ID);
    expect(profile?.full_name).toBe('Existing Member');
    expect(fakeDb.txCalls).toHaveLength(0);
    expect(fakeDb.queries.some((query) => '$users' in (query as object))).toBe(
      false
    );
  });

  test('retries when a generated public identifier hits a uniqueness conflict', async () => {
    const fakeDb = createFakeProfileDb();
    let createAttempts = 0;
    const originalTransact = fakeDb.database.transact;

    fakeDb.database.transact = async (step) => {
      if (step.type === 'create') {
        createAttempts += 1;
        if (createAttempts === 1) {
          throw new Error('unique constraint failed: member_id');
        }
      }

      return originalTransact(step);
    };

    const profile = await ensureProfileWithDb(
      fakeDb.database as Parameters<typeof ensureProfileWithDb>[0],
      {
        userId: TEST_USER_ID,
      }
    );

    expect(profile?.id).toBe(TEST_USER_ID);
    expect(createAttempts).toBe(2);
    expect(fakeDb.txCalls).toHaveLength(1);
  });
});

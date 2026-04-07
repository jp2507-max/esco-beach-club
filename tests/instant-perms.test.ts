import { describe, expect, test } from 'bun:test';

import rules from '../instant.perms';

describe('profiles permissions', () => {
  test('does not allow auth_provider on create', () => {
    expect(rules.profiles.bind.onlySafeProfileCreateFields).not.toContain(
      'auth_provider'
    );
  });

  test('allows auth_provider updates only through the guarded update path', () => {
    expect(rules.profiles.bind.onlySafeProfileUpdateFields).toContain(
      'auth_provider'
    );
    expect(rules.profiles.bind.canSetAuthProviderOnce).toContain(
      'data.auth_provider == null'
    );
    expect(rules.profiles.bind.canSetAuthProviderOnce).toContain('apple');
    expect(rules.profiles.bind.canSetAuthProviderOnce).toContain('google');
    expect(rules.profiles.bind.canSetAuthProviderOnce).toContain('magic_code');
  });

  test('removes broad reads from profiles and reward transactions', () => {
    expect(rules.profiles.allow.view).toBe('isOwnerOrLinkedProfile');
    expect(rules.reward_transactions.allow.view).toBe('isMemberOwner');
  });

  test('creates profiles only for the authenticated user id', () => {
    expect(rules.profiles.bind.canCreateOwnedProfile).toBe('isOwner');
    expect(rules.profiles.allow.create).toContain('canCreateOwnedProfile');
    expect(rules.profiles.allow.create).toContain(
      'hasValidProfileCreateValues'
    );
    expect(rules.profiles.allow.create).toContain(
      'onlySafeProfileCreateFields'
    );
  });

  test('keeps owner checks compatible with linked and deterministic profile ids', () => {
    expect(rules.profiles.bind.isOwner).toContain('auth.id == data.id');
    expect(rules.profiles.bind.isOwner).toContain(
      "auth.id in data.ref('user.id')"
    );
  });
});

describe('owner-scoped create permissions', () => {
  test('whitelists saved event fields', () => {
    expect(rules.saved_events.bind.onlySafeSavedEventFields).toContain(
      'created_at'
    );
    expect(rules.saved_events.bind.onlySafeSavedEventFields).toContain(
      'entry_key'
    );
    expect(rules.saved_events.bind.onlySafeSavedEventFields).toContain(
      'event_id'
    );
  });

  test('locks partner redemptions to claimed status on create', () => {
    expect(
      rules.partner_redemptions.bind.onlySafePartnerRedemptionFields
    ).toContain('status');
    expect(rules.partner_redemptions.bind.hasClaimedStatusOnly).toContain(
      "data.status == 'claimed'"
    );
  });

  test('locks table reservations to pending status on create', () => {
    expect(
      rules.table_reservations.bind.onlySafeTableReservationFields
    ).toContain('status');
    expect(rules.table_reservations.bind.hasPendingStatusOnly).toContain(
      "data.status == 'pending'"
    );
    expect(
      rules.table_reservations.bind.hasValidReservationContactEmail
    ).toContain('contact_email.matches');
    expect(
      rules.table_reservations.bind.hasValidReservationContactEmail
    ).toContain('data.contact_email.size() <= 254');
    expect(
      rules.table_reservations.bind.hasValidReservationContactEmail
    ).not.toContain('data.contact_email == null');
    expect(
      rules.table_reservations.bind.hasValidReservationSpecialRequest
    ).toContain('special_request.matches');
    expect(
      rules.table_reservations.bind.hasValidReservationSpecialRequest
    ).toContain('data.special_request.size() <= 500');
  });

  test('validates review ratings in permissions', () => {
    expect(rules.reviews.bind.onlySafeReviewFields).toContain('rating');
    expect(rules.reviews.bind.hasValidRating).toContain('data.rating >= 1');
    expect(rules.reviews.bind.hasValidRating).toContain('data.rating <= 5');
  });
});

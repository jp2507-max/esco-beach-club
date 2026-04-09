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
    expect(rules.profiles.bind.canCreateOwnedProfile).toBe('isSelfProfileId');
    expect(rules.profiles.bind.onlySafeProfileCreateFields).toContain('userId');
    expect(rules.profiles.bind.onlySafeProfileCreateFields).not.toContain(
      'onboarding_completed_at'
    );
    expect(rules.profiles.bind.canSetSelfUserLink).toContain(
      "!('userId' in request.modifiedFields)"
    );
    expect(rules.profiles.bind.canSetSelfUserLink).toContain(
      'auth.id == newData.userId'
    );
    expect(rules.profiles.bind.canSetSelfUserIdOnCreate).toContain(
      'auth.id == data.userId'
    );
    expect(rules.profiles.allow.create).toContain('canCreateOwnedProfile');
    expect(rules.profiles.allow.create).toContain('canSetSelfUserIdOnCreate');
    expect(rules.profiles.allow.create).toContain(
      'hasValidProfileCreateValues'
    );
    expect(rules.profiles.allow.create).toContain(
      'onlySafeProfileCreateFields'
    );
    expect(rules.profiles.bind.hasValidProfileCreateValues).toContain(
      'data.userId == data.id'
    );
    expect(rules.profiles.bind.hasValidProfileCreateValues).toContain(
      "!('onboarding_completed_at' in request.modifiedFields)"
    );
    expect(rules.profiles.bind.hasValidProfileCreateValues).toContain(
      'data.onboarding_completed_at == null'
    );
  });

  test('keeps owner checks compatible with linked and deterministic profile ids', () => {
    expect(rules.profiles.bind.isOwner).toContain('auth.id == data.id');
    expect(rules.profiles.bind.isOwner).toContain(
      "auth.id in data.ref('user.id')"
    );
    expect(rules.profiles.bind.onlySafeProfileUpdateFields).toContain('userId');
    expect(rules.profiles.bind.hasValidProfileUpdates).toContain(
      'canSetSelfUserLink'
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
    expect(rules.partner_redemptions.bind.hasClaimedStatusOnly).toBe(
      "data.status == 'claimed'"
    );
    expect(rules.partner_redemptions.allow.create).toContain(
      'hasClaimedStatusOnly'
    );
  });

  test('locks table reservations to pending status on create', () => {
    expect(
      rules.table_reservations.bind.onlySafeTableReservationFields
    ).toContain('status');
    expect(rules.table_reservations.bind.hasPendingStatusOnly).toBe(
      "data.status == 'pending'"
    );
    expect(rules.table_reservations.allow.create).toContain(
      'hasPendingStatusOnly'
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

  test('requires create whitelist guards for owner-scoped entities', () => {
    expect(rules.saved_events.allow.create).toContain(
      'onlySafeSavedEventFields'
    );
    expect(rules.partner_redemptions.allow.create).toContain(
      'onlySafePartnerRedemptionFields'
    );
    expect(rules.table_reservations.allow.create).toContain(
      'onlySafeTableReservationFields'
    );
    expect(rules.private_event_inquiries.allow.create).toContain(
      'onlySafePrivateEventInquiryFields'
    );
  });

  test('does not whitelist sensitive or server-owned fields on create', () => {
    expect(rules.saved_events.bind.onlySafeSavedEventFields).not.toContain(
      'owner'
    );

    expect(
      rules.partner_redemptions.bind.onlySafePartnerRedemptionFields
    ).not.toContain('claimed_at');
    expect(
      rules.partner_redemptions.bind.onlySafePartnerRedemptionFields
    ).not.toContain('owner');

    expect(
      rules.table_reservations.bind.onlySafeTableReservationFields
    ).not.toContain('owner');

    expect(
      rules.private_event_inquiries.bind.onlySafePrivateEventInquiryFields
    ).not.toContain('owner');
    expect(
      rules.private_event_inquiries.bind.onlySafePrivateEventInquiryFields
    ).not.toContain('status');
  });
});

describe('linked ownership read gates', () => {
  test('protects reward transactions behind member->user ownership', () => {
    expect(rules.reward_transactions.allow.view).toBe('isMemberOwner');
    expect(rules.reward_transactions.bind.isMemberOwner).toContain(
      "auth.id in data.ref('member.user.id')"
    );
  });

  test('protects referrals behind referrer->user ownership', () => {
    expect(rules.referrals.allow.view).toContain(
      "auth.id in data.ref('referrer.user.id')"
    );
    expect(rules.referrals.allow.view).toContain('auth.id != null');
  });
});

describe('default deny posture for sensitive entities', () => {
  test('keeps pos bills inaccessible to client permissions', () => {
    expect(rules.pos_bills.allow.view).toBe('false');
    expect(rules.pos_bills.allow.create).toBe('false');
    expect(rules.pos_bills.allow.update).toBe('false');
    expect(rules.pos_bills.allow.delete).toBe('false');
  });

  test('uses owner-scoped path guard for profile photos', () => {
    expect(rules.$files.bind.isOwnerPath).toContain('profile-photos/');
    expect(rules.$files.bind.isOwnerPath).toContain('data.path.startsWith(');
    expect(rules.$files.allow.view).toBe('isOwnerPath');
    expect(rules.$files.allow.create).toBe('isOwnerPath');
  });
});

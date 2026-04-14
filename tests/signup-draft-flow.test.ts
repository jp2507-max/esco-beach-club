import { describe, expect, test } from 'bun:test';

import {
  hasAnySignupDraftValues,
  resolveSignupDraftFlow,
} from '@/src/lib/auth/signup-draft-flow';

describe('signup draft flow resolution', () => {
  const readySignupDraft = {
    displayName: 'Member A',
    hasAcceptedPrivacyPolicy: true,
    hasAcceptedTerms: true,
    hasCompletedSetup: true,
  };

  test('does not infer signup flow from a foreign owned draft', () => {
    const resolution = resolveSignupDraftFlow({
      authFlow: undefined,
      draft: {
        ...readySignupDraft,
        ownerUserId: 'user-a',
      },
      userId: 'user-b',
    });

    expect(resolution.resolvedAuthFlow).toBeUndefined();
    expect(resolution.hasSignupFinalDetailsContext).toBe(false);
    expect(resolution.shouldResetSignupDraft).toBe(true);
  });

  test('clears legacy unowned complete drafts for authenticated users', () => {
    const resolution = resolveSignupDraftFlow({
      authFlow: undefined,
      draft: readySignupDraft,
      userId: 'user-b',
    });

    expect(resolution.resolvedAuthFlow).toBeUndefined();
    expect(resolution.hasUnownedReadySignupDraft).toBe(true);
    expect(resolution.shouldResetSignupDraft).toBe(true);
  });

  test('binds owner during explicit signup flow when draft is ready', () => {
    const resolution = resolveSignupDraftFlow({
      authFlow: 'signup',
      draft: readySignupDraft,
      userId: 'user-b',
    });

    expect(resolution.resolvedAuthFlow).toBe('signup');
    expect(resolution.hasSignupFinalDetailsContext).toBe(true);
    expect(resolution.shouldBindSignupDraftOwner).toBe(true);
    expect(resolution.shouldResetSignupDraft).toBe(false);
  });

  test('rejects explicit signup flow when draft owner belongs to another user', () => {
    const resolution = resolveSignupDraftFlow({
      authFlow: 'signup',
      draft: {
        ...readySignupDraft,
        ownerUserId: 'user-a',
      },
      userId: 'user-b',
    });

    expect(resolution.resolvedAuthFlow).toBe('signup');
    expect(resolution.hasForeignSignupDraftOwner).toBe(true);
    expect(resolution.hasSignupFinalDetailsContext).toBe(false);
    expect(resolution.shouldResetSignupDraft).toBe(true);
  });

  test('infers signup flow only for owned complete drafts', () => {
    const resolution = resolveSignupDraftFlow({
      authFlow: undefined,
      draft: {
        ...readySignupDraft,
        ownerUserId: 'user-b',
      },
      userId: 'user-b',
    });

    expect(resolution.isSignupDraftOwnedByAuthenticatedUser).toBe(true);
    expect(resolution.resolvedAuthFlow).toBe('signup');
    expect(resolution.hasSignupFinalDetailsContext).toBe(true);
    expect(resolution.shouldResetSignupDraft).toBe(false);
  });

  test('ignores owner-only payloads when checking for meaningful draft content', () => {
    expect(hasAnySignupDraftValues({ ownerUserId: 'user-a' })).toBe(false);
  });
});

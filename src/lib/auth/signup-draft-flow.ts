import type { SignupOnboardingDraft } from '@/src/stores/signup-onboarding-store';

type ResolveSignupDraftFlowParams = {
  authFlow?: string;
  draft: SignupOnboardingDraft;
  userId?: string | null;
};

export type SignupDraftFlowResolution = {
  hasAnySignupDraft: boolean;
  hasForeignSignupDraftOwner: boolean;
  hasSignupFinalDetailsContext: boolean;
  hasUnownedReadySignupDraft: boolean;
  isSignupDraftOwnedByAuthenticatedUser: boolean;
  isSignupDraftReadyForFinalDetails: boolean;
  resolvedAuthFlow: string | undefined;
  shouldBindSignupDraftOwner: boolean;
  shouldResetSignupDraft: boolean;
};

export function hasAnySignupDraftValues(draft: SignupOnboardingDraft): boolean {
  const { ownerUserId: _ownerUserId, ...signupOnboardingFields } = draft;
  return Object.values(signupOnboardingFields).some(
    (value) => value !== undefined
  );
}

export function isSignupDraftReadyForFinalDetails(
  draft: SignupOnboardingDraft
): boolean {
  return (
    draft.hasCompletedSetup === true &&
    draft.hasAcceptedPrivacyPolicy === true &&
    draft.hasAcceptedTerms === true &&
    Boolean(draft.displayName)
  );
}

export function resolveSignupDraftFlow(
  params: ResolveSignupDraftFlowParams
): SignupDraftFlowResolution {
  const hasAnySignupDraft = hasAnySignupDraftValues(params.draft);
  const isSignupDraftReady = isSignupDraftReadyForFinalDetails(params.draft);

  const normalizedAuthFlow = params.authFlow?.trim();
  const authFlow = normalizedAuthFlow ? normalizedAuthFlow : undefined;

  const normalizedUserId = params.userId?.trim();
  const userId = normalizedUserId ? normalizedUserId : undefined;

  const normalizedDraftOwnerUserId = params.draft.ownerUserId?.trim();
  const draftOwnerUserId = normalizedDraftOwnerUserId
    ? normalizedDraftOwnerUserId
    : undefined;

  const isSignupDraftOwnedByAuthenticatedUser =
    userId != null && draftOwnerUserId === userId;
  const hasForeignSignupDraftOwner =
    userId != null && draftOwnerUserId != null && draftOwnerUserId !== userId;
  const hasUnownedReadySignupDraft =
    isSignupDraftReady && draftOwnerUserId == null;

  const resolvedAuthFlow =
    authFlow ??
    (isSignupDraftReady && isSignupDraftOwnedByAuthenticatedUser
      ? 'signup'
      : undefined);

  const hasSignupFinalDetailsContext =
    resolvedAuthFlow === 'signup' &&
    isSignupDraftReady &&
    !hasForeignSignupDraftOwner;

  const shouldBindSignupDraftOwner =
    authFlow === 'signup' &&
    userId != null &&
    isSignupDraftReady &&
    draftOwnerUserId == null;

  const shouldResetSignupDraft =
    userId != null &&
    hasAnySignupDraft &&
    (hasForeignSignupDraftOwner ||
      (authFlow !== 'signup' && hasUnownedReadySignupDraft));

  return {
    hasAnySignupDraft,
    hasForeignSignupDraftOwner,
    hasSignupFinalDetailsContext,
    hasUnownedReadySignupDraft,
    isSignupDraftOwnedByAuthenticatedUser,
    isSignupDraftReadyForFinalDetails: isSignupDraftReady,
    resolvedAuthFlow,
    shouldBindSignupDraftOwner,
    shouldResetSignupDraft,
  };
}

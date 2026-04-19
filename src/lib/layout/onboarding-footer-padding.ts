const ONBOARDING_FOOTER_MIN_BOTTOM_INSET = 12;
const ONBOARDING_FOOTER_BOTTOM_OFFSET = 8;

export function computeOnboardingFooterPadding(bottomInset: number): number {
  return (
    Math.max(bottomInset, ONBOARDING_FOOTER_MIN_BOTTOM_INSET) +
    ONBOARDING_FOOTER_BOTTOM_OFFSET
  );
}

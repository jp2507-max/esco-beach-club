function toOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOptionalUrlOrigin(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  try {
    return new URL(trimmedValue).origin;
  } catch {
    return null;
  }
}

const restaurantLatitude = toOptionalNumber(
  process.env.EXPO_PUBLIC_RESTAURANT_LATITUDE
);
const restaurantLongitude = toOptionalNumber(
  process.env.EXPO_PUBLIC_RESTAURANT_LONGITUDE
);
const restaurantRadiusMeters =
  toOptionalNumber(process.env.EXPO_PUBLIC_RESTAURANT_RADIUS_METERS) ?? 90;
const defaultPublicSiteUrl = 'https://escolife.expo.app';
const publicSiteUrl =
  process.env.EXPO_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  toOptionalUrlOrigin(process.env.EXPO_PUBLIC_SUPPORT_URL) ||
  toOptionalUrlOrigin(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL) ||
  toOptionalUrlOrigin(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL) ||
  defaultPublicSiteUrl;

const restaurantGeofence =
  restaurantLatitude !== null && restaurantLongitude !== null
    ? {
        latitude: restaurantLatitude,
        longitude: restaurantLongitude,
        radiusMeters: restaurantRadiusMeters,
      }
    : null;

export const config = {
  app: {
    inviteBaseUrl: `${publicSiteUrl}/invite`,
    publicSiteUrl,
  },
  contact: {
    conciergeBase: process.env.EXPO_PUBLIC_CONCIERGE_PHONE
      ? `https://wa.me/${process.env.EXPO_PUBLIC_CONCIERGE_PHONE}`
      : null,
    supportEmail:
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ||
      'booking@escobeach-danang.com',
    supportUrl:
      process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() || `${publicSiteUrl}/support`,
  },
  /** Bundled hero image for onboarding welcome screen. */
  heroImage: require('@/assets/images/splash-icon.png'),
  legal: {
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ||
      `${publicSiteUrl}/privacy`,
    termsOfServiceUrl:
      process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim() ||
      `${publicSiteUrl}/terms`,
  },
  onboardingClubVoucher: {
    code: process.env.EXPO_PUBLIC_ONBOARDING_VOUCHER_CODE?.trim() || 'ES-2026',
    scope:
      process.env.EXPO_PUBLIC_ONBOARDING_VOUCHER_SCOPE?.trim() ||
      'all Club Cabanas',
  },
  restaurantPresence: {
    geofence: restaurantGeofence,
    notificationCooldownMs: 1000 * 60 * 60 * 3,
  },
} as const;

function toOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const restaurantLatitude = toOptionalNumber(
  process.env.EXPO_PUBLIC_RESTAURANT_LATITUDE
);
const restaurantLongitude = toOptionalNumber(
  process.env.EXPO_PUBLIC_RESTAURANT_LONGITUDE
);
const restaurantRadiusMeters =
  toOptionalNumber(process.env.EXPO_PUBLIC_RESTAURANT_RADIUS_METERS) ?? 90;

const restaurantGeofence =
  restaurantLatitude !== null && restaurantLongitude !== null
    ? {
        latitude: restaurantLatitude,
        longitude: restaurantLongitude,
        radiusMeters: restaurantRadiusMeters,
      }
    : null;

export const config = {
  contact: {
    conciergeBase: process.env.EXPO_PUBLIC_CONCIERGE_PHONE
      ? `https://wa.me/${process.env.EXPO_PUBLIC_CONCIERGE_PHONE}`
      : null,
    supportEmail:
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@escolife.com',
    supportUrl:
      process.env.EXPO_PUBLIC_SUPPORT_URL?.trim() ||
      'https://escolife.app/support',
  },
  /** Bundled hero image for onboarding welcome screen. */
  heroImage: require('@/assets/images/splash-icon.png'),
  legal: {
    privacyPolicyUrl:
      process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL?.trim() ||
      'https://escolife.app/privacy',
    termsOfServiceUrl:
      process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL?.trim() ||
      'https://escolife.app/terms',
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

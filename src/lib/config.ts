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
  },
  /** Bundled hero image for onboarding welcome screen. */
  heroImage: require('@/assets/images/splash-icon.png'),
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

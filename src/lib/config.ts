function toOptionalNumber(value: string | undefined): number | null {
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toOptionalHttpUrl(value: string | undefined): string | null {
  const trimmedValue = value?.trim();
  if (!trimmedValue) return null;

  try {
    const parsedUrl = new URL(trimmedValue);
    if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
      return null;
    }

    const hasOnlyRootPath =
      parsedUrl.pathname === '/' && !parsedUrl.search && !parsedUrl.hash;
    if (hasOnlyRootPath) return parsedUrl.origin;

    parsedUrl.pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
    return parsedUrl.toString();
  } catch {
    return null;
  }
}

function toOptionalUrlOrigin(value: string | undefined): string | null {
  const parsedUrl = toOptionalHttpUrl(value);
  return parsedUrl ? new URL(parsedUrl).origin : null;
}

function toOptionalUrl(value: string | undefined): string | null {
  return toOptionalHttpUrl(value);
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
  toOptionalHttpUrl(process.env.EXPO_PUBLIC_APP_URL) ||
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
    facebookUrl:
      toOptionalUrl(process.env.EXPO_PUBLIC_FACEBOOK_URL) ||
      'https://www.facebook.com/escobeachdanang/',
    instagramUrl:
      toOptionalUrl(process.env.EXPO_PUBLIC_INSTAGRAM_URL) ||
      'https://www.instagram.com/escobeachdanang/',
    supportEmail:
      process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ||
      'booking@escobeach-danang.com',
    supportUrl:
      toOptionalHttpUrl(process.env.EXPO_PUBLIC_SUPPORT_URL) ||
      `${publicSiteUrl}/support`,
  },
  /** Bundled hero image for onboarding welcome screen. */
  heroImage: require('@/assets/images/splash-icon.png'),
  legal: {
    privacyPolicyUrl:
      toOptionalHttpUrl(process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL) ||
      `${publicSiteUrl}/privacy`,
    termsOfServiceUrl:
      toOptionalHttpUrl(process.env.EXPO_PUBLIC_TERMS_OF_SERVICE_URL) ||
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

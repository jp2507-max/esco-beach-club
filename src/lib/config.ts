export const config = {
  contact: {
    conciergeBase: process.env.EXPO_PUBLIC_CONCIERGE_PHONE
      ? `https://wa.me/${process.env.EXPO_PUBLIC_CONCIERGE_PHONE}`
      : null,
    supportEmail: 'support@escolife.com',
  },
  /** Fallback avatar URL when profile has no avatar_url. Uses bundled local asset for offline reliability. */
  defaultAvatarUri: require('@/assets/images/default-avatar.png'),
} as const;

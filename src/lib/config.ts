export const config = {
  contact: {
    conciergeBase: process.env.EXPO_PUBLIC_CONCIERGE_PHONE
      ? `https://wa.me/${process.env.EXPO_PUBLIC_CONCIERGE_PHONE}`
      : null,
    supportEmail: 'support@escolife.com',
  },
  /** Fallback avatar URL when profile has no avatar_url. Uses bundled local asset for offline reliability. */
  defaultAvatarUri: require('@/assets/images/default-avatar.png'),
  /** Hero image for onboarding welcome screen with local fallback */
  heroImage: {
    uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBcsRyUs7Nt6b970dKL7SGP0zKuc5VeNDrXUoR_XkRjTieEkpekdAo6Yw419E2YEIKsXSSNFtEi_mqn6_b4zHi3FULuzfNMbRRSFQJzQl9iUwFdzCAiaCQWsnW4xq5EZ2YAn9MApXiRr96sdWYf6kjD1jqgzwH1xxit4vvJDwrnwHUEtaXuPaGRsvpdVj88rcmnCKwJdBJhc0xsxEpXd4iF2BupN7BJ342wU5Habzkn44SfRnEFEBa7nXb44Wasc3N4IgelmQyfl7Fl',
    fallback: require('@/assets/images/default-avatar.png'),
  },
} as const;

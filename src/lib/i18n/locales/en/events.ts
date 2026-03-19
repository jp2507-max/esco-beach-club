const events = {
  title: 'Events',
  searchPlaceholder: 'Search events, artists...',
  categories: {
    allEvents: 'All Events',
    parties: 'Parties',
    liveMusic: 'Live Music',
    wellness: 'Wellness',
    dining: 'Dining',
  },
  featuredPrice: 'PRICE',
  privatePartyTitle: 'Plan a Private Party instead?',
  privatePartyDescription: 'Birthdays, corporate events & more',
  attendeesCount: '{{count}} attending',
  aboutThisEvent: 'About This Event',
  aboutDescription1: 'Join us for an unforgettable evening at {{location}}.',
  aboutDescription2:
    'Experience the best of Esco Life with live entertainment, premium drinks, and an incredible atmosphere.',
  aboutDescription3:
    'Perfect for making memories with friends and meeting new people.',
  chooseExperience: 'Choose Your Experience',
  selectTier: 'Select a tier that fits your vibe',
  recommended: 'RECOMMENDED',
  perPerson: 'per person',
  from: 'From',
  bookNow: 'Book Now',
  eventNotFound: 'Event not found',
  goBack: 'Go Back',
  shareEvent: 'Share event',
  likeEvent: 'Like event',
  unlikeEvent: 'Unlike event',
  saveEvent: 'Save event',
  removeSavedEvent: 'Remove saved event',
  shareMessage: 'Check out {{title}} at {{location}} on {{date}} at {{time}}!',
  priceTiers: {
    contactForPricing: 'Contact for pricing',
    vip: {
      label: 'VIP',
      perk1: 'Priority seating',
      perk2: 'Welcome drink',
      perk3: 'Backstage access',
    },
    member: {
      label: 'Member',
      perk1: 'Reserved area',
      perk2: 'Complimentary snacks',
    },
    guest: {
      label: 'Guest',
      perk1: 'General admission',
      perk2: 'Cash bar',
    },
  },
} as const;

export default events;

const perks = {
  title: 'Perks',
  categories: {
    all: 'All',
    hotels: 'Hotels',
    travel: 'Travel',
    dining: 'Dining',
    wellness: 'Wellness',
  },
  partner: {
    notFound: 'Partner not found',
    unlocked: 'UNLOCKED',
    congratulations: 'Congratulations!',
    benefitsDescription:
      'Enjoy exclusive benefits at {{name}}. {{description}}.',
    claiming: 'Claiming...',
    exclusive: 'Exclusive',
    discount: 'Discount',
    vipPerk: 'VIP Perk',
    redemptionFailedTitle: 'Perk Claim Failed',
    redemptionFailedMessage:
      'Could not save your perk claim right now. Please try again.',
    yourDiscountCode: 'YOUR DISCOUNT CODE',
    enjoyMyPerks: 'Enjoy my Perks',
    maybeLater: 'Maybe later',
    maybeLaterHint: 'Returns to previous screen',
    close: 'Close',
    closeHint: 'Closes the partner detail modal',
  },
} as const;

export default perks;

const profile = {
  guest: 'Guest',
  memberFallback: 'MEMBER',
  tier: {
    member: 'Esco Life Member',
    legend: 'Esco Life Legend',
  },
  menu: {
    comingSoon: 'Coming soon',
    editProfile: 'Edit Profile',
    inviteEarn: 'Invite & Earn',
    rateUs: 'Rate Us',
    membership: 'Membership',
    rewards: 'Rewards',
    savedEvents: 'Saved Events',
    settings: 'Settings',
    helpSupport: 'Help & Support',
    logOut: 'Log Out',
    deleteAccount: 'Delete Account',
  },
  notifications: {
    title: 'Notifications',
    hint: 'Opens notifications',
  },
  welcomeBack: 'Welcome back,',
  edit: 'Edit',
  brandPrefix: 'Esco',
  brandHighlight: 'Life',
  accessPass: 'ACCESS PASS',
  scanAtTable: 'Scan at checkout to link your member ID',
  refPrefix: 'Ref: {{memberId}}',
  billScanner: {
    balanceLabel: 'Points',
    cameraPermissionDescription:
      'We use the camera to scan your bill QR so points are credited the moment this tab opens.',
    cameraPermissionTitle: 'Camera access unlocks instant points',
    errorEyebrow: 'Try another scan',
    errorTitle: 'That bill QR could not be processed',
    eyebrow: 'LIVE REWARD SCAN',
    fallbackCta: 'Show my member QR instead',
    fallbackDescription:
      'Use your member QR only if the venue still needs to link points manually.',
    fallbackEyebrow: 'Fallback access',
    fallbackHint: 'Opens your member QR card as a fallback',
    fallbackTitle: 'Member QR fallback',
    frameHint: 'Place the bill QR inside the frame',
    grantPermission: 'Continue',
    grantPermissionHint:
      'Requests camera access, or opens settings if access was previously denied',
    liveBadge: 'Scanner live',
    loadingDescription:
      'Preparing the camera and your reward scanner settings.',
    loadingTitle: 'Starting the scanner',
    memberQrUnavailable: 'Your member QR is unavailable right now.',
    permissionEyebrow: 'Camera required',
    pointsRuleLabel: 'Earn rate',
    pointsRuleValue: '{{points}} pt / {{amount}}',
    processingDescription:
      'Hold steady while we validate the bill and update your balance.',
    processingEyebrow: 'Verifying bill',
    processingTitle: 'Adding points to your account',
    readyDescription:
      'The scanner is already live. Aim at the QR printed on the bill to claim your points.',
    readyTitle: 'Scan the bill QR to earn points',
    scanAgain: 'Scan another bill',
    scanAgainHint: 'Resets the scanner so you can scan another bill',
    securityNote:
      'Each receipt reference can only be claimed once for your account.',
    subtitle:
      'This tab now opens straight into the camera so members can claim bill points themselves.',
    successDescription:
      '{{amount}} from bill {{reference}} has been posted to your reward balance.',
    successEyebrow: 'Points added',
    successTitle: '{{points}} points secured',
    title: 'Scan the bill. Keep the points.',
    errors: {
      billBelowMinimumSpend:
        'This bill does not meet the minimum spend threshold for points.',
      billNotPaid:
        'This bill is not marked as paid yet. Please settle it first and retry.',
      billNotSynced:
        'This bill has not synced from the restaurant POS yet. Please retry in a few seconds.',
      billDataCorrupt:
        'This bill record could not be read correctly. Please ask staff to verify the receipt or try again shortly.',
      generic:
        'Something went wrong while processing this bill. Please try again.',
      invalidBillQr: 'This QR code is not a valid Esco bill code.',
      invalidRewardServiceResponse:
        'The reward service returned an invalid response. Please try again.',
      unsupportedCurrency:
        'This bill uses an unsupported currency. Only VND bills can earn points.',
      networkUnavailable:
        'Could not reach the reward service. Check your connection and try again.',
      receiptAlreadyClaimed:
        'This receipt has already been used to claim points.',
      rewardServiceUnavailable:
        'The reward service is currently unavailable. Please try again shortly.',
      sessionExpired:
        'Your secure session expired. Please sign in again and retry.',
    },
  },
  earned: 'POINTS EARNED',
  saved: 'SAVED',
  profileDetails: 'Profile details',
  memberSince: 'Member since',
  nightsLeft: 'Nights left',
  savedEventsCount: 'Saved events',
  memberCard: {
    cashbackBalance: 'Points Balance',
    cashbackSuffix: 'pts',
    memberName: 'MEMBER NAME',
    lifetimeTier: 'Lifetime Tier',
  },
  benefits: {
    title: 'Unlocked Benefits',
    viewAll: 'View All',
    concierge: '24/7 Concierge Service',
    priorityBooking: 'Priority Booking Access',
    poolsideDrinks: 'Free Poolside Drinks',
    poolsideDrinksDesc: 'Daily complimentary signature cocktails',
    memberEvents: 'Member Events Access',
    memberEventsDesc: 'Exclusive access to members-only events',
    discountDining: 'Dining Discounts',
    discountDiningDesc: '10% off all food & beverages',
  },
  manageAccount: {
    title: 'Manage Account',
    upgradeTier: 'Upgrade Tier',
    billingHistory: 'Billing History',
    managePayments: 'Manage Payment Methods',
  },
  activity: {
    title: 'Recent Activity',
    cashbackAdjusted: 'Manual Points Adjustment',
    cashbackAdjustedDesc:
      '{{points}} points were changed through a manual adjustment.',
    cashbackEarned: 'Points Earned',
    cashbackEarnedDesc: '+{{points}} points from a recent qualifying purchase.',
    cashbackReversed: 'Points Reversed',
    cashbackReversedDesc: '-{{points}} points after a refund or void.',
    daysAgo: '{{count}} days ago',
    loading: 'Loading recent activity...',
    emptyTitle: 'No member activity yet',
    emptyDescription:
      'New points activity and monthly tier progress will appear here after your next qualifying purchase.',
    progressReset: 'Tier Progress Reset',
    progressResetDesc: 'Your monthly tier progress window was reset.',
    sampleData: 'Sample Content',
  },
  noBio: 'Add a short bio to personalize your profile.',
  welcomeGift: 'WELCOME GIFT',
  welcomeDiscount: '10% OFF',
  firstVisit: 'Your First Visit',
  codeLabel: 'CODE: {{code}}',
  validForThirtyDays: 'Valid for 30 days from signup',
  gotIt: 'Got it!',
  contactVipConcierge: 'Contact VIP Concierge',
  contactSupport: 'Contact Support',
  conciergeMessage: 'Hi Esco Life VIP Concierge',
  helpCenter: {
    title: 'Help Center',
    heroTitle: 'How can we assist with your stay?',
    searchPlaceholder: 'Search for help...',
    emailSupport: {
      title: 'Email Support',
      description: "Send us a detailed inquiry and we'll reply within 2 hours.",
    },
    categories: {
      title: 'Browse Categories',
      booking: 'Booking & Reservations',
      membership: 'Membership & Tiers',
      perks: 'Perks & Rewards',
      technical: 'App & Technical',
    },
    faq: {
      title: 'Popular Questions',
      viewAll: 'View all',
      noResults: 'No questions match your search yet.',
      items: {
        redeemDrink: {
          question: 'How do I redeem my free drink?',
          answer:
            'Show your digital member card at any Esco Life bar. Eligible perks are applied automatically after verification.',
        },
        upgradeTier: {
          question: 'How does monthly tier progress work?',
          answer:
            'Your current tier is kept for life. Progress toward the next tier is tracked separately and resets one month after the active progress window starts.',
        },
        modifyCabana: {
          question: 'Can I modify my cabana reservation?',
          answer:
            'Yes. Open your booking details and submit an update request at least 24 hours before your reservation start time.',
        },
        gymHours: {
          question: 'What are the gym operating hours?',
          answer:
            'The gym is open daily from 6:00 AM to 10:00 PM. Holiday schedules may vary and will be posted in-app.',
        },
      },
    },
  },

  errors: {
    openMail: 'Could not open mail',
    openWhatsApp: 'Could not open WhatsApp',
    languageChangeFailed: 'Could not change language. Please try again.',
    saveProfileFailed: 'Could not save your profile. Please try again.',
    signOutFailed: 'Could not sign out. Please try again.',
  },
  deleteAccount: {
    title: 'Delete Account',
    heroTitle: 'Delete your Esco account',
    heroDescription:
      'This starts the full account deletion process and removes access to your member profile after the grace period ends.',
    permanentDataLossTitle: 'Permanent data loss',
    permanentDataLossDescription:
      'Once the grace period ends, your Esco account and linked member data are permanently removed.',
    gracePeriodTitle: '30-day grace period',
    gracePeriodDescription:
      'You will have 30 days to sign back in and restore your account before the deletion is finalized.',
    defaultGracePeriod: '30 days',
    whatWillBeDeletedTitle: 'What will be deleted',
    whatWillBeDeletedItems: {
      profileData: 'Profile and account information',
      savedEvents: 'Saved events and referral progress',
      bookings: 'Reservation and private-event request history',
      memberBenefits:
        'Member-specific access and benefits attached to your account',
    },
    confirmLabel: 'Final confirmation',
    confirmHint:
      'Type DELETE below to confirm that you want to schedule this account for deletion.',
    confirmPlaceholder: 'Type DELETE',
    finalNotice: 'This action will be final in 30 days.',
    confirmAction: 'Schedule account deletion',
    pendingEyebrow: 'Deletion scheduled',
    pendingTitle: 'Your account is scheduled for deletion',
    pendingDescription:
      'Unless you restore it first, your account will be permanently deleted on {{date}}.',
    pendingRestoreHint:
      'Restore your account at any time before the deadline to cancel deletion.',
    restoreAction: 'Restore account',
    reviewAction: 'Review details',
    backToApp: 'Back to app',
    bannerTitle: 'Account scheduled for deletion',
    bannerDescription:
      'Your account will be deleted on {{date}} unless you restore it first.',
    bannerCountdown: '30 days to restore',
    bannerRestoreHint:
      'Use Restore account to cancel the request and keep your member access.',
    scheduleSuccessTitle: 'Deletion request created',
    scheduleSuccessMessage:
      'Your account has been scheduled for deletion. Sign back in within 30 days if you want to restore it.',
    restoreSuccessTitle: 'Account restored',
    footerNote:
      'Need help first? Contact support before deleting your account.',
    loadingState: 'Checking account deletion status...',
    errors: {
      appleRevocationFailed:
        'We could not verify your Apple account for deletion. Please try again.',
      appleVerificationCanceled:
        'Apple verification was canceled, so deletion was not scheduled.',
      apiUnavailable:
        'Account deletion is not configured for this build yet. Start the Expo dev server with API routes or set EXPO_PUBLIC_ACCOUNT_API_BASE_URL.',
      authProviderUnresolved:
        'We could not determine how this account signs in. Contact support to finish deletion.',
      instantAuthUnavailable:
        'Account deletion is temporarily unavailable because the local API server cannot reach InstantDB. Check this machine’s DNS or internet connection and try again.',
      networkUnavailable:
        'Could not reach the account deletion service. Check your connection and try again.',
      requestTimedOut:
        'The account deletion request took too long. Please try again.',
      restoreFailed: 'Could not restore your account. Please try again.',
      scheduleFailed: 'Could not schedule account deletion. Please try again.',
      serverSchemaMisconfigured:
        'Account deletion is temporarily unavailable because the server schema is outdated.',
      serverMisconfigured:
        'Account deletion is temporarily unavailable because the server is missing Instant admin credentials.',
      serverUnexpected:
        'Account deletion hit a server error. Please try again shortly.',
      sessionExpired:
        'Your secure session expired. Please sign in again and retry.',
    },
  },
  editProfile: {
    title: 'Edit Profile',
    subtitle: 'Keep your member details up to date.',
    dateOfBirth: 'Birthday',
    dateOfBirthHint:
      'Optional. Add it if you want birthday wishes and member birthday perks.',
    dateOfBirthPlaceholder: 'Select your birthday',
    fullName: 'Full name',
    bio: 'Bio',
    bioPlaceholder: 'Tell members a little about yourself',
    memberSince: 'Member since',
    memberSincePlaceholder: 'YYYY-MM-DD',
    nightsLeft: 'Nights left',
    nightsLeftPlaceholder: '0',
    save: 'Save Changes',
    saving: 'Saving...',
  },
  savedEvents: {
    title: 'Saved Events',
    subtitle: 'Quick access to the experiences you want to revisit.',
    emptyTitle: 'No saved events yet',
    emptyDescription: 'Tap the heart on an event to keep it here.',
    browseEvents: 'Browse Events',
    remove: 'Remove',
  },
  theme: {
    title: 'Theme Preference',
    subtitle: 'Choose how Esco Life looks on your device.',
    currentSelection: 'Current selection',
    options: {
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
    language: {
      title: 'Language',
      subtitle: 'Choose your preferred app language.',
      currentSelection: 'Current language',
      currentSelectionDevice: 'Use Device ({{language}})',
      options: {
        device: 'Use Device',
        en: 'English',
        ko: '한국어',
        vi: 'Tiếng Việt',
      },
    },
  },
  invite: {
    allReferralsTitle: 'Your referrals',
    codeCopied: 'Copied!',
    codeCopyFailed: 'Could not copy code',
    shareFailed: 'Could not share invite link',
    codeLoading: 'Loading…',
    copyReferralCode: 'Copy invite code',
    copyReferralCodeHint: 'Copies your referral code to the clipboard',
    titlePrefix: 'Unlock the',
    titleHighlight: 'VIP Life',
    subtitle:
      'Invite friends to Esco Life and start\nearning exclusive perks today.',
    referralCode: 'YOUR REFERRAL CODE',
    goalVipStatus: 'GOAL: VIP STATUS',
    friendsJoined: '{{current}} of {{goal}} Friends Joined',
    recentReferrals: 'Recent Referrals',
    viewAll: 'View All',
    viewAllHint: 'Opens the full list of your referrals',
    joinedViaYourLink: 'Joined via your link',
    loadingReferrals: 'Loading referrals…',
    noReferralsYet: 'No referrals yet. Share your code!',
    status: {
      completed: 'Completed',
      accepted: 'Accepted',
      rejected: 'Rejected',
      unknown: 'Unknown',
    },
    shareInviteLink: 'Share Invite Link',
    shareMessage:
      'Join Esco Life with my referral code: {{code}}\nOpen in app: {{appUrl}}\nNeed to install first? Use this link: {{url}}',
    milestones: {
      freeCocktail: 'Free Cocktail',
      vipBadge: 'VIP Badge',
      priorityEntry: 'Priority Entry',
      priorityProgress_one: '{{count}} more completed invite',
      priorityProgress_other: '{{count}} more completed invites',
      unlocked: 'Unlocked',
      twoMoreInvites: '{{count}} more invites',
      locked: 'Locked',
      goal: 'GOAL',
    },
  },
} as const;

export default profile;

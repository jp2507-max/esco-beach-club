const profile = {
  guest: 'Guest',
  memberFallback: 'MEMBER',
  tier: {
    shore: 'Shore',
    cove: 'Cove',
    horizon: 'Horizon',
    luminary: 'Luminary',
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
    restartOnboarding: 'Restart Onboarding',
    logOut: 'Log Out',
    deleteAccount: 'Delete Account',
  },
  restartOnboarding: {
    confirmTitle: 'Restart onboarding?',
    confirmMessage:
      'We will take you back through the onboarding flow to update your setup choices.',
    cancel: 'Cancel',
    start: 'Start',
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
  earned: 'POINTS EARNED',
  saved: 'SAVED',
  profileDetails: 'Profile details',
  memberSince: 'Member since',
  nightsLeft: 'Nights left',
  savedEventsCount: 'Saved events',
  memberCard: {
    brandMark: 'Esco Beach',
    cashbackBalance: 'Points Balance',
    cashbackSuffix: 'pts',
    memberName: 'MEMBER NAME',
    lifetimeTier: 'Lifetime Tier',
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
      appleVerificationCanceled:
        'Apple verification was canceled, so deletion was not scheduled.',
      apiUnavailable:
        'Account deletion is not configured for this build yet. Start the Expo dev server with API routes or set EXPO_PUBLIC_ACCOUNT_API_BASE_URL.',
      instantAuthUnavailable:
        'Account deletion is temporarily unavailable because the local API server cannot reach InstantDB. Check this machine’s DNS or internet connection and try again.',
      networkUnavailable:
        'Could not reach the account deletion service. Check your connection and try again.',
      restoreFailed: 'Could not restore your account. Please try again.',
      scheduleFailed: 'Could not schedule account deletion. Please try again.',
      serverMisconfigured:
        'Account deletion is temporarily unavailable because the server is missing Instant admin credentials.',
      sessionExpired:
        'Your secure session expired. Please sign in again and retry.',
    },
  },
  editProfile: {
    title: 'Edit Profile',
    subtitle: 'Keep your member details up to date.',
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
  staff: {
    accessDeniedDescription:
      'This hidden screen is only available to allowlisted Esco staff accounts.',
    accessDeniedTitle: 'Staff access required',
    allowlistPending:
      'Ask an admin to add this account to the staff allowlist.',
    approvalRequired:
      'Manager approval is required for sensitive manual adjustments.',
    award: 'Record points',
    awarding: 'Recording...',
    awardTitle: 'Record points adjustment',
    badge: 'Staff',
    billAmountLabel: 'Bill amount (VND)',
    billAmountPlaceholder: '100000',
    cameraPermissionDescription:
      'Grant camera access so staff can scan member QR codes at Esco Beach.',
    cameraPermissionTitle: 'Camera access needed',
    currentPoints: 'Current points balance: {{value}}',
    errors: {
      billBelowMinimumSpend:
        'This bill does not meet the minimum points threshold.',
      generic: 'Something went wrong. Please try again.',
      invalidBillAmount: 'Enter a valid bill amount in VND.',
      invalidRewardServiceResponse:
        'The reward service returned an invalid response. Please try again.',
      invalidQr: 'This QR code is not a valid Esco member code.',
      rewardServiceRejectedRequest:
        'The reward service rejected this request. Please review the bill details and try again.',
      rewardServiceUnavailable:
        'The reward service is currently unavailable. Please try again shortly.',
      managerApprovalRequired:
        'A valid manager PIN is required for transactions above the approval cap.',
      memberNotFound: 'We could not find a member for that ID.',
      receiptReferenceRequired:
        'A receipt or bill reference is required to record points securely.',
      staffAccessRequired:
        'This account is not allowlisted for manual reward adjustments.',
      title: 'Unable to complete action',
    },
    findMember: 'Find member',
    formulaNote: '{{points}} point is earned for every {{amount}} spent.',
    goBack: 'Go back',
    grantPermission: 'Grant camera access',
    invalidQrTitle: 'Invalid QR code',
    loading: 'Checking staff access...',
    lookupHint: 'Scan a member QR code or enter the member ID manually.',
    managerPinLabel: 'Manager PIN',
    managerPinPlaceholder: 'Enter manager PIN',
    manualEntryNote:
      'If scanning fails, enter the member ID manually and continue below.',
    memberFoundBadge: 'Member found',
    memberIdLabel: 'Member ID',
    memberIdPlaceholder: 'ESCO-XXXXXXXX',
    memberLookup: 'Member lookup',
    memberNotFound: 'No member matches that code.',
    memberNotFoundTitle: 'Member not found',
    memberPendingLookup:
      'Tap Find Member to confirm this member before recording points.',
    pointsPreviewDescription:
      'Points are rounded down to full {{amount}} spend steps.',
    pointsPreviewLabel: 'Points preview',
    receiptReferenceLabel: 'Receipt reference',
    receiptReferencePlaceholder: 'Receipt or bill number',
    scanAgain: 'Scan again',
    subtitle:
      'Scan a customer QR or enter their member ID to record a secure points adjustment.',
    successMessage:
      '{{name}} received {{points}} points from a bill of {{amount}}.',
    successTitle: 'Points recorded',
    title: 'Reward scanner',
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
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      unknown: 'Unknown',
    },
    shareInviteLink: 'Share Invite Link',
    shareMessage: 'Join Esco Life with my referral code: {{code}}\n{{url}}',
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

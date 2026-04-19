const common = {
  accessibility: {
    textInputDefault: 'Text input field',
    textInputHint: 'Enter text',
    textInputHintWithField: 'Enter {{field}}',
  },
  branding: {
    mark: 'Esco Beach',
    wordmark: 'Esco Beach Club wordmark',
    markHint: 'Esco Beach Club branding',
  },
  validation: {
    required: 'This field is required.',
    email: 'Please enter a valid email address.',
    number: 'Please enter a number.',
    positiveNumber: 'Please enter a positive number.',
    min: 'Must be at least {{min}}.',
    max: 'Must be at most {{max}}.',
    maxCharacters: 'Must be at most {{count}} characters.',
    profileNameMin: 'Name must be at least 2 characters.',
    profileNameMax: 'Name must be at most 60 characters.',
    profileBioMax: 'Bio must be at most 160 characters.',
    commentMax: 'Comment must be at most 500 characters.',
    invalidDate: 'Please enter a valid date in YYYY-MM-DD format.',
    invalidCode: 'Please enter a 6-digit verification code.',
    deleteConfirmation: 'Type DELETE exactly to continue.',
    loyaltyManagerPin:
      'Please enter a valid manager PIN to approve this amount.',
    loyaltyMinimumSpend:
      'This bill amount is below the minimum points threshold.',
  },
  back: 'Back',
  backHint: 'Returns to the previous screen',
  valueUnavailable: '—',
  rateUs: {
    title: 'Rate Your Experience',
    howWasVisit: 'How was your visit?',
    feedbackHint:
      'Your feedback helps us create the best beach club experience.',
    starAccessibilityLabel: 'Rate {{count}} out of 5',
    starAccessibilityHint: 'Tap to select this rating',
    starLabels: ['Terrible', 'Poor', 'Okay', 'Great', 'Amazing!'],
    placeholder: 'Tell us more about your experience...',
    submitLabel: 'Submit Review',
    thankYou: 'Thank You!',
    thankYouMessage:
      'Your feedback means the world to us. We will keep making Esco Life even better.',
    done: 'Done',
    ratingRequired: 'Rating Required',
    ratingRequiredMessage: 'Please select a star rating before submitting.',
    reviewFailed: 'Review Failed',
    reviewSubmitError: 'Could not submit your review right now.',
  },
  bookingSuccess: {
    backHome: 'Back to Home',
    guest: 'Guest',
    subtitle:
      'Your reservation request has been received. You will receive confirmation within one hour.',
    title: "You're all set, {{name}}!",
  },
  bookingContact: {
    chatPrompt:
      'Prefer a faster reply? Chat with us directly on Instagram or Facebook.',
    inlinePrompt: 'Need help right now?',
    instagramInlineCta: 'Write us on Instagram',
    facebookInlineCta: 'Write us on Facebook',
    emailInlineCta: 'or send us an email',
    emailButton: 'Email Us',
    emailHint: 'Opens your mail app to contact our booking team',
    instagramButton: 'Instagram',
    instagramHint: 'Opens our Instagram page for direct chat',
    facebookButton: 'Facebook',
    facebookHint: 'Opens our Facebook page for direct chat',
    openLinkError: 'Could not open this contact option right now.',
  },
  appError: {
    title: 'We hit an unexpected issue',
    description:
      'Please reopen the app or try again in a moment. Our team has been notified.',
  },
  launch: {
    eyebrow: 'Member launch',
    loading: 'Preparing your club access, perks, and latest updates.',
  },
  searchInput: {
    clearLabel: 'Clear search',
    clearHint: 'Clears the current search text',
  },
  menu: 'Menu',
  privateEvent: {
    title: 'Private Event',
    header: 'Plan Your Private Party',
    subtitle:
      'From intimate birthdays to grand corporate events — let us handle it all.',
    eventDetails: 'Event Details',
    eventType: 'Event Type',
    selectType: 'Select type...',
    eventTypes: {
      companyParty: 'Company Party',
      birthday: 'Birthday',
      wedding: 'Wedding',
      anniversary: 'Anniversary',
      corporateRetreat: 'Corporate Retreat',
      other: 'Other',
    },
    preferredDate: 'Preferred Date',
    preferredDatePlaceholder: 'YYYY-MM-DD',
    preferredDateHint: 'Enter the date in YYYY-MM-DD format.',
    estimatedGuests: 'Estimated Guests',
    estimatedGuestsPlaceholder: 'e.g. 50',
    contactInfoOptional: 'Contact Info (optional)',
    name: 'Name',
    namePlaceholder: 'Your full name',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    additionalNotes: 'Additional Notes',
    additionalNotesPlaceholder:
      'Theme, dietary requirements, special requests...',
    sendInquiry: 'Send Inquiry',
    teamResponse: 'You will receive confirmation by email within one hour.',
    submissionFailed: 'Submission Failed',
    submitError: 'Could not send your inquiry right now.',
    missingInfo: 'Missing Info',
    missingInfoMessage:
      'Please fill in the event type, date, and estimated guests.',
    inquirySent: 'Inquiry Sent!',
    inquirySentMessage:
      'Your request has been received. You will receive confirmation by email within one hour.',
    backToEvents: 'Back to Events',
  },
  tabs: {
    home: 'Home',
    events: 'Events',
    qr: 'QR',
    scan: 'Scan',
    perks: 'Perks',
    profile: 'Profile',
  },
  close: 'Close',
  datePicker: {
    dismissHint:
      'Double tap to close the date picker without changing the date',
  },
  done: 'Done',
  modal: {
    title: 'Esco Life',
    description:
      'Welcome to Esco Life Beach Club. Enjoy exclusive member benefits.',
    closeLabel: 'Close',
    closeHint: 'Closes this modal',
  },
  notFound: {
    title: "This screen doesn't exist.",
    cta: 'Go to home screen',
  },
  member: 'Member',
  legal: {
    eyebrow: 'Esco Legal',
    hostedOnExpo:
      'These public pages are served from the current EAS Hosting production deployment.',
    contact: {
      title: 'Need help?',
      description:
        'For legal, privacy, or account questions, contact us at {{email}}.',
      emailCta: 'Email privacy support',
      questionsCta: 'Ask about these terms',
      supportCta: 'Contact support',
      supportSubject: 'Esco Beach Club Support',
    },
    privacy: {
      title: 'Privacy Policy',
      intro:
        'This policy explains what Esco Beach Club collects, how the app uses member information, and which permissions remain optional.',
      sections: {
        collection: {
          title: 'What we collect',
          body1:
            'We collect the account and profile details needed to run the membership experience, including email address, member identifier, referral code, profile name, and other details you submit in booking or private-event request forms. If you choose to add your date of birth later, we use it for optional member personalization such as birthday wishes or birthday perks.',
          body2:
            'The app can request optional location, notification, and camera permissions. In the current release, location is used on device for venue-arrival features, notifications are used for local reminders and offers, and camera access is used for member bill QR scanning.',
        },
        use: {
          title: 'How we use data',
          body1:
            'We use account and profile data to authenticate members, manage benefits, support bookings and private-event requests, and provide referrals, loyalty, and account-management features.',
          body2:
            'Crash, diagnostics, and limited in-app feedback or session replay data from our monitoring tools may be processed to monitor reliability, investigate failures, and improve the app experience.',
        },
        sharing: {
          title: 'How data is shared',
          body1:
            'We share data only when needed to operate the service, support venue or partner experiences, comply with legal obligations, or protect the app and its members from fraud or abuse.',
          body2:
            'We do not use the app for cross-app tracking. Third-party providers that process data for hosting, authentication, or monitoring must protect it using privacy and security protections at least equivalent to those described in this policy.',
        },
        choices: {
          title: 'Your choices',
          body1:
            'You can decline optional permissions, update profile information, and withdraw optional consent later by changing device permission settings or contacting support. Some member features may work in a reduced mode if optional permissions are denied.',
          body2:
            'If you created an account, you can initiate deletion inside the app. Deletion requests enter a 30-day restore window before final deletion, and we may retain limited records when needed to comply with law, prevent fraud, or document account and deletion activity.',
        },
      },
    },
    accountDeletion: {
      title: 'Esco Beach Club Account Deletion',
      intro:
        'This public page explains how to request deletion of your Esco Beach Club account, what happens during the 30-day restore window, which data is removed, and which records may be retained after deletion for legal or security reasons.',
      sections: {
        overview: {
          title: 'At a glance',
          body1:
            'Start deletion from inside the app at Profile > Delete Account, or contact support if you cannot access the in-app flow.',
          body2:
            'Once scheduled, the account enters a 30-day restore window so you can sign in again and cancel deletion before it becomes final.',
          body3:
            'When deletion is finalized, the account profile, member details, saved events, booking history, private-event request history, and member-specific benefits are removed.',
          body4:
            'We may keep limited records only when required for legal compliance, fraud prevention, security, accounting, or to document that a deletion request was handled.',
        },
        request: {
          title: 'How to request deletion',
          body1:
            'Open the app, go to Profile > Delete Account, review the warnings, and submit the request while signed in.',
          body2:
            'If you cannot sign in, contact support and we will help you reach the deletion flow.',
        },
        restore: {
          title: '30-day restore window',
          body1:
            'After scheduling deletion, your account can be restored by signing in again within 30 days.',
          body2:
            'If you do not restore the account before the deadline, deletion becomes final and access to the member profile ends.',
        },
        removed: {
          title: 'What is deleted',
          body1:
            'Your account profile, member details, saved events, booking and private-event request history, and member-specific access or benefits linked to the account are removed when deletion is finalized.',
          body2:
            'Linked sign-in access is revoked where supported by the provider.',
        },
        retained: {
          title: 'What may be retained',
          body1:
            'We may keep limited records needed to comply with law, prevent fraud or abuse, maintain security, complete accounting, or document that a deletion request was handled.',
          body2:
            'These retained records are kept only for the time needed for those purposes.',
        },
      },
    },
    terms: {
      title: 'Terms of Service',
      intro:
        'These terms govern your use of Esco Beach Club, including memberships, bookings, perks, referrals, and other member-only services available in the app.',
      sections: {
        membership: {
          title: 'Membership and eligibility',
          body1:
            'You are responsible for providing accurate account details and keeping your sign-in access secure. Membership status, perks, and offers may depend on active eligibility and venue or partner rules.',
          body2:
            'Esco Beach Club may suspend or limit access if account details are inaccurate, membership benefits are abused, or access is required to protect members, partners, staff, or the platform.',
        },
        bookings: {
          title: 'Bookings, perks, and private events',
          body1:
            'Booking requests, private-event inquiries, partner perks, and reward offers are subject to availability, venue discretion, partner participation, and any additional terms presented in the app or at the venue.',
          body2:
            'Submitting a request in the app does not guarantee acceptance until it is confirmed. Benefits, rewards, and offers may change, expire, or be withdrawn if used fraudulently or outside their intended terms.',
        },
        acceptableUse: {
          title: 'Acceptable use',
          body1:
            'You may not misuse the app, reverse engineer restricted features, impersonate another member, interfere with staff tools, automate abuse, or attempt to obtain perks or rewards through fraud, resale, or manipulation.',
          body2:
            'Any member QR, referral, or loyalty feature must be used only for its intended account and venue flow. Abuse may result in revoked rewards, suspended access, or permanent account removal.',
        },
        accounts: {
          title: 'Accounts, deletion, and changes',
          body1:
            'You may stop using the service at any time. If you created an account, you can initiate account deletion from inside the app in line with the app’s deletion flow and any active restore window.',
          body2:
            'We may update these terms when the service changes. Continued use after updated terms are published means you accept the revised version.',
        },
        liability: {
          title: 'Disclaimers and liability',
          body1:
            'The app, partner offers, and event information are provided on an as-available basis. We do not guarantee uninterrupted service, continuous partner participation, or that all content will always be complete or current.',
          body2:
            'To the extent permitted by law, Esco Beach Club is not liable for indirect, incidental, or consequential losses arising from use of the app, third-party partner experiences, or temporary service unavailability.',
        },
      },
    },
    support: {
      title: 'Support',
      intro:
        'Use this page for App Review contact details, member support questions, and legal or account requests related to Esco Beach Club.',
      sections: {
        access: {
          title: 'Account access',
          body1:
            'If you have trouble signing in, start with the email address used for your membership account and confirm that your sign-in method matches the one configured for that account.',
          body2:
            'If access issues continue, contact support and include the email address tied to the affected account, the device platform, and a short description of the issue.',
        },
        bookings: {
          title: 'Bookings and venue requests',
          body1:
            'For booking questions, private-event requests, or partner-perk issues, include the date, venue context, and any confirmation details shown in the app so the team can investigate quickly.',
          body2:
            'Support can help review the status of app-based requests, but final approval, availability, and venue operations may still depend on Esco staff or participating partners.',
        },
        privacy: {
          title: 'Privacy and account deletion',
          body1:
            'Use the in-app account deletion flow if you want to remove your account. If you need help with a deletion request, privacy concern, or restoration during the grace period, contact support directly.',
          body2:
            'For legal or privacy questions, reference the relevant app feature and the contact email on this page so we can respond with the right context.',
        },
      },
    },
  },
} as const;

export default common;

const common = {
  accessibility: {
    textInputDefault: 'Text input field',
    textInputHint: 'Enter text',
    textInputHintWithField: 'Enter {{field}}',
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
    loyaltyManagerPin:
      'Please enter a valid manager PIN to approve this amount.',
    loyaltyMinimumSpend:
      'This bill amount is below the minimum cashback threshold.',
  },
  back: 'Back',
  backHint: 'Returns to the previous screen',
  rateUs: {
    title: 'Rate Your Experience',
    howWasVisit: 'How was your visit?',
    feedbackHint:
      'Your feedback helps us create the best beach club experience.',
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
    subtitle: 'Your reservation has been confirmed.',
    title: "You're all set, {{name}}!",
  },
  appError: {
    title: 'We hit an unexpected issue',
    description:
      'Please reopen the app or try again in a moment. Our team has been notified.',
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
    teamResponse: 'Our team will get back to you within 24 hours.',
    submissionFailed: 'Submission Failed',
    submitError: 'Could not send your inquiry right now.',
    missingInfo: 'Missing Info',
    missingInfoMessage:
      'Please fill in the event type, date, and estimated guests.',
    inquirySent: 'Inquiry Sent!',
    inquirySentMessage:
      'Our events team will review your request and reach out within 24 hours. Get ready for an unforgettable event!',
    backToEvents: 'Back to Events',
  },
  tabs: {
    home: 'Home',
    events: 'Events',
    qr: 'QR',
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
  Member: 'Member',
} as const;

export default common;

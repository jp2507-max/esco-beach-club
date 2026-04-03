import React from 'react';

import { LegalPageShell } from '@/src/components/legal/legal-page-shell';
import { config } from '@/src/lib/config';

const termsSections = [
  {
    titleKey: 'legal.terms.sections.membership.title',
    bodyKeys: [
      'legal.terms.sections.membership.body1',
      'legal.terms.sections.membership.body2',
    ],
  },
  {
    titleKey: 'legal.terms.sections.bookings.title',
    bodyKeys: [
      'legal.terms.sections.bookings.body1',
      'legal.terms.sections.bookings.body2',
    ],
  },
  {
    titleKey: 'legal.terms.sections.acceptableUse.title',
    bodyKeys: [
      'legal.terms.sections.acceptableUse.body1',
      'legal.terms.sections.acceptableUse.body2',
    ],
  },
  {
    titleKey: 'legal.terms.sections.accounts.title',
    bodyKeys: [
      'legal.terms.sections.accounts.body1',
      'legal.terms.sections.accounts.body2',
    ],
  },
  {
    titleKey: 'legal.terms.sections.liability.title',
    bodyKeys: [
      'legal.terms.sections.liability.body1',
      'legal.terms.sections.liability.body2',
    ],
  },
] as const;

export default function TermsScreen(): React.JSX.Element {
  return (
    <LegalPageShell
      ctaHref={`mailto:${config.contact.supportEmail}?subject=Esco%20Beach%20Club%20Terms`}
      ctaLabelKey="legal.contact.questionsCta"
      introKey="legal.terms.intro"
      sections={termsSections}
      titleKey="legal.terms.title"
    />
  );
}

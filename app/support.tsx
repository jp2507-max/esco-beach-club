import React from 'react';

import { LegalPageShell } from '@/src/components/legal/legal-page-shell';
import { config } from '@/src/lib/config';

const supportSections = [
  {
    titleKey: 'legal.support.sections.access.title',
    bodyKeys: [
      'legal.support.sections.access.body1',
      'legal.support.sections.access.body2',
    ],
  },
  {
    titleKey: 'legal.support.sections.bookings.title',
    bodyKeys: [
      'legal.support.sections.bookings.body1',
      'legal.support.sections.bookings.body2',
    ],
  },
  {
    titleKey: 'legal.support.sections.privacy.title',
    bodyKeys: [
      'legal.support.sections.privacy.body1',
      'legal.support.sections.privacy.body2',
    ],
  },
] as const;

export default function SupportScreen(): React.JSX.Element {
  return (
    <LegalPageShell
      ctaHref={`mailto:${config.contact.supportEmail}?subject=Esco%20Beach%20Club%20Support`}
      ctaLabelKey="legal.contact.supportCta"
      introKey="legal.support.intro"
      sections={supportSections}
      titleKey="legal.support.title"
    />
  );
}

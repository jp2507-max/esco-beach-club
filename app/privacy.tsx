import React from 'react';

import { LegalPageShell } from '@/src/components/legal/legal-page-shell';
import { config } from '@/src/lib/config';

const privacySections = [
  {
    titleKey: 'legal.privacy.sections.collection.title',
    bodyKeys: [
      'legal.privacy.sections.collection.body1',
      'legal.privacy.sections.collection.body2',
    ],
  },
  {
    titleKey: 'legal.privacy.sections.use.title',
    bodyKeys: [
      'legal.privacy.sections.use.body1',
      'legal.privacy.sections.use.body2',
    ],
  },
  {
    titleKey: 'legal.privacy.sections.sharing.title',
    bodyKeys: [
      'legal.privacy.sections.sharing.body1',
      'legal.privacy.sections.sharing.body2',
    ],
  },
  {
    titleKey: 'legal.privacy.sections.choices.title',
    bodyKeys: [
      'legal.privacy.sections.choices.body1',
      'legal.privacy.sections.choices.body2',
    ],
  },
] as const;

export default function PrivacyScreen(): React.JSX.Element {
  return (
    <LegalPageShell
      ctaHref={`mailto:${config.contact.supportEmail}?subject=Esco%20Beach%20Club%20Privacy`}
      ctaLabelKey="legal.contact.emailCta"
      introKey="legal.privacy.intro"
      sections={privacySections}
      titleKey="legal.privacy.title"
    />
  );
}

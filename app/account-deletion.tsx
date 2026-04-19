import React from 'react';
import { useTranslation } from 'react-i18next';

import { LegalPageShell } from '@/src/components/legal/legal-page-shell';
import { config } from '@/src/lib/config';

const accountDeletionSections = [
  {
    titleKey: 'legal.accountDeletion.sections.overview.title',
    bodyKeys: [
      'legal.accountDeletion.sections.overview.body1',
      'legal.accountDeletion.sections.overview.body2',
      'legal.accountDeletion.sections.overview.body3',
      'legal.accountDeletion.sections.overview.body4',
    ],
  },
  {
    titleKey: 'legal.accountDeletion.sections.request.title',
    bodyKeys: [
      'legal.accountDeletion.sections.request.body1',
      'legal.accountDeletion.sections.request.body2',
    ],
  },
  {
    titleKey: 'legal.accountDeletion.sections.restore.title',
    bodyKeys: [
      'legal.accountDeletion.sections.restore.body1',
      'legal.accountDeletion.sections.restore.body2',
    ],
  },
  {
    titleKey: 'legal.accountDeletion.sections.removed.title',
    bodyKeys: [
      'legal.accountDeletion.sections.removed.body1',
      'legal.accountDeletion.sections.removed.body2',
    ],
  },
  {
    titleKey: 'legal.accountDeletion.sections.retained.title',
    bodyKeys: [
      'legal.accountDeletion.sections.retained.body1',
      'legal.accountDeletion.sections.retained.body2',
    ],
  },
] as const;

export default function AccountDeletionScreen(): React.JSX.Element {
  const { t } = useTranslation('common');
  const supportSubject = encodeURIComponent(t('legal.contact.supportSubject'));

  return (
    <LegalPageShell
      ctaHref={`mailto:${config.contact.supportEmail}?subject=${supportSubject}`}
      ctaLabelKey="legal.contact.supportCta"
      introKey="legal.accountDeletion.intro"
      sections={accountDeletionSections}
      titleKey="legal.accountDeletion.title"
    />
  );
}

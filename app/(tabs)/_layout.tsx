import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function TabLayout(): React.JSX.Element {
  const { t } = useTranslation('common');

  return (
    <NativeTabs backBehavior="history">
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
        <NativeTabs.Trigger.Label>{t('tabs.events')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="perks">
        <NativeTabs.Trigger.Icon sf="gift.fill" md="redeem" />
        <NativeTabs.Trigger.Label>{t('tabs.perks')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

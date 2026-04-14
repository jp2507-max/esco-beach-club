import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { DynamicColorIOS, Platform } from 'react-native';

import { Colors } from '@/constants/colors';
import { triggerTabPressHapticFeedback } from '@/src/lib/haptics/tab-press-feedback';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';

export default function TabLayout(): React.JSX.Element {
  const { t } = useTranslation('common');
  const isDark = useAppIsDark();

  const tabBarBackground = isDark ? Colors.darkBgCard : Colors.background;
  const iOSInactiveTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          dark: Colors.textMutedDark,
          light: Colors.textSecondary,
        })
      : null;
  const iOSActiveTint =
    Platform.OS === 'ios'
      ? DynamicColorIOS({
          dark: Colors.primaryBright,
          light: Colors.primary,
        })
      : null;
  const inactiveTint =
    iOSInactiveTint ?? (isDark ? Colors.textMutedDark : Colors.textSecondary);
  const activeTint =
    iOSActiveTint ?? (isDark ? Colors.primaryBright : Colors.primary);
  const androidRippleColor =
    Platform.OS === 'android'
      ? isDark
        ? Colors.ACTIVE_BG_DARK
        : Colors.ACTIVE_BG_LIGHT
      : undefined;
  const handleTabPress = React.useCallback((): void => {
    triggerTabPressHapticFeedback();
  }, []);

  return (
    <NativeTabs
      backBehavior="history"
      disableTransparentOnScrollEdge
      screenListeners={{ tabPress: handleTabPress }}
      backgroundColor={tabBarBackground}
      badgeBackgroundColor={activeTint}
      badgeTextColor={Colors.white}
      iconColor={{ default: inactiveTint, selected: activeTint }}
      rippleColor={androidRippleColor}
      tintColor={activeTint}
      labelStyle={{
        default: { color: inactiveTint, fontSize: 12, fontWeight: '600' },
        selected: { color: activeTint, fontSize: 12, fontWeight: '700' },
      }}
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="events">
        <NativeTabs.Trigger.Icon sf="calendar" md="event" />
        <NativeTabs.Trigger.Label>{t('tabs.events')}</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="qr">
        <NativeTabs.Trigger.Icon
          sf={{ default: 'qrcode', selected: 'qrcode' }}
          md="qr_code_2"
          selectedColor={activeTint}
        />
        <NativeTabs.Trigger.Label selectedStyle={{ color: activeTint }}>
          {t('tabs.scan')}
        </NativeTabs.Trigger.Label>
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

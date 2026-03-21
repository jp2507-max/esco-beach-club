import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfileData } from '@/providers/DataProvider';
import { MemberQrCode } from '@/src/components/ui';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

export default function QrTabScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { profile } = useProfileData();

  const memberId = profile?.member_id ?? '';

  function handleOpenStaffRoute(): void {
    router.push('/staff' as never);
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{
        paddingTop: insets.top,
      }}
    >
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-8 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4 items-center">
          <Text className="text-[11px] font-semibold uppercase tracking-[2.5px] text-text-secondary dark:text-text-secondary-dark">
            {t('accessPass')}
          </Text>
          <Text className="mt-2 text-center text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {t('scanAtTable')}
          </Text>
        </View>

        <View className="items-center rounded-3xl border border-border bg-white p-6 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {t('brandPrefix')}
            <Text className="text-primary">{t('brandHighlight')}</Text>
          </Text>
          <Text className="mt-1 text-[11px] font-semibold tracking-[3px] text-text-secondary dark:text-text-secondary-dark">
            {t('accessPass')}
          </Text>

          <View className="mb-5 mt-4">
            <LinearGradient
              colors={['#E91E63', '#9C27B0', '#00BCD4']}
              end={{ x: 1, y: 0 }}
              start={{ x: 0, y: 1 }}
              style={{
                borderRadius: 20,
                height: 220,
                padding: 6,
                width: 220,
              }}
            >
              <MemberQrCode
                className="flex-1 rounded-2xl"
                emptyLabel={t('staff.memberNotFound')}
                memberId={memberId}
                size={156}
              />
            </LinearGradient>
          </View>

          <Text className="mb-1 text-base font-bold text-text dark:text-text-primary-dark">
            {t('scanAtTable')}
          </Text>
          <Pressable
            accessibilityRole="button"
            className="items-center"
            onLongPress={handleOpenStaffRoute}
            testID="member-qr-hidden-staff-entry"
          >
            <Text className="text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
              {t('refPrefix', { memberId })}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

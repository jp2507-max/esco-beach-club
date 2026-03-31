import React from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useReferralsData } from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { shadows } from '@/src/lib/styles/shadows';
import { ScrollView, Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

const defaultAvatar =
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face';

export default function InviteReferralsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation('profile');
  const { referrals } = useReferralsData();
  const referralStatusBg = isDark ? 'rgba(34,197,94,0.22)' : '#E8F5E9';
  const referralStatusText = isDark ? '#86EFAC' : '#4CAF50';

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader
        className="pb-2"
        title={t('invite.allReferralsTitle')}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {referrals.map((ref) => (
          <View
            key={ref.id}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-white p-[14px] dark:border-dark-border dark:bg-dark-bg-card"
            style={shadows.level1}
          >
            <View className="flex-row items-center">
              <View className="mr-3 size-11">
                <Image
                  className="size-11 rounded-full"
                  source={{
                    uri: ref.referred_avatar ?? defaultAvatar,
                  }}
                />
                <View
                  className="absolute bottom-0 left-0 size-3 rounded-full"
                  style={{
                    backgroundColor: '#4CAF50',
                    borderColor: isDark ? Colors.darkBgCard : Colors.surface,
                    borderWidth: 2,
                  }}
                />
              </View>
              <View>
                <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
                  {ref.referred_name}
                </Text>
                <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
                  {t('invite.joinedViaYourLink')}
                </Text>
              </View>
            </View>
            <View
              className="rounded-[10px] px-3 py-[5px]"
              style={{ backgroundColor: referralStatusBg }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: referralStatusText }}
              >
                {ref.status}
              </Text>
            </View>
          </View>
        ))}

        {referrals.length === 0 ? (
          <Text className="py-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
            {t('invite.noReferralsYet')}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useReferralsData } from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const defaultAvatar = require('@/assets/images/icon.png');

const statusToKey: Record<string, string> = {
  Completed: 'invite.status.completed',
  Pending: 'invite.status.pending',
  Accepted: 'invite.status.accepted',
  Rejected: 'invite.status.rejected',
};

type StatusKey =
  | 'invite.status.completed'
  | 'invite.status.pending'
  | 'invite.status.accepted'
  | 'invite.status.rejected'
  | 'invite.status.unknown';

function InviteReferralListRowStagger({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

export default function InviteReferralsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const isDark = useAppIsDark();
  const { t } = useTranslation('profile');
  const { referrals } = useReferralsData();
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const referralStatusBg = isDark ? 'rgba(34,197,94,0.22)' : '#E8F5E9';
  const referralStatusText = isDark ? '#86EFAC' : '#4CAF50';
  const referralWarningBg = isDark
    ? 'rgba(245, 158, 11, 0.13)'
    : Colors.badgeWarningLightBackground;
  const referralWarningText = isDark ? Colors.warningDark : Colors.warning;

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
        <Animated.View style={contentStyle}>
          {referrals.map((ref, index) => (
            <InviteReferralListRowStagger key={ref.id} index={index}>
              <View
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-white p-[14px] dark:border-dark-border dark:bg-dark-bg-card"
                style={shadows.level1}
              >
                <View className="flex-row items-center">
                  <View className="mr-3 size-11">
                    <Image
                      className="size-11 rounded-full"
                      source={
                        ref.referred_avatar
                          ? { uri: ref.referred_avatar }
                          : defaultAvatar
                      }
                    />
                    <View
                      className="absolute bottom-0 left-0 size-3 rounded-full"
                      style={{
                        backgroundColor: '#4CAF50',
                        borderColor: isDark
                          ? Colors.darkBgCard
                          : Colors.surface,
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
                  style={{
                    backgroundColor:
                      ref.status === 'Pending'
                        ? referralWarningBg
                        : referralStatusBg,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{
                      color:
                        ref.status === 'Pending'
                          ? referralWarningText
                          : referralStatusText,
                    }}
                  >
                    {t(
                      (statusToKey[ref.status] ||
                        'invite.status.unknown') as StatusKey
                    )}
                  </Text>
                </View>
              </View>
            </InviteReferralListRowStagger>
          ))}

          {referrals.length === 0 ? (
            <Text className="py-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
              {t('invite.noReferralsYet')}
            </Text>
          ) : null}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

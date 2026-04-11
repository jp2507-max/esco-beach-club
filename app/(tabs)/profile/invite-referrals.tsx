import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useReferralsData } from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { ActivityIndicator, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const defaultAvatar = require('@/assets/images/icon.png');

const statusToKey: Record<string, string> = {
  Completed: 'invite.status.completed',
  Accepted: 'invite.status.accepted',
  Rejected: 'invite.status.rejected',
};

type StatusKey =
  | 'invite.status.completed'
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

type ReferralListRowProps = {
  isDark: boolean;
  index: number;
  joinedViaLabel: string;
  referralStatusBg: string;
  referralStatusText: string;
  referralWarningBg: string;
  referralWarningText: string;
  refItem: {
    id: string;
    referred_avatar: string | null;
    referred_name: string;
    status: string;
  };
  statusLabel: string;
};

function ReferralListRow({
  isDark,
  index,
  joinedViaLabel,
  referralStatusBg,
  referralStatusText,
  referralWarningBg,
  referralWarningText,
  refItem,
  statusLabel,
}: ReferralListRowProps): React.JSX.Element {
  const isPositiveStatus =
    refItem.status === 'Accepted' || refItem.status === 'Completed';
  const isRejectedStatus = refItem.status === 'Rejected';

  return (
    <InviteReferralListRowStagger index={index}>
      <View
        className="mb-3 flex-row items-center justify-between rounded-2xl border border-border bg-white p-3.5 dark:border-dark-border dark:bg-dark-bg-card"
        style={shadows.level1}
      >
        <View className="flex-row items-center">
          <View className="mr-3 size-11">
            <Image
              className="size-11 rounded-full"
              source={
                refItem.referred_avatar
                  ? { uri: refItem.referred_avatar }
                  : defaultAvatar
              }
            />
            <View
              className="absolute bottom-0 left-0 size-3 rounded-full"
              style={{
                backgroundColor: Colors.success,
                borderColor: isDark ? Colors.darkBgCard : Colors.surface,
                borderWidth: 2,
              }}
            />
          </View>
          <View>
            <Text className="text-[15px] font-bold text-text dark:text-text-primary-dark">
              {refItem.referred_name}
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary dark:text-text-secondary-dark">
              {joinedViaLabel}
            </Text>
          </View>
        </View>
        <View
          className="rounded-[10px] px-3 py-1.25"
          style={{
            backgroundColor: isRejectedStatus
              ? referralWarningBg
              : isPositiveStatus
                ? referralStatusBg
                : isDark
                  ? Colors.badgeDarkBackground
                  : Colors.badgeLightBackground,
          }}
        >
          <Text
            className="text-xs font-bold"
            style={{
              color: isRejectedStatus
                ? referralWarningText
                : isPositiveStatus
                  ? referralStatusText
                  : isDark
                    ? Colors.textSecondaryDark
                    : Colors.textSecondary,
            }}
          >
            {statusLabel}
          </Text>
        </View>
      </View>
    </InviteReferralListRowStagger>
  );
}

const MemoizedReferralListRow = React.memo(ReferralListRow);

function InviteReferralsScreenContent(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('profile');
  const { referrals, referralsLoading } = useReferralsData();
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const isDark = useAppIsDark();
  const referralStatusBg = isDark
    ? Colors.inviteReferralStatusBgDark
    : Colors.inviteReferralStatusBgLight;
  const referralStatusText = isDark
    ? Colors.inviteReferralStatusTextDark
    : Colors.inviteReferralStatusTextLight;
  const referralWarningBg = isDark
    ? Colors.badgeWarningDarkBackground
    : Colors.badgeWarningLightBackground;
  const referralWarningText = isDark ? Colors.warningDark : Colors.warning;
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 32, paddingHorizontal: 20 }),
    []
  );

  const renderReferral = useCallback(
    ({
      index,
      item,
    }: ListRenderItemInfo<(typeof referrals)[number]>): React.JSX.Element => {
      const statusLabel = t(
        (statusToKey[item.status] || 'invite.status.unknown') as StatusKey
      );

      return (
        <MemoizedReferralListRow
          isDark={isDark}
          index={index}
          joinedViaLabel={t('invite.joinedViaYourLink')}
          referralStatusBg={referralStatusBg}
          referralStatusText={referralStatusText}
          referralWarningBg={referralWarningBg}
          referralWarningText={referralWarningText}
          refItem={item}
          statusLabel={statusLabel}
        />
      );
    },
    [
      isDark,
      referralStatusBg,
      referralStatusText,
      referralWarningBg,
      referralWarningText,
      t,
    ]
  );

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader
        className="pb-2"
        title={t('invite.allReferralsTitle')}
      />

      <Animated.View className="flex-1" style={contentStyle}>
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={listContentContainerStyle}
          data={referrals}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            referralsLoading ? (
              <View className="items-center rounded-2xl border border-border bg-card px-4 py-10 dark:border-dark-border dark:bg-dark-bg-card">
                <ActivityIndicator
                  color={isDark ? Colors.primaryBright : Colors.primary}
                  size="large"
                />
                <Text className="mt-4 text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                  {t('invite.loadingReferrals')}
                </Text>
              </View>
            ) : (
              <Text className="py-8 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
                {t('invite.noReferralsYet')}
              </Text>
            )
          }
          renderItem={renderReferral}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>
    </View>
  );
}

export default function InviteReferralsScreen(): React.JSX.Element {
  return <InviteReferralsScreenContent />;
}

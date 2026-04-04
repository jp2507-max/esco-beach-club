import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useMemberSummary } from '@/providers/DataProvider';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import {
  formatCurrencyVnd,
  getRewardTierLabelKey,
  rewardConfig,
} from '@/src/lib/loyalty';
import { ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function ProfileUpgradeTierScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('membership');
  const memberSummary = useMemberSummary();
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const hasUpgradePath =
    memberSummary.hasTierUpgradePath && memberSummary.nextTierKey !== null;
  const currentTierLabel = t(
    `tiers.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`
  );
  const nextTierLabel = hasUpgradePath
    ? t(`tiers.${getRewardTierLabelKey(memberSummary.nextTierKey)}`)
    : t(`tiers.${getRewardTierLabelKey(memberSummary.lifetimeTierKey)}`);
  const progressPercent = Math.max(
    0,
    Math.min(100, memberSummary.tierProgressPercent)
  );
  const tierProgressExpiryLabel = memberSummary.tierProgressExpiresAt
    ? new Intl.DateTimeFormat(undefined, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(memberSummary.tierProgressExpiresAt))
    : null;

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader
        testID="upgrade-tier-back"
        title={t('manageAccount.upgradeTier')}
      />
      <Animated.View className="flex-1" style={contentStyle}>
        <ScrollView
          contentContainerClassName="px-5 pb-10 pt-4"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
            {t('upgradeTier.intro')}
          </Text>

          <View className="mt-4 gap-4">
            <View className="rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card">
              <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted dark:text-text-muted-dark">
                {t('upgradeTier.currentTierLabel')}
              </Text>
              <Text className="mt-1 text-xl font-extrabold text-text dark:text-text-primary-dark">
                {currentTierLabel}
              </Text>

              {hasUpgradePath ? (
                <>
                  <View className="mt-4">
                    <Text className="text-xs font-bold uppercase tracking-[1.5px] text-text-muted dark:text-text-muted-dark">
                      {t('upgradeTier.nextTierLabel')}
                    </Text>
                    <Text className="mt-1 text-lg font-bold text-primary dark:text-primary-bright">
                      {nextTierLabel}
                    </Text>
                  </View>

                  <Text className="mt-4 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                    {t('upgradeTier.unlockRequirement', {
                      nextTier: nextTierLabel,
                      target:
                        memberSummary.tierProgressTargetPoints.toLocaleString(),
                    })}
                  </Text>

                  <View className="mt-4">
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="text-xs font-semibold text-text dark:text-text-primary-dark">
                        {t('upgradeTier.progressLabel')}
                      </Text>
                      <Text className="text-xs font-semibold text-text dark:text-text-primary-dark">
                        {t('tierCard.progressPoints', {
                          current:
                            memberSummary.activeTierProgressPoints.toLocaleString(),
                          target:
                            memberSummary.tierProgressTargetPoints.toLocaleString(),
                        })}
                      </Text>
                    </View>
                    <View className="h-2.5 overflow-hidden rounded-full bg-sand dark:bg-dark-bg-elevated">
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: Colors.primary,
                          width: `${progressPercent}%`,
                        }}
                      />
                    </View>
                    <Text className="mt-2 text-xs text-text-secondary dark:text-text-secondary-dark">
                      {tierProgressExpiryLabel
                        ? t('upgradeTier.resetOn', {
                            date: tierProgressExpiryLabel,
                          })
                        : t('upgradeTier.resetsMonthlyFallback')}
                    </Text>
                  </View>
                </>
              ) : (
                <View className="mt-4 rounded-xl bg-sand p-4 dark:bg-dark-bg-elevated">
                  <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                    {t('upgradeTier.topTierTitle')}
                  </Text>
                  <Text className="mt-1 text-xs leading-5 text-text-secondary dark:text-text-secondary-dark">
                    {t('upgradeTier.topTierDescription')}
                  </Text>
                </View>
              )}
            </View>

            <View className="rounded-2xl border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card">
              <Text className="text-sm font-bold text-text dark:text-text-primary-dark">
                {t('upgradeTier.formulaTitle')}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                {t('upgradeTier.formulaDescription', {
                  amount: formatCurrencyVnd(rewardConfig.cashbackSpendStepVnd),
                  points: rewardConfig.cashbackPointsPerStep,
                })}
              </Text>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Flower2,
  History,
  Hotel,
  PlaneTakeoff,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import {
  usePartnerRedemptionsData,
  usePartnersData,
} from '@/providers/DataProvider';
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import { CategoryChip } from '@/src/components/ui';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { cn } from '@/src/lib/utils';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from '@/src/tw';

type HistoryCategory = 'all' | 'hotels' | 'travel' | 'dining';
type HistoryStatus = 'claimed' | 'expired' | 'used';
type HistoryIcon = 'dining' | 'hotel' | 'travel' | 'wellness';

type PerkHistoryItem = {
  category: string;
  dateLabel: string;
  icon: HistoryIcon;
  id: string;
  name: string;
  perk: string;
  status: HistoryStatus;
};

const historyCategories = [
  { labelKey: 'categories.all', value: 'all' },
  { labelKey: 'categories.hotels', value: 'hotels' },
  { labelKey: 'categories.travel', value: 'travel' },
  { labelKey: 'categories.dining', value: 'dining' },
] as const satisfies readonly { labelKey: string; value: HistoryCategory }[];

function HistoryItemIcon({
  icon,
  isDark,
}: {
  icon: HistoryIcon;
  isDark: boolean;
}): React.JSX.Element {
  if (icon === 'hotel')
    return (
      <Hotel color={isDark ? Colors.primaryBright : Colors.primary} size={18} />
    );
  if (icon === 'dining')
    return (
      <UtensilsCrossed
        color={isDark ? Colors.goldBright : Colors.gold}
        size={18}
      />
    );
  if (icon === 'travel')
    return (
      <PlaneTakeoff
        color={isDark ? Colors.secondaryBright : Colors.secondary}
        size={18}
      />
    );
  return <Flower2 color={Colors.primaryBright} size={18} />;
}

function toHistoryIcon(category: string): HistoryIcon {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'hotels') return 'hotel';
  if (normalized === 'dining') return 'dining';
  if (normalized === 'travel') return 'travel';
  return 'wellness';
}

type HistoryListRowProps = {
  isDark: boolean;
  item: PerkHistoryItem;
  statusLabel: string;
};

function HistoryListRow({
  isDark,
  item,
  statusLabel,
}: HistoryListRowProps): React.JSX.Element {
  const statusBadgeClassName =
    item.status === 'claimed' || item.status === 'used'
      ? 'bg-secondary/20 text-text-secondary dark:bg-secondary/25 dark:text-text-secondary-dark'
      : 'bg-background text-text-secondary dark:bg-dark-bg-elevated dark:text-text-secondary-dark';

  return (
    <View
      className="mb-3 flex-row items-center rounded-2xl border border-border bg-card px-3 py-3 dark:border-dark-border dark:bg-dark-bg-card"
      style={shadows.level2}
      testID={`history-item-${item.id}`}
    >
      <View className="mr-3 size-12 items-center justify-center rounded-full bg-background dark:bg-dark-bg-elevated">
        <HistoryItemIcon icon={item.icon} isDark={isDark} />
      </View>

      <View className="flex-1">
        <Text className="text-lg font-bold tracking-[-0.2px] text-text dark:text-text-primary-dark">
          {item.name}
        </Text>
        <Text className="text-xs text-text-secondary dark:text-text-secondary-dark">
          {item.dateLabel}
        </Text>
        <Text className="mt-0.5 text-xl font-medium leading-7 text-primary dark:text-primary-bright">
          {item.perk}
        </Text>
      </View>

      <View className="ml-2 items-end">
        <View
          className={cn(
            'mb-2 rounded-full px-2.5 py-0.5',
            statusBadgeClassName
          )}
        >
          <Text className="text-[9px] font-extrabold uppercase tracking-[0.8px]">
            {statusLabel}
          </Text>
        </View>
        <ChevronRight
          color={isDark ? Colors.textMutedDark : Colors.textLight}
          size={16}
        />
      </View>
    </View>
  );
}

const MemoizedHistoryListRow = React.memo(HistoryListRow);

export default function PerkHistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation('perks');
  const { t: tCommon } = useTranslation('common');
  const valueUnavailable = tCommon('valueUnavailable');
  const isDark = useAppIsDark();
  const headerAccent = accentOnDarkBackground(Colors.primary, isDark);
  const [activeCategory, setActiveCategory] = useState<HistoryCategory>('all');
  const { partnerRedemptions, partnerRedemptionsLoading } =
    usePartnerRedemptionsData();
  const { partners } = usePartnersData();
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 40 + insets.bottom, paddingHorizontal: 16 }),
    [insets.bottom]
  );
  const partnerById = useMemo(
    () => new Map(partners.map((partner) => [partner.id, partner])),
    [partners]
  );
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(i18n.language, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    [i18n.language]
  );

  const historyItems = useMemo<PerkHistoryItem[]>(() => {
    return partnerRedemptions.map((redemption) => {
      const partner = partnerById.get(redemption.partner_id);
      const createdAt = redemption.created_at
        ? new Date(redemption.created_at)
        : null;
      const dateLabel =
        createdAt && !Number.isNaN(createdAt.getTime())
          ? dateFormatter.format(createdAt)
          : valueUnavailable;

      return {
        category: partner?.category ?? 'wellness',
        dateLabel,
        icon: toHistoryIcon(partner?.category ?? ''),
        id: redemption.id,
        name: partner?.name ?? t('history.unknownPartner' as never),
        perk:
          partner?.discount_label ||
          redemption.partner_code ||
          partner?.description ||
          t('history.unknownPerk' as never),
        status: redemption.status === 'expired' ? 'expired' : 'claimed',
      };
    });
  }, [dateFormatter, partnerById, partnerRedemptions, t, valueUnavailable]);

  const totalUnlockedPerks = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return partnerRedemptions.filter((redemption) => {
      if (!redemption.created_at) return false;
      const createdAt = new Date(redemption.created_at);
      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getFullYear() === currentYear
      );
    }).length;
  }, [partnerRedemptions]);
  const historyLoadingLabel = t('history.loading' as never);
  const historyEmptyTitle = t('history.emptyTitle' as never);
  const historyEmptyDescription = t('history.emptyDescription' as never);

  const filteredItems = useMemo(
    () =>
      activeCategory === 'all'
        ? historyItems
        : historyItems.filter(
            (item) => item.category.trim().toLowerCase() === activeCategory
          ),
    [activeCategory, historyItems]
  );
  const listHeader = useMemo(
    () => (
      <>
        <View
          className="relative mb-6 overflow-hidden rounded-[26px] border border-border bg-card p-5 dark:border-dark-border dark:bg-dark-bg-card"
          style={shadows.level3}
        >
          <View
            className="absolute -right-8 -top-8 size-28 rounded-full bg-primary/10"
            pointerEvents="none"
          />
          <View
            className="absolute -bottom-6 -left-6 size-24 rounded-full bg-secondary/10"
            pointerEvents="none"
          />

          <View className="items-center">
            <View className="mb-3 size-12 items-center justify-center rounded-full bg-primary/10">
              <Sparkles color={headerAccent} size={20} />
            </View>

            <Text className="mb-1 text-[11px] font-extrabold uppercase tracking-[2px] text-text-secondary dark:text-text-secondary-dark">
              {t('history.hero.status')}
            </Text>
            <Text className="text-4xl font-black tracking-[-1px] text-text dark:text-text-primary-dark">
              {t('history.hero.total', { count: totalUnlockedPerks })}
            </Text>
            <Text className="text-base font-medium text-text-secondary dark:text-text-secondary-dark">
              {t('history.hero.subtitle')}
            </Text>

            <View className="mt-4 flex-row items-center gap-2">
              <View className="h-1 w-9 rounded-full bg-primary" />
              <View className="h-1 w-3.5 rounded-full bg-primary/25" />
              <View className="h-1 w-3.5 rounded-full bg-primary/25" />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mb-6 gap-2 pb-1"
        >
          {historyCategories.map((category) => (
            <CategoryChip
              key={category.value}
              className="px-4 py-2"
              isActive={activeCategory === category.value}
              label={t(category.labelKey)}
              labelClassName="text-xs"
              onPress={() => setActiveCategory(category.value)}
              testID={`history-cat-${category.value}`}
            />
          ))}
        </ScrollView>

        <Text className="mb-3 text-2xl font-extrabold tracking-[-0.3px] text-text dark:text-text-primary-dark">
          {t('history.recentActivity')}
        </Text>
      </>
    ),
    [activeCategory, headerAccent, t, totalUnlockedPerks]
  );
  const renderHistoryItem = useCallback(
    ({ item }: ListRenderItemInfo<PerkHistoryItem>): React.JSX.Element => {
      const statusLabel =
        item.status === 'claimed'
          ? t('history.status.claimed' as never)
          : item.status === 'expired'
            ? t('history.status.expired')
            : t('history.status.used');

      return (
        <MemoizedHistoryListRow
          isDark={isDark}
          item={item}
          statusLabel={statusLabel}
        />
      );
    },
    [isDark, t]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.Screen
        options={{ headerShown: false, title: t('history.title') }}
      />

      <AppScreenContent className="flex-1">
        <View
          className="flex-row items-center bg-background px-4 pb-3 dark:bg-dark-bg"
          style={{ paddingTop: insets.top + 6 }}
        >
          <Pressable
            accessibilityHint={t('history.backHint')}
            accessibilityLabel={t('history.backAction')}
            accessibilityRole="button"
            className="size-9 items-center justify-center rounded-full bg-card dark:bg-dark-bg-card"
            onPress={() => router.back()}
            style={shadows.level1}
            testID="perk-history-back"
          >
            <ArrowLeft color={headerAccent} size={20} />
          </Pressable>
          <Text className="ml-2 text-2xl font-extrabold tracking-[-0.4px] text-primary dark:text-primary-bright">
            {t('history.title')}
          </Text>
        </View>

        <FlashList
          contentInsetAdjustmentBehavior="never"
          contentContainerStyle={listContentContainerStyle}
          data={filteredItems}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            partnerRedemptionsLoading ? (
              <View className="items-center rounded-2xl border border-border bg-card px-4 py-10 dark:border-dark-border dark:bg-dark-bg-card">
                <ActivityIndicator
                  color={isDark ? Colors.primaryBright : Colors.primary}
                  size="large"
                />
                <Text className="mt-4 text-sm font-medium text-text-secondary dark:text-text-secondary-dark">
                  {historyLoadingLabel}
                </Text>
              </View>
            ) : (
              <View className="rounded-2xl border border-border bg-card px-4 py-8 dark:border-dark-border dark:bg-dark-bg-card">
                <Text className="text-center text-lg font-bold text-text dark:text-text-primary-dark">
                  {historyEmptyTitle}
                </Text>
                <Text className="mt-2 text-center text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                  {historyEmptyDescription}
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            <View className="mb-6 mt-6 flex-row items-center justify-center">
              <Text className="text-base font-bold text-text-secondary dark:text-text-secondary-dark">
                {t('history.fullArchive')}
              </Text>
              <History
                color={isDark ? Colors.textSecondaryDark : Colors.textSecondary}
                size={14}
                style={{ marginLeft: 8 }}
              />
            </View>
          }
          ListHeaderComponent={listHeader}
          renderItem={renderHistoryItem}
          showsVerticalScrollIndicator={false}
        />
      </AppScreenContent>
    </View>
  );
}

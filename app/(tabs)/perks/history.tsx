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
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { CategoryChip } from '@/src/components/ui';
import { shadows } from '@/src/lib/styles/shadows';
import { cn } from '@/src/lib/utils';
import { Pressable, ScrollView, Text, View } from '@/src/tw';

type HistoryCategory = 'all' | 'hotels' | 'travel' | 'dining';
type HistoryStatus = 'expired' | 'used';
type HistoryIcon = 'dining' | 'hotel' | 'travel' | 'wellness';

type PerkHistoryItem = {
  category: Exclude<HistoryCategory, 'all'>;
  dateKey: string;
  icon: HistoryIcon;
  id: string;
  nameKey: string;
  perkKey: string;
  status: HistoryStatus;
};

const historyCategories = [
  { labelKey: 'categories.all', value: 'all' },
  { labelKey: 'categories.hotels', value: 'hotels' },
  { labelKey: 'categories.travel', value: 'travel' },
  { labelKey: 'categories.dining', value: 'dining' },
] as const satisfies readonly { labelKey: string; value: HistoryCategory }[];

// TODO: Replace with API call - fetch history items from backend
const historyItems = [
  {
    category: 'hotels',
    dateKey: 'history.items.grandMarinaResort.date',
    icon: 'hotel',
    id: 'grand-marina-resort',
    nameKey: 'history.items.grandMarinaResort.name',
    perkKey: 'history.items.grandMarinaResort.perk',
    status: 'used',
  },
  {
    category: 'dining',
    dateKey: 'history.items.saffronSkyDining.date',
    icon: 'dining',
    id: 'saffron-sky-dining',
    nameKey: 'history.items.saffronSkyDining.name',
    perkKey: 'history.items.saffronSkyDining.perk',
    status: 'expired',
  },
  {
    category: 'travel',
    dateKey: 'history.items.azureAirways.date',
    icon: 'travel',
    id: 'azure-airways',
    nameKey: 'history.items.azureAirways.name',
    perkKey: 'history.items.azureAirways.perk',
    status: 'used',
  },
  {
    category: 'hotels',
    dateKey: 'history.items.velvetSandsSpa.date',
    icon: 'wellness',
    id: 'velvet-sands-spa',
    nameKey: 'history.items.velvetSandsSpa.name',
    perkKey: 'history.items.velvetSandsSpa.perk',
    status: 'used',
  },
] as const satisfies readonly PerkHistoryItem[];

// TODO: Derive from API response or user profile
const totalUnlockedPerks = 12;

function HistoryItemIcon({ icon }: { icon: HistoryIcon }): React.JSX.Element {
  if (icon === 'hotel') return <Hotel color={Colors.primary} size={20} />;
  if (icon === 'dining')
    return <UtensilsCrossed color={Colors.gold} size={20} />;
  if (icon === 'travel')
    return <PlaneTakeoff color={Colors.secondary} size={20} />;
  return <Flower2 color={Colors.primaryBright} size={20} />;
}

export default function PerkHistoryScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('perks');
  const [activeCategory, setActiveCategory] = useState<HistoryCategory>('all');

  const filteredItems = useMemo(
    () =>
      activeCategory === 'all'
        ? historyItems
        : historyItems.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.Screen
        options={{ headerShown: false, title: t('history.title') }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerClassName="px-5 pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="flex-row items-center pb-4"
          style={{ paddingTop: insets.top + 6 }}
        >
          <Pressable
            accessibilityHint={t('history.backHint')}
            accessibilityLabel={t('history.backAction')}
            accessibilityRole="button"
            className="size-10 items-center justify-center rounded-full bg-card dark:bg-dark-bg-card"
            onPress={() => router.back()}
            style={shadows.level1}
            testID="perk-history-back"
          >
            <ArrowLeft color={Colors.primary} size={22} />
          </Pressable>
          <Text className="ml-2.5 text-3xl font-extrabold tracking-[-0.4px] text-primary dark:text-primary-bright">
            {t('history.title')}
          </Text>
        </View>

        <View
          className="relative mb-8 overflow-hidden rounded-[34px] border border-border bg-card p-6 dark:border-dark-border dark:bg-dark-bg-card"
          style={shadows.level3}
        >
          <View
            className="absolute -right-10 -top-10 size-36 rounded-full bg-primary/10"
            pointerEvents="none"
          />
          <View
            className="absolute -left-8 -bottom-8 size-32 rounded-full bg-secondary/10"
            pointerEvents="none"
          />

          <View className="items-center">
            <View className="mb-4 size-14 items-center justify-center rounded-full bg-primary/10">
              <Sparkles color={Colors.primary} size={24} />
            </View>

            <Text className="mb-1 text-xs font-extrabold uppercase tracking-[2px] text-secondary dark:text-text-secondary-dark">
              {t('history.hero.status')}
            </Text>
            <Text className="text-5xl font-black tracking-[-1px] text-text dark:text-text-primary-dark">
              {t('history.hero.total', { count: totalUnlockedPerks })}
            </Text>
            <Text className="text-lg font-medium text-text-secondary dark:text-text-secondary-dark">
              {t('history.hero.subtitle')}
            </Text>

            <View className="mt-5 flex-row items-center gap-2">
              <View className="h-1.5 w-11 rounded-full bg-primary" />
              <View className="h-1.5 w-4 rounded-full bg-primary/25" />
              <View className="h-1.5 w-4 rounded-full bg-primary/25" />
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mb-8 gap-2 pb-1"
        >
          {historyCategories.map((category) => (
            <CategoryChip
              key={category.value}
              isActive={activeCategory === category.value}
              label={t(category.labelKey)}
              onPress={() => setActiveCategory(category.value)}
              testID={`history-cat-${category.value}`}
            />
          ))}
        </ScrollView>

        <Text className="mb-4 text-3xl font-extrabold tracking-[-0.3px] text-text dark:text-text-primary-dark">
          {t('history.recentActivity')}
        </Text>

        <View className="gap-4">
          {filteredItems.map((item) => {
            const statusBadgeClassName =
              item.status === 'used'
                ? 'bg-secondary/20 text-secondary dark:bg-secondary/25 dark:text-secondary'
                : 'bg-background text-text-secondary dark:bg-dark-bg-elevated dark:text-text-secondary-dark';

            return (
              <View
                className="flex-row items-center rounded-[30px] border border-border bg-card px-4 py-4 dark:border-dark-border dark:bg-dark-bg-card"
                key={item.id}
                style={shadows.level2}
                testID={`history-item-${item.id}`}
              >
                <View className="mr-4 size-14 items-center justify-center rounded-full bg-background dark:bg-dark-bg-elevated">
                  <HistoryItemIcon icon={item.icon} />
                </View>

                <View className="flex-1">
                  <Text className="text-xl font-bold tracking-[-0.2px] text-text dark:text-text-primary-dark">
                    {t(item.nameKey)}
                  </Text>
                  <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                    {t(item.dateKey)}
                  </Text>
                  <Text className="mt-1 text-3xl font-medium leading-8 text-primary dark:text-primary-bright">
                    {t(item.perkKey)}
                  </Text>
                </View>

                <View className="ml-3 items-end">
                  <View
                    className={cn(
                      'mb-3 rounded-full px-3 py-1',
                      statusBadgeClassName
                    )}
                  >
                    <Text className="text-[10px] font-extrabold uppercase tracking-[0.8px]">
                      {t(`history.status.${item.status}`)}
                    </Text>
                  </View>
                  <ChevronRight color={Colors.textLight} size={18} />
                </View>
              </View>
            );
          })}
        </View>

        <View className="mb-8 mt-8 flex-row items-center justify-center">
          <Text className="text-lg font-bold text-secondary">
            {t('history.fullArchive')}
          </Text>
          <History
            color={Colors.secondary}
            size={16}
            style={{ marginLeft: 8 }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

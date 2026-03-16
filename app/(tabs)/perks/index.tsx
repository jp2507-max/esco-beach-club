import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { Stack, useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Partner } from '@/lib/types';
import { useFilteredPartners } from '@/providers/DataProvider';
import { shadows } from '@/src/lib/styles/shadows';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

const partnerCategories = [
  { labelKey: 'categories.all', value: 'All' },
  { labelKey: 'categories.hotels', value: 'Hotels' },
  { labelKey: 'categories.travel', value: 'Travel' },
  { labelKey: 'categories.dining', value: 'Dining' },
  { labelKey: 'categories.wellness', value: 'Wellness' },
] as const;

const activeCategoryChipStyle = {
  backgroundColor: Colors.secondary,
  borderColor: Colors.secondary,
} as const;

const activeCategoryTextStyle = { color: Colors.white } as const;

export default function PerksScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('perks');
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const cardWidth = (width - 52) / 2;
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 8 }),
    []
  );

  const filtered = useFilteredPartners(activeCategory);

  const renderHeaderRight = useCallback(
    () => (
      <View
        accessibilityLabel={t('filters', { defaultValue: 'Filters' })}
        accessibilityHint={t('filtersHint', {
          defaultValue: 'Filter partners by category',
        })}
        className="size-9 items-center justify-center rounded-xl border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
      >
        <SlidersHorizontal size={18} color={Colors.text} />
      </View>
    ),
    [t]
  );

  const handlePartnerPress = useCallback(
    (partner: Partner): void => {
      router.push(`/partner?id=${partner.id}` as never);
    },
    [router]
  );

  const renderCard = useCallback(
    ({ item }: ListRenderItemInfo<Partner>): React.JSX.Element => (
      <Pressable
        accessibilityRole="button"
        className="mb-3.5 overflow-hidden rounded-[18px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
        onPress={() => handlePartnerPress(item)}
        style={[shadows.level2, { width: cardWidth }]}
        testID={`partner-${item.id}`}
      >
        <View className="relative w-full" style={{ height: cardWidth * 0.7 }}>
          <Image
            className="h-full w-full"
            cachePolicy="memory-disk"
            contentFit="cover"
            recyclingKey={`partner-card-${item.id}`}
            source={{ uri: item.image }}
            transition={180}
          />
          <View className="absolute right-2.5 top-2.5 rounded-lg bg-secondary px-2.5 py-1">
            <Text className="text-[11px] font-extrabold tracking-[0.3px] text-white">
              {item.discount_label}
            </Text>
          </View>
        </View>
        <View className="p-3">
          <Text
            className="mb-[3px] text-[15px] font-bold text-text dark:text-text-primary-dark"
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            className="text-xs font-medium text-text-secondary dark:text-text-secondary-dark"
            numberOfLines={1}
          >
            {item.description}
          </Text>
        </View>
      </Pressable>
    ),
    [cardWidth, handlePartnerPress]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <Stack.Screen
        options={{
          headerRight: renderHeaderRight,
          title: t('title'),
        }}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="items-center gap-2 px-5"
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 8, marginTop: 12, maxHeight: 48 }}
      >
        {partnerCategories.map((category) => (
          <Pressable
            accessibilityRole="button"
            key={category.value}
            className="rounded-full border border-border bg-white px-5 py-2.5 dark:border-dark-border dark:bg-dark-bg-card"
            onPress={() => setActiveCategory(category.value)}
            style={
              activeCategory === category.value
                ? activeCategoryChipStyle
                : undefined
            }
            testID={`cat-${category.value}`}
          >
            <Text
              className="text-sm font-semibold text-text dark:text-text-primary-dark"
              style={
                activeCategory === category.value
                  ? activeCategoryTextStyle
                  : undefined
              }
            >
              {t(category.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={listContentContainerStyle}
        data={filtered}
        estimatedItemSize={cardWidth * 0.7 + 80}
        extraData={cardWidth}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

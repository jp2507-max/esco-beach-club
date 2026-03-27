import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Compass, ExternalLink, History } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, useWindowDimensions } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Partner } from '@/lib/types';
import { useFilteredPartners } from '@/providers/DataProvider';
import { CategoryChip } from '@/src/components/ui';
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

const DANANG_365_URL = 'https://danang365.com/en/home/';

export default function PerksScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('perks');
  const { width } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const cardWidth = (width - 52) / 2;
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 20, paddingHorizontal: 16, paddingTop: 16 }),
    []
  );

  const filtered = useFilteredPartners(activeCategory);

  const handlePartnerPress = useCallback(
    (partner: Partner): void => {
      router.push(`/partner?id=${partner.id}` as never);
    },
    [router]
  );

  const handleOpenDanangGuide = useCallback((): void => {
    Linking.openURL(DANANG_365_URL).catch((error: unknown) => {
      console.error('[Perks] Failed to open Da Nang 365 link:', error);
      Alert.alert(
        t('danangCta.openFailedTitle'),
        t('danangCta.openFailedBody')
      );
    });
  }, [t]);

  const handleOpenHistory = useCallback((): void => {
    router.push('/perks/history');
  }, [router]);

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
            className="mb-0.75 text-[15px] font-bold text-text dark:text-text-primary-dark"
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
          headerLargeTitle: true,
          headerRight: () => (
            <Pressable
              accessibilityHint={t('history.openHint')}
              accessibilityLabel={t('history.openAction')}
              accessibilityRole="button"
              className="flex-row items-center rounded-full border border-border bg-card px-3 py-1.5 dark:border-dark-border dark:bg-dark-bg-card"
              onPress={handleOpenHistory}
              style={shadows.level1}
              testID="perks-history-link"
            >
              <History color={Colors.primary} size={14} />
              <Text className="ml-1 text-xs font-bold text-primary dark:text-primary-bright">
                {t('history.openAction')}
              </Text>
            </Pressable>
          ),
          headerSearchBarOptions: undefined,
          title: t('title'),
        }}
      />

      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={listContentContainerStyle}
        data={filtered}
        extraData={cardWidth}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="mb-4 gap-2"
            >
              {partnerCategories.map((category) => (
                <CategoryChip
                  key={category.value}
                  isActive={activeCategory === category.value}
                  label={t(category.labelKey)}
                  onPress={() => setActiveCategory(category.value)}
                  testID={`cat-${category.value}`}
                />
              ))}
            </ScrollView>

            <Pressable
              accessibilityHint={t('danangCta.hint')}
              accessibilityLabel={t('danangCta.action')}
              accessibilityRole="button"
              className="mb-4 overflow-hidden rounded-[20px] border border-border bg-card dark:border-dark-border dark:bg-dark-bg-card"
              onPress={handleOpenDanangGuide}
              style={shadows.level2}
              testID="danang-365-cta"
            >
              <LinearGradient
                colors={['rgba(233,30,99,0.08)', 'rgba(0,150,136,0.1)']}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={{
                  bottom: 0,
                  left: 0,
                  position: 'absolute',
                  right: 0,
                  top: 0,
                }}
              />

              <View className="p-4">
                <View className="mb-2 flex-row items-center">
                  <View className="mr-2 size-8 items-center justify-center rounded-full bg-primary/15">
                    <Compass color={Colors.primary} size={16} />
                  </View>
                  <Text className="text-xs font-bold uppercase tracking-[1px] text-primary dark:text-primary-bright">
                    {t('danangCta.badge')}
                  </Text>
                </View>

                <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
                  {t('danangCta.title')}
                </Text>
                <Text className="mt-1.5 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                  {t('danangCta.description')}
                </Text>

                <View className="mt-4 self-start flex-row items-center rounded-full bg-primary px-3.5 py-2">
                  <Text className="text-xs font-bold text-white">
                    {t('danangCta.action')}
                  </Text>
                  <ExternalLink
                    color={Colors.white}
                    size={14}
                    style={{ marginLeft: 6 }}
                  />
                </View>
              </View>
            </Pressable>
          </>
        }
        numColumns={2}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

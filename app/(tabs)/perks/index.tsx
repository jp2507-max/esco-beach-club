import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Compass, ExternalLink } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, useWindowDimensions } from 'react-native';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import type { Partner } from '@/lib/types';
import { useFilteredPartners, usePartnersData } from '@/providers/DataProvider';
import { CategoryChip, SkeletonCard } from '@/src/components/ui';
import { useButtonPress } from '@/src/lib/animations/use-button-press';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { hapticLight, hapticSelection } from '@/src/lib/haptics/haptics';
import { shadows } from '@/src/lib/styles/shadows';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

const partnerCategories = [
  { labelKey: 'categories.all', value: 'All' },
  { labelKey: 'categories.hotels', value: 'Hotels' },
  { labelKey: 'categories.travel', value: 'Travel' },
  { labelKey: 'categories.dining', value: 'Dining' },
  { labelKey: 'categories.wellness', value: 'Wellness' },
] as const;

const DANANG_365_URL = 'https://danang365.com/en/home/';

function PerksListHeader({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  return <Animated.View style={contentStyle}>{children}</Animated.View>;
}

function DanangCtaCard({
  onPress,
}: {
  onPress: () => void;
}): React.JSX.Element {
  const { t } = useTranslation('perks');
  const isDark = useAppIsDark();
  const headerAccent = accentOnDarkBackground(Colors.primary, isDark);
  const { animatedStyle, handlePressIn, handlePressOut } = useButtonPress(
    0.985,
    'gentle'
  );

  return (
    <Animated.Pressable
      accessibilityHint={t('danangCta.hint')}
      accessibilityLabel={t('danangCta.action')}
      accessibilityRole="button"
      className="mb-4 overflow-hidden rounded-[20px] border border-border bg-card dark:border-dark-border dark:bg-dark-bg-card"
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[shadows.level2, animatedStyle]}
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
            <Compass color={headerAccent} size={16} />
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
    </Animated.Pressable>
  );
}

type PartnerGridCardProps = {
  cardWidth: number;
  index: number;
  item: Partner;
  onPress: (partner: Partner) => void;
};

function PartnerGridCard({
  cardWidth,
  index,
  item,
  onPress,
}: PartnerGridCardProps): React.JSX.Element {
  const entering = useStaggeredListEntering(index);

  return (
    <Animated.View
      className="mb-3.5"
      entering={entering}
      style={{ width: cardWidth }}
    >
      <Pressable
        accessibilityRole="button"
        className="overflow-hidden rounded-[18px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
        onPress={() => {
          hapticLight();
          onPress(item);
        }}
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
    </Animated.View>
  );
}

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

  const { partnersLoading } = usePartnersData();
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

  const renderCard = useCallback(
    ({ index, item }: ListRenderItemInfo<Partner>): React.JSX.Element => (
      <PartnerGridCard
        cardWidth={cardWidth}
        index={index}
        item={item}
        onPress={handlePartnerPress}
      />
    ),
    [cardWidth, handlePartnerPress]
  );

  return (
    <View className="flex-1 bg-background dark:bg-dark-bg">
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={listContentContainerStyle}
        data={filtered}
        extraData={cardWidth}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <PerksListHeader>
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
                  onPress={() => {
                    hapticSelection();
                    setActiveCategory(category.value);
                  }}
                  testID={`cat-${category.value}`}
                />
              ))}
            </ScrollView>

            <DanangCtaCard onPress={handleOpenDanangGuide} />
          </PerksListHeader>
        }
        ListEmptyComponent={
          partnersLoading ? (
            <View className="flex-row flex-wrap justify-between">
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonCard
                  key={i}
                  height={cardWidth * 0.7 + 88}
                  style={{ marginBottom: 14, width: cardWidth }}
                />
              ))}
            </View>
          ) : (
            <View className="rounded-2xl border border-border bg-card px-4 py-8 dark:border-dark-border dark:bg-dark-bg-card">
              <Text className="text-center text-lg font-bold text-text dark:text-text-primary-dark">
                {t('emptyTitle')}
              </Text>
              <Text className="mt-2 text-center text-sm leading-6 text-text-secondary dark:text-text-secondary-dark">
                {t('emptyDescription')}
              </Text>
            </View>
          )
        }
        numColumns={2}
        renderItem={renderCard}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

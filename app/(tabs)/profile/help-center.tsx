import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  ChevronDown,
  Crown,
  Gift,
  Headphones,
  Search,
  Settings,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import {
  ProfileSubScreenHeader,
  SurfaceCard,
  SurfacePressableCard,
} from '@/src/components/ui';
import { config } from '@/src/lib/config';
import { shadows } from '@/src/lib/styles/shadows';
import { ScrollView, Text, TextInput, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

type CategoryItem = {
  color: string;
  icon: React.ComponentType<{ color?: string; size?: number }>;
  id: string;
  label: string;
};

type FaqItem = {
  answer: string;
  id: string;
  question: string;
};

const heroImageUri =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCqx-opCKhQj_DDor0FWDRq7YSBudye--D99fJ_y0ftf5qJ58zdFDIBjEGBLU5VuPA59YEJek427pcvd6K2oHdd55cHGKhSDbdLDvvI-87XAlxcvi3Mpi4VFxb-kSu-cAneNTHLIyoB2f09nr_AjxoZbp1mOHKNYO74nWpg566yW5neXsrFJqDNzYzZuxGrqeNQYTB-nwn2iQ5MEeL5K1L-Nab1aw0O0dWlfbqlJWmhYGuLbpgQ-lZ9hxMh3wTv3QHB8IVcDxoMCKs3';

export default function HelpCenterScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation('profile');

  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const categoryItems = useMemo<CategoryItem[]>(
    () => [
      {
        color: '#C08400',
        icon: Calendar,
        id: 'booking',
        label: t('helpCenter.categories.booking'),
      },
      {
        color: Colors.primary,
        icon: Crown,
        id: 'membership',
        label: t('helpCenter.categories.membership'),
      },
      {
        color: Colors.secondary,
        icon: Gift,
        id: 'perks',
        label: t('helpCenter.categories.perks'),
      },
      {
        color: '#6E4A4D',
        icon: Settings,
        id: 'technical',
        label: t('helpCenter.categories.technical'),
      },
    ],
    [t]
  );

  const faqItems = useMemo<FaqItem[]>(
    () => [
      {
        answer: t('helpCenter.faq.items.redeemDrink.answer'),
        id: 'redeemDrink',
        question: t('helpCenter.faq.items.redeemDrink.question'),
      },
      {
        answer: t('helpCenter.faq.items.upgradeTier.answer'),
        id: 'upgradeTier',
        question: t('helpCenter.faq.items.upgradeTier.question'),
      },
      {
        answer: t('helpCenter.faq.items.modifyCabana.answer'),
        id: 'modifyCabana',
        question: t('helpCenter.faq.items.modifyCabana.question'),
      },
      {
        answer: t('helpCenter.faq.items.gymHours.answer'),
        id: 'gymHours',
        question: t('helpCenter.faq.items.gymHours.question'),
      },
    ],
    [t]
  );

  const filteredFaqItems = useMemo<FaqItem[]>(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return faqItems;

    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(normalizedQuery) ||
        item.answer.toLowerCase().includes(normalizedQuery)
    );
  }, [faqItems, searchQuery]);

  function handleEmailSupport(): void {
    const supportEmail = config.contact.supportEmail;

    Linking.openURL(`mailto:${supportEmail}`).catch((error: unknown) => {
      console.error('handleEmailSupport:', error);
      Alert.alert(t('errors.openMail'));
    });
  }

  function handleToggleFaq(id: string): void {
    setExpandedFaqId((currentId) => (currentId === id ? null : id));
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader title={t('menu.helpSupport')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-10 pt-1"
        showsVerticalScrollIndicator={false}
      >
        <View
          className="mb-7 overflow-hidden rounded-[30px]"
          style={shadows.level3}
        >
          <Image
            source={{ uri: heroImageUri }}
            className="h-65 w-full"
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={180}
          />
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(251,249,241,0.92)']}
            style={{
              bottom: 0,
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />

          <View className="absolute inset-0 justify-between px-5 pb-6 pt-8">
            <Text className="max-w-70 text-4xl font-extrabold tracking-tight text-text dark:text-text-primary-dark">
              {t('helpCenter.heroTitle')}
            </Text>

            <View
              className="flex-row items-center rounded-full border border-border bg-white px-4 py-2.5 dark:border-dark-border dark:bg-dark-bg-card"
              style={shadows.level1}
            >
              <Search
                color={accentOnDarkBackground(Colors.primary, isDark)}
                size={18}
              />
              <TextInput
                accessibilityLabel={t('helpCenter.searchPlaceholder')}
                accessibilityHint={t('helpCenter.searchPlaceholder')}
                className="ml-2.5 flex-1 p-0 text-base text-text dark:text-text-primary-dark"
                onChangeText={setSearchQuery}
                placeholder={t('helpCenter.searchPlaceholder')}
                placeholderTextColor={
                  isDark ? Colors.textMutedDark : Colors.textLight
                }
                testID="help-center-search"
                value={searchQuery}
              />
            </View>
          </View>
        </View>

        <SurfacePressableCard
          accessibilityRole="button"
          className="mb-7 flex-row items-center rounded-3xl p-5"
          onPress={handleEmailSupport}
          style={shadows.level2}
          testID="help-center-email-support"
        >
          <View
            className="mr-4 size-13 items-center justify-center rounded-full"
            style={{
              backgroundColor: `${accentOnDarkBackground(Colors.secondary, isDark)}22`,
            }}
          >
            <Headphones
              color={accentOnDarkBackground(Colors.secondary, isDark)}
              size={24}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-text dark:text-text-primary-dark">
              {t('helpCenter.emailSupport.title')}
            </Text>
            <Text className="mt-1 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
              {t('helpCenter.emailSupport.description')}
            </Text>
          </View>
        </SurfacePressableCard>

        <View className="mb-8">
          <Text className="mb-4 text-[30px] font-bold tracking-tight text-text dark:text-text-primary-dark">
            {t('helpCenter.categories.title')}
          </Text>

          <View className="flex-row flex-wrap justify-between gap-y-3">
            {categoryItems.map((item) => {
              const IconComp = item.icon;
              const catAccent = accentOnDarkBackground(item.color, isDark);
              return (
                <SurfaceCard
                  className="w-[48%] items-center px-4 py-6"
                  key={item.id}
                  style={shadows.level1}
                >
                  <View
                    className="mb-3 size-13 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${catAccent}22` }}
                  >
                    <IconComp color={catAccent} size={24} />
                  </View>
                  <Text className="text-center text-lg font-semibold leading-6 text-text dark:text-text-primary-dark">
                    {item.label}
                  </Text>
                </SurfaceCard>
              );
            })}
          </View>
        </View>

        <View>
          <View className="mb-4 flex-row items-end justify-between">
            <Text className="text-[30px] font-bold tracking-tight text-text dark:text-text-primary-dark">
              {t('helpCenter.faq.title')}
            </Text>
            <Text className="text-base font-bold text-primary dark:text-primary-bright">
              {t('helpCenter.faq.viewAll')}
            </Text>
          </View>

          {filteredFaqItems.length === 0 ? (
            <SurfaceCard className="px-5 py-6">
              <Text className="text-base text-text-secondary dark:text-text-secondary-dark">
                {t('helpCenter.faq.noResults')}
              </Text>
            </SurfaceCard>
          ) : (
            <View className="gap-3">
              {filteredFaqItems.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;

                return (
                  <SurfacePressableCard
                    accessibilityRole="button"
                    accessibilityState={{ expanded: isExpanded }}
                    className="px-5 py-4"
                    key={faq.id}
                    onPress={() => handleToggleFaq(faq.id)}
                    style={shadows.level1}
                    testID={`help-faq-${faq.id}`}
                  >
                    <View className="flex-row items-start gap-3">
                      <Text className="flex-1 text-lg font-semibold leading-7 text-text dark:text-text-primary-dark">
                        {faq.question}
                      </Text>
                      <ChevronDown
                        color={isDark ? Colors.textMutedDark : Colors.textLight}
                        size={20}
                        style={{
                          marginTop: 4,
                          transform: [
                            { rotate: isExpanded ? '180deg' : '0deg' },
                          ],
                        }}
                      />
                    </View>

                    {isExpanded ? (
                      <Text className="mt-3 text-base leading-6 text-text-secondary dark:text-text-secondary-dark">
                        {faq.answer}
                      </Text>
                    ) : null}
                  </SurfacePressableCard>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

import { Check, Languages, Monitor, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { ProfileSubScreenHeader, SurfaceCard } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { hapticSelection } from '@/src/lib/haptics/use-haptic';
import {
  changeAppLanguage,
  changeAppLanguageToDevice,
  resolveSupportedLanguage,
} from '@/src/lib/i18n';
import { appLanguages } from '@/src/lib/i18n/types';
import { useLanguagePreferenceStore } from '@/src/stores/language-preference-store';
import {
  getThemePreferenceLabelKey,
  type ThemePreference,
  themePreferences,
  useThemePreferenceStore,
} from '@/src/stores/theme-preference-store';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const THEME_ICONS: Record<ThemePreference, typeof Monitor> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

const languageOptions = ['device', ...appLanguages] as const;

type LanguageOption = (typeof languageOptions)[number];

const LANGUAGE_OPTION_LABEL_KEYS: Record<
  LanguageOption,
  | 'theme.language.options.device'
  | 'theme.language.options.en'
  | 'theme.language.options.ko'
  | 'theme.language.options.vi'
> = {
  device: 'theme.language.options.device',
  en: 'theme.language.options.en',
  ko: 'theme.language.options.ko',
  vi: 'theme.language.options.vi',
};

export default function ThemePreferenceScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { i18n, t } = useTranslation('profile');
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const preference = useThemePreferenceStore((state) => state.preference);
  const setPreference = useThemePreferenceStore((state) => state.setPreference);
  const overrideLanguage = useLanguagePreferenceStore(
    (state) => state.overrideLanguage
  );

  const activeLanguage = resolveSupportedLanguage(
    i18n.resolvedLanguage ?? i18n.language
  );

  const currentLanguageLabel =
    overrideLanguage == null
      ? t('theme.language.currentSelectionDevice', {
          language: t(LANGUAGE_OPTION_LABEL_KEYS[activeLanguage]),
        })
      : t(LANGUAGE_OPTION_LABEL_KEYS[overrideLanguage]);

  function handleLanguageOptionPress(option: LanguageOption): void {
    hapticSelection();
    const languageChangePromise =
      option === 'device'
        ? changeAppLanguageToDevice()
        : changeAppLanguage(option);

    languageChangePromise.catch((error: unknown) => {
      console.error('Language change failed:', error);
      Alert.alert(t('errors.languageChangeFailed'));
    });
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader title={t('theme.title')} />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pb-8 pt-1"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          <SurfaceCard className="mb-6 p-5">
            <Text className="text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
              {t('theme.subtitle')}
            </Text>
            <Text className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
              {t('theme.currentSelection')}
            </Text>
            <Text className="mt-1 text-base font-bold text-primary dark:text-primary-bright">
              {t(getThemePreferenceLabelKey(preference))}
            </Text>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            {themePreferences.map((option, index) => {
              const isSelected = option === preference;
              const Icon = THEME_ICONS[option];
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={
                    index < themePreferences.length - 1
                      ? 'flex-row items-center border-b border-border px-4 py-4 dark:border-dark-border'
                      : 'flex-row items-center px-4 py-4'
                  }
                  key={option}
                  onPress={() => {
                    hapticSelection();
                    setPreference(option);
                  }}
                  testID={`theme-option-${option}`}
                >
                  <View
                    className="mr-3 size-11 items-center justify-center rounded-[14px]"
                    style={{
                      backgroundColor: isSelected
                        ? `${Colors.primary}15`
                        : `${Colors.secondary}10`,
                    }}
                  >
                    <Icon
                      color={isSelected ? Colors.primary : Colors.secondary}
                      size={20}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-text dark:text-text-primary-dark">
                      {t(getThemePreferenceLabelKey(option))}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Check color={Colors.primary} size={18} />
                  ) : null}
                </Pressable>
              );
            })}
          </SurfaceCard>

          <SurfaceCard className="mb-6 mt-6 p-5">
            <View className="flex-row items-center">
              <View
                className="mr-3 size-11 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: `${Colors.primary}15` }}
              >
                <Languages color={Colors.primary} size={20} />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
                  {t('theme.language.title')}
                </Text>
                <Text className="mt-1 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                  {t('theme.language.subtitle')}
                </Text>
              </View>
            </View>

            <Text className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
              {t('theme.language.currentSelection')}
            </Text>
            <Text className="mt-1 text-base font-bold text-primary dark:text-primary-bright">
              {currentLanguageLabel}
            </Text>
          </SurfaceCard>

          <SurfaceCard className="overflow-hidden">
            {languageOptions.map((option, index) => {
              const isSelected =
                option === 'device'
                  ? overrideLanguage == null
                  : option === overrideLanguage;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  className={
                    index < languageOptions.length - 1
                      ? 'flex-row items-center border-b border-border px-4 py-4 dark:border-dark-border'
                      : 'flex-row items-center px-4 py-4'
                  }
                  key={option}
                  onPress={() => handleLanguageOptionPress(option)}
                  testID={`language-option-${option}`}
                >
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-text dark:text-text-primary-dark">
                      {t(LANGUAGE_OPTION_LABEL_KEYS[option])}
                    </Text>
                  </View>
                  {isSelected ? (
                    <Check color={Colors.primary} size={18} />
                  ) : null}
                </Pressable>
              );
            })}
          </SurfaceCard>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

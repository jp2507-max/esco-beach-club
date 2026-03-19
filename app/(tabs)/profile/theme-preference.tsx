import { Check, Monitor, Moon, Sun } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import {
  getThemePreferenceLabelKey,
  type ThemePreference,
  themePreferences,
  useThemePreferenceStore,
} from '@/src/stores/theme-preference-store';
import { Pressable, Text, View } from '@/src/tw';

const THEME_ICONS: Record<ThemePreference, typeof Monitor> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
};

export default function ThemePreferenceScreen(): React.JSX.Element {
  const { t } = useTranslation('profile');
  const preference = useThemePreferenceStore((state) => state.preference);
  const setPreference = useThemePreferenceStore((state) => state.setPreference);

  return (
    <View className="flex-1 bg-background px-5 pt-4 dark:bg-dark-bg">
      <View className="mb-6 rounded-[22px] border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card">
        <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
          {t('theme.title')}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
          {t('theme.subtitle')}
        </Text>
        <Text className="mt-4 text-xs font-semibold uppercase tracking-[1px] text-text-muted dark:text-text-muted-dark">
          {t('theme.currentSelection')}
        </Text>
        <Text className="mt-1 text-base font-bold text-primary dark:text-primary-bright">
          {t(getThemePreferenceLabelKey(preference))}
        </Text>
      </View>

      <View className="overflow-hidden rounded-[22px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card">
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
              onPress={() => setPreference(option)}
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
              {isSelected ? <Check color={Colors.primary} size={18} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

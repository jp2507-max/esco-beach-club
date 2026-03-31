import type { NativeStackHeaderItem } from '@react-navigation/native-stack';
import { Stack, useRouter } from 'expo-router';
import { History } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import {
  createLargeTitleHeaderOptions,
  createNestedCardStackScreenOptions,
} from '@/src/lib/navigation/stack-header-options';
import { useAppIsDark } from '@/src/lib/theme/use-app-is-dark';
import { Pressable, Text } from '@/src/tw';

export default function PerksStackLayout(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('perks');
  const isDark = useAppIsDark();
  const headerAccent = accentOnDarkBackground(Colors.primary, isDark);

  return (
    <Stack screenOptions={createNestedCardStackScreenOptions(isDark)}>
      <Stack.Screen
        name="index"
        options={createLargeTitleHeaderOptions(isDark, {
          headerSearchBarOptions: undefined,
          title: t('title'),
          ...(Platform.OS === 'ios'
            ? {
                unstable_headerRightItems: (): NativeStackHeaderItem[] => [
                  {
                    type: 'button',
                    label: t('history.openAction'),
                    icon: { type: 'sfSymbol', name: 'clock.arrow.circlepath' },
                    variant: 'plain',
                    tintColor: headerAccent,
                    onPress: () => router.push('/perks/history'),
                    accessibilityLabel: t('history.openAction'),
                    accessibilityHint: t('history.openHint'),
                    hidesSharedBackground: true,
                  },
                ],
              }
            : {
                headerRight: () => (
                  <Pressable
                    accessibilityHint={t('history.openHint')}
                    accessibilityLabel={t('history.openAction')}
                    accessibilityRole="button"
                    className="flex-row items-center px-2 py-1"
                    onPress={() => router.push('/perks/history')}
                    testID="perks-history-link"
                  >
                    <History color={headerAccent} size={14} />
                    <Text className="ml-1 text-xs font-bold text-primary dark:text-primary-bright">
                      {t('history.openAction')}
                    </Text>
                  </Pressable>
                ),
              }),
        })}
      />
      <Stack.Screen
        name="history"
        options={{ headerShown: false, presentation: 'card' }}
      />
    </Stack>
  );
}

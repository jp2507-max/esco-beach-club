import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppScreenContent } from '@/src/components/app/app-screen-content';
import { ProfileSubScreenHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

export default function ProfilePaymentsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('membership');
  const { contentStyle } = useScreenEntry({ durationMs: 400 });

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader
        testID="payments-back"
        title={t('manageAccount.managePayments')}
      />
      <AppScreenContent className="flex-1">
        <Animated.View className="flex-1" style={contentStyle}>
          <ScrollView
            contentContainerClassName="px-5 pb-10 pt-4"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-base text-text-secondary dark:text-text-secondary-dark">
              {t('comingSoon')}
            </Text>
          </ScrollView>
        </Animated.View>
      </AppScreenContent>
    </View>
  );
}

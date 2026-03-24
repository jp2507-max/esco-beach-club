import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/colors';
import { cn } from '@/src/lib/utils';
import { Text, View } from '@/src/tw';

import { HeaderGlassButton } from './header-glass-button';

export type ProfileSubScreenHeaderProps = {
  className?: string;
  onBackPress?: () => void;
  testID?: string;
  title: string;
};

export function ProfileSubScreenHeader({
  className,
  onBackPress,
  testID = 'profile-sub-screen-back',
  title,
}: ProfileSubScreenHeaderProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('common');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className={cn('flex-row items-center px-5 pb-3 pt-2', className)}>
      <HeaderGlassButton
        accessibilityHint={t('backHint')}
        accessibilityLabel={t('back')}
        onPress={onBackPress ?? (() => router.back())}
        testID={testID}
      >
        <ChevronLeft
          color={isDark ? Colors.primaryBright : Colors.primary}
          size={24}
        />
      </HeaderGlassButton>

      <Text className="ml-3 flex-1 text-2xl font-bold tracking-tight text-primary dark:text-primary-bright">
        {title}
      </Text>

      <View className="size-10" />
    </View>
  );
}

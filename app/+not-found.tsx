import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Pressable, Text, View } from '@/src/tw';

export default function NotFoundScreen(): React.JSX.Element {
  const { t } = useTranslation('common');
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-dark-bg">
        <Text className="text-lg font-semibold text-text dark:text-text-primary-dark">
          {t('notFound.title')}
        </Text>
        <Link href="/" asChild={true}>
          <Pressable accessibilityRole="button" className="mt-[15px] py-[15px]">
            <Text className="text-sm font-semibold text-primary dark:text-primary-bright">
              {t('notFound.cta')}
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

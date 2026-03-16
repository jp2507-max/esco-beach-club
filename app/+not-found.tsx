import { Link, Stack } from 'expo-router';

import { Pressable, Text, View } from '@/src/tw';

export default function NotFoundScreen(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center bg-background px-5 dark:bg-dark-bg">
        <Text className="text-lg font-semibold text-text dark:text-text-primary-dark">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" asChild={true}>
          <Pressable accessibilityRole="button" className="mt-[15px] py-[15px]">
            <Text className="text-sm font-semibold text-primary dark:text-primary-bright">
              Go to home screen
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

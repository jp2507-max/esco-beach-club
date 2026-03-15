import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { Pressable, Text, View } from '@/src/tw';

export default function ModalScreen(): React.JSX.Element {
  return (
    <Pressable
      className="flex-1 items-center justify-center bg-black/50"
      onPress={() => router.back()}
    >
      <View className="mx-5 min-w-[300px] items-center rounded-[20px] bg-card p-6 dark:bg-dark-bg-card">
        <Text className="mb-4 text-xl font-bold text-text dark:text-text-primary-dark">Esco Life</Text>
        <Text className="mb-6 text-center leading-5 text-text-secondary dark:text-text-secondary-dark">
          Welcome to Esco Life Beach Club. Enjoy exclusive member benefits.
        </Text>
        <Pressable
          className="min-w-[100px] rounded-xl bg-primary px-6 py-3"
          onPress={() => router.back()}
        >
          <Text className="text-center font-semibold text-white">Close</Text>
        </Pressable>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </Pressable>
  );
}

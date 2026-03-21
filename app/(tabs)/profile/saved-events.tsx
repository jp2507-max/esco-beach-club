import { useRouter } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/colors';
import { useSavedEventsData } from '@/providers/DataProvider';
import { Button } from '@/src/components/ui';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from '@/src/tw';
import { Image } from '@/src/tw/image';

export default function SavedEventsScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { savedEventsList, savedEventsLoading, toggleSavedEvent } =
    useSavedEventsData();
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);

  if (savedEventsLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-bg">
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      className="flex-1 bg-background dark:bg-dark-bg"
      contentContainerClassName="px-5 pb-8 pt-4"
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6 rounded-[22px] border border-border bg-white p-5 dark:border-dark-border dark:bg-dark-bg-card">
        <Text className="text-xl font-extrabold text-text dark:text-text-primary-dark">
          {t('savedEvents.title')}
        </Text>
        <Text className="mt-2 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
          {t('savedEvents.subtitle')}
        </Text>
      </View>

      {savedEventsList.length === 0 ? (
        <View className="rounded-[22px] border border-border bg-white p-6 dark:border-dark-border dark:bg-dark-bg-card">
          <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
            {t('savedEvents.emptyTitle')}
          </Text>
          <Text className="mt-2 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
            {t('savedEvents.emptyDescription')}
          </Text>
          <Button
            className="mt-5"
            onPress={() => router.push('/events')}
            testID="saved-events-browse"
          >
            {t('savedEvents.browseEvents')}
          </Button>
        </View>
      ) : (
        savedEventsList.map((event) => (
          <View
            className="mb-3 overflow-hidden rounded-[22px] border border-border bg-white dark:border-dark-border dark:bg-dark-bg-card"
            key={event.id}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/events/[id]' as never,
                  params: { id: event.id },
                })
              }
              testID={`saved-event-${event.id}`}
            >
              <Image
                className="h-44 w-full"
                source={{ uri: event.image }}
                cachePolicy="memory-disk"
                contentFit="cover"
                recyclingKey={`saved-event-${event.id}`}
                transition={180}
              />
              <View className="p-4 pb-0">
                <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                  {event.title}
                </Text>
                <View className="mt-2 flex-row items-center">
                  <Calendar color={Colors.textSecondary} size={14} />
                  <Text className="ml-1.5 text-sm text-text-secondary dark:text-text-secondary-dark">
                    {event.date} • {event.time}
                  </Text>
                </View>
                <View className="mt-2 flex-row items-center">
                  <MapPin color={Colors.textSecondary} size={14} />
                  <Text className="ml-1.5 text-sm text-text-secondary dark:text-text-secondary-dark">
                    {event.location}
                  </Text>
                </View>
              </View>
            </Pressable>
            <View className="p-4 pt-4">
              <Text className="text-lg font-extrabold text-text dark:text-text-primary-dark">
                {event.price}
              </Text>
              <Button
                className="mt-4"
                isLoading={pendingRemoval === event.id}
                onPress={async () => {
                  setPendingRemoval(event.id);
                  try {
                    await toggleSavedEvent(event.id);
                  } finally {
                    setPendingRemoval(null);
                  }
                }}
                testID={`remove-saved-event-${event.id}`}
                variant="outline"
              >
                {t('savedEvents.remove')}
              </Button>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

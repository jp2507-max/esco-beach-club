import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { Calendar, MapPin } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import type { Event } from '@/lib/types';
import { useSavedEventsData } from '@/providers/DataProvider';
import { AppScreenContent } from '@/src/components/app/app-screen-content';
import {
  Button,
  ProfileSubScreenHeader,
  SkeletonCard,
  SurfaceCard,
} from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import { useStaggeredListEntering } from '@/src/lib/animations/use-staggered-entry';
import { hapticLight } from '@/src/lib/haptics/haptics';
import { Pressable, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';
import { Image } from '@/src/tw/image';

function SavedEventRowStagger({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}): React.JSX.Element {
  const entering = useStaggeredListEntering(index);
  return <Animated.View entering={entering}>{children}</Animated.View>;
}

type SavedEventRowProps = {
  event: Event;
  index: number;
  isRemoving: boolean;
  onOpen: (eventId: string) => void;
  onRemove: (eventId: string) => Promise<void>;
  removeLabel: string;
};

function SavedEventRow({
  event,
  index,
  isRemoving,
  onOpen,
  onRemove,
  removeLabel,
}: SavedEventRowProps): React.JSX.Element {
  return (
    <SavedEventRowStagger index={index}>
      <SurfaceCard className="mb-3 overflow-hidden">
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(event.id)}
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
            isLoading={isRemoving}
            onPress={async () => {
              await onRemove(event.id);
            }}
            testID={`remove-saved-event-${event.id}`}
            variant="outline"
          >
            {removeLabel}
          </Button>
        </View>
      </SurfaceCard>
    </SavedEventRowStagger>
  );
}

const MemoizedSavedEventRow = React.memo(SavedEventRow);

export default function SavedEventsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation('profile');
  const { savedEventsList, savedEventsLoading, toggleSavedEvent } =
    useSavedEventsData();
  const { contentStyle } = useScreenEntry({ durationMs: 400 });
  const [pendingRemovals, setPendingRemovals] = useState<Set<string>>(
    new Set()
  );
  const listContentContainerStyle = useMemo(
    () => ({ paddingBottom: 32, paddingHorizontal: 20, paddingTop: 4 }),
    []
  );

  const handleOpenEvent = useCallback(
    (eventId: string): void => {
      router.push({
        pathname: '/events/[id]' as never,
        params: { id: eventId },
      });
    },
    [router]
  );

  const handleRemoveEvent = useCallback(
    async (eventId: string): Promise<void> => {
      hapticLight();
      setPendingRemovals((previous) => new Set(previous).add(eventId));
      try {
        await toggleSavedEvent(eventId);
      } finally {
        setPendingRemovals((previous) => {
          const next = new Set(previous);
          next.delete(eventId);
          return next;
        });
      }
    },
    [toggleSavedEvent]
  );

  const renderSavedEvent = useCallback(
    ({ index, item }: ListRenderItemInfo<Event>): React.JSX.Element => (
      <MemoizedSavedEventRow
        event={item}
        index={index}
        isRemoving={pendingRemovals.has(item.id)}
        onOpen={handleOpenEvent}
        onRemove={handleRemoveEvent}
        removeLabel={t('savedEvents.remove')}
      />
    ),
    [handleOpenEvent, handleRemoveEvent, pendingRemovals, t]
  );

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ProfileSubScreenHeader title={t('savedEvents.title')} />

      <AppScreenContent className="flex-1">
        <FlashList
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={listContentContainerStyle}
          data={savedEventsList}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            savedEventsLoading ? null : (
              <Animated.View style={contentStyle}>
                <SurfaceCard className="mb-6 p-5">
                  <Text className="text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                    {t('savedEvents.subtitle')}
                  </Text>
                </SurfaceCard>
              </Animated.View>
            )
          }
          ListEmptyComponent={
            savedEventsLoading ? (
              <View>
                <SkeletonCard className="mb-4" height={140} />
                <SkeletonCard className="mb-4" height={140} />
                <SkeletonCard height={140} />
              </View>
            ) : (
              <SurfaceCard className="p-6">
                <Text className="text-lg font-bold text-text dark:text-text-primary-dark">
                  {t('savedEvents.emptyTitle')}
                </Text>
                <Text className="mt-2 text-sm leading-5 text-text-secondary dark:text-text-secondary-dark">
                  {t('savedEvents.emptyDescription')}
                </Text>
                <Button
                  className="mt-5"
                  onPress={() => {
                    hapticLight();
                    router.push('/events');
                  }}
                  testID="saved-events-browse"
                >
                  {t('savedEvents.browseEvents')}
                </Button>
              </SurfaceCard>
            )
          }
          renderItem={renderSavedEvent}
          showsVerticalScrollIndicator={false}
        />
      </AppScreenContent>
    </View>
  );
}

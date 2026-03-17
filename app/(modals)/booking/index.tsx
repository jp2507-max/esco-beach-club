import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  Minus,
  Plus,
  Sparkles,
  Users,
  X,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { useProfileData } from '@/providers/DataProvider';
import { rmTiming } from '@/src/lib/animations/motion';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const TIME_SLOTS = [
  { time: '18:00', available: true },
  { time: '18:30', available: true },
  { time: '19:00', available: true },
  { time: '19:30', available: false },
  { time: '20:00', available: true },
  { time: '20:30', available: false },
  { time: '21:00', available: true },
  { time: '21:30', available: true },
];

const OCCASIONS = [
  'Date Night',
  'Birthday',
  'Business',
  'Casual',
  'Celebration',
] as const;

function getNext7Days(): {
  labelKey: string;
  day: string;
  date: Date;
  monthKey: string;
  dayNameKey: string;
}[] {
  const days: {
    labelKey: string;
    day: string;
    date: Date;
    monthKey: string;
    dayNameKey: string;
  }[] = [];
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const monthNames = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec',
  ] as const;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      date: d,
      day: String(d.getDate()),
      dayNameKey: dayNames[d.getDay()],
      labelKey: i === 0 ? 'today' : dayNames[d.getDay()],
      monthKey: monthNames[d.getMonth()],
    });
  }
  return days;
}

export default function BookingModalScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventTitle } = useLocalSearchParams<{ eventTitle?: string }>();
  const { profile } = useProfileData();
  const { t } = useTranslation(['booking', 'common']);

  const [now, setNow] = useState(() => new Date());
  const dates = useMemo(() => getNext7Days(), [now]);

  useEffect(() => {
    const msUntilMidnight = (): number => {
      const d = new Date();
      d.setHours(24, 0, 0, 0);
      return d.getTime() - Date.now();
    };
    const timeout = setTimeout(() => {
      setNow(new Date());
    }, msUntilMidnight());
    return () => clearTimeout(timeout);
  }, [now]);
  const [selectedDate, setSelectedDate] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pax, setPax] = useState<number>(2);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fadeIn = useSharedValue(0);
  const slideUp = useSharedValue(30);

  useEffect(() => {
    fadeIn.set(withTiming(1, rmTiming(400)));
    slideUp.set(withTiming(0, rmTiming(400)));
    return () => {
      cancelAnimation(fadeIn);
      cancelAnimation(slideUp);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, [confirmTimeoutRef, fadeIn, slideUp]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: fadeIn.get(),
    transform: [{ translateY: slideUp.get() }],
  }));

  const canConfirm = selectedTime !== null && occasion !== null;

  function handleConfirm(): void {
    if (!canConfirm) return;
    setIsSubmitting(true);
    console.log('[Booking] Submitting reservation...');
    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }
    confirmTimeoutRef.current = setTimeout(() => {
      const name =
        profile?.full_name?.split(' ')[0] ?? t('common:bookingSuccess.guest');
      const dateStr =
        t(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `booking:days.${dates[selectedDate].dayNameKey}` as any
        ) +
        ', ' +
        t(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          `booking:months.${dates[selectedDate].monthKey}` as any
        ) +
        ' ' +
        dates[selectedDate].day;
      const subtitle = t('booking:confirmationMessage', {
        date: dateStr,
        time: selectedTime,
      });
      const nextRoute = `/booking/success?name=${encodeURIComponent(name)}&subtitle=${encodeURIComponent(subtitle)}`;
      router.replace(nextRoute as never);
    }, 1500);
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <View className="flex-row items-center justify-between border-b border-border px-5 py-4 dark:border-dark-border">
        <View>
          <Text className="text-2xl font-extrabold text-text dark:text-text-primary-dark">
            {t('booking:reserveSpot')}
          </Text>
          {eventTitle ? (
            <Text className="mt-0.5 text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
              {eventTitle}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          className="size-10 items-center justify-center rounded-full bg-sand dark:bg-dark-bg-card"
          onPress={() => router.back()}
          testID="close-booking"
        >
          <X color={Colors.text} size={20} />
        </Pressable>
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          <View className="mb-7">
            <View className="mb-3.5 flex-row items-center">
              <CalendarDays color={Colors.primary} size={18} />
              <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
                {t('booking:selectDate')}
              </Text>
            </View>
            <ScrollView
              contentContainerClassName="gap-2.5 pr-5"
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {dates.map((d, i) => {
                const active = selectedDate === i;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={`${d.day}-${d.monthKey}`}
                    className={
                      active
                        ? 'h-20 w-[68px] items-center justify-center rounded-2xl bg-primary'
                        : 'h-20 w-[68px] items-center justify-center rounded-2xl border-[1.5px] border-border bg-white dark:border-dark-border dark:bg-dark-bg-card'
                    }
                    onPress={() => !isSubmitting && setSelectedDate(i)}
                    disabled={isSubmitting}
                    style={isSubmitting ? { opacity: 0.7 } : undefined}
                    testID={`date-${i}`}
                  >
                    <Text
                      className={
                        active
                          ? 'text-xs font-semibold text-white/80'
                          : 'text-xs font-semibold text-text-secondary dark:text-text-secondary-dark'
                      }
                    >
                      {t(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        `booking:days.${d.labelKey}` as any
                      )}
                    </Text>
                    <Text
                      className={
                        active
                          ? 'mt-1 text-[22px] font-extrabold text-white'
                          : 'mt-1 text-[22px] font-extrabold text-text dark:text-text-primary-dark'
                      }
                    >
                      {d.day}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View className="mb-7">
            <View className="mb-3.5 flex-row items-center">
              <Sparkles color={Colors.primary} size={18} />
              <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
                {t('booking:pickTime')}
              </Text>
            </View>
            <View className="flex-row flex-wrap">
              {TIME_SLOTS.map((slot) => {
                const active = selectedTime === slot.time;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={slot.time}
                    className="mb-2.5 items-center rounded-[14px] py-[14px]"
                    onPress={() =>
                      slot.available &&
                      !isSubmitting &&
                      setSelectedTime(slot.time)
                    }
                    disabled={!slot.available || isSubmitting}
                    style={{
                      backgroundColor: !slot.available
                        ? Colors.sand
                        : active
                          ? Colors.primary
                          : Colors.surface,
                      borderColor: !slot.available
                        ? Colors.sandDark
                        : active
                          ? Colors.primary
                          : Colors.border,
                      borderWidth: 1.5,
                      marginRight: 10,
                      opacity: !slot.available ? 0.6 : isSubmitting ? 0.7 : 1,
                      width: '23%',
                    }}
                    testID={`time-${slot.time}`}
                  >
                    <Text
                      className="text-[15px] font-bold"
                      style={{
                        color: !slot.available
                          ? Colors.textLight
                          : active
                            ? '#fff'
                            : Colors.text,
                      }}
                    >
                      {slot.time}
                    </Text>
                    {!slot.available ? (
                      <Text className="mt-0.5 text-[9px] font-bold tracking-[0.5px] text-primary">
                        {t('booking:full')}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="mb-7">
            <View className="mb-3.5 flex-row items-center">
              <Users color={Colors.primary} size={18} />
              <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
                {t('booking:numGuests')}
              </Text>
            </View>
            <View className="flex-row items-center justify-center rounded-[20px] border border-border bg-white py-5 dark:border-dark-border dark:bg-dark-bg-card">
              <Pressable
                accessibilityRole="button"
                className="size-12 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
                onPress={() => !isSubmitting && setPax(Math.max(1, pax - 1))}
                disabled={pax <= 1 || isSubmitting}
                style={pax <= 1 || isSubmitting ? { opacity: 0.4 } : undefined}
                testID="pax-minus"
              >
                <Minus
                  color={pax <= 1 ? Colors.textLight : Colors.text}
                  size={20}
                />
              </Pressable>
              <View className="mx-6 items-center">
                <Text className="text-4xl font-extrabold text-text dark:text-text-primary-dark">
                  {pax}
                </Text>
                <Text className="mt-0.5 text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                  {t('booking:guestsUnit')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                className="size-12 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
                onPress={() => !isSubmitting && setPax(Math.min(20, pax + 1))}
                disabled={pax >= 20 || isSubmitting}
                style={pax >= 20 || isSubmitting ? { opacity: 0.4 } : undefined}
                testID="pax-plus"
              >
                <Plus
                  color={pax >= 20 ? Colors.textLight : Colors.text}
                  size={20}
                />
              </Pressable>
            </View>
          </View>

          <View className="mb-7">
            <Text className="text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('booking:occasionTitle')}
            </Text>
            <View className="mt-2.5 flex-row flex-wrap">
              {OCCASIONS.map((o) => {
                const active = occasion === o;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={o}
                    className="mb-2.5 mr-2.5 rounded-full px-[18px] py-3"
                    onPress={() => !isSubmitting && setOccasion(o)}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: active
                        ? Colors.secondary
                        : Colors.surface,
                      borderColor: active ? Colors.secondary : Colors.border,
                      borderWidth: 1.5,
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                    testID={`occasion-${o}`}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: active ? '#fff' : Colors.text }}
                    >
                      {t(
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        `booking:occasions.${o}` as any
                      )}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="h-[120px]" />
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-5 pt-3.5 dark:border-dark-border dark:bg-dark-bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Pressable
          accessibilityRole="button"
          className="items-center rounded-2xl bg-primary py-[18px]"
          onPress={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          style={!canConfirm ? { opacity: 0.45 } : undefined}
          testID="confirm-booking"
        >
          <Text className="text-[17px] font-bold text-white">
            {isSubmitting
              ? t('booking:reserving')
              : t('booking:confirmReservation')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

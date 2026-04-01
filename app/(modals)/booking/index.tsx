import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  CalendarDays,
  Minus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { submitTableReservation } from '@/lib/api';
import {
  useBookingContentData,
  useProfileData,
} from '@/providers/DataProvider';
import { Button, ModalHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
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

function getSlotColors(isDark: boolean, available: boolean, active: boolean) {
  return {
    backgroundColor: !available
      ? isDark
        ? Colors.darkBgElevated
        : Colors.sand
      : active
        ? Colors.primary
        : isDark
          ? Colors.darkBgCard
          : Colors.surface,
    borderColor: !available
      ? isDark
        ? Colors.darkBorder
        : Colors.sandDark
      : active
        ? Colors.primary
        : isDark
          ? Colors.darkBorder
          : Colors.border,
    color: !available
      ? isDark
        ? Colors.textMutedDark
        : Colors.textLight
      : active
        ? '#fff'
        : isDark
          ? Colors.textPrimaryDark
          : Colors.text,
  };
}

const OCCASIONS = [
  'dateNight',
  'birthday',
  'business',
  'casual',
  'celebration',
] as const;

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
const MONTH_KEYS = [
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

type BookingOccasionKey = (typeof OCCASIONS)[number];
type BookingDayKey = (typeof DAY_KEYS)[number];
type BookingMonthKey = (typeof MONTH_KEYS)[number];
type BookingDayLabelKey = 'today' | BookingDayKey;

type BookingOccasionTranslationKey = `booking:occasions.${BookingOccasionKey}`;
type BookingDayTranslationKey = `booking:days.${BookingDayLabelKey}`;
type BookingMonthTranslationKey = `booking:months.${BookingMonthKey}`;
type BookingOccasionTranslationKeyFromApi = `booking:occasions.${string}`;

type ResolvedOccasion = {
  label: string;
  value: string;
};

type ResolvedTimeSlot = {
  available: boolean;
  time: string;
};

function getNext7Days(baseDate: Date): {
  labelKey: BookingDayLabelKey;
  day: string;
  date: Date;
  monthKey: BookingMonthKey;
  dayNameKey: BookingDayKey;
}[] {
  const days: {
    labelKey: BookingDayLabelKey;
    day: string;
    date: Date;
    monthKey: BookingMonthKey;
    dayNameKey: BookingDayKey;
  }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push({
      date: d,
      day: String(d.getDate()),
      dayNameKey: DAY_KEYS[d.getDay()],
      labelKey: i === 0 ? 'today' : DAY_KEYS[d.getDay()],
      monthKey: MONTH_KEYS[d.getMonth()],
    });
  }
  return days;
}

function getOccasionTranslationKey(
  value: BookingOccasionKey
): BookingOccasionTranslationKey {
  return `booking:occasions.${value}`;
}

function getOccasionLabel(value: BookingOccasionKey): string {
  const labels: Record<BookingOccasionKey, string> = {
    dateNight: 'Date Night',
    birthday: 'Birthday',
    business: 'Business',
    casual: 'Casual',
    celebration: 'Celebration',
  };
  return labels[value];
}

function isBookingOccasionTranslationKeyFromApi(
  key: unknown
): key is BookingOccasionTranslationKeyFromApi {
  return typeof key === 'string' && key.startsWith('booking:occasions.');
}

function getDayTranslationKey(
  value: BookingDayLabelKey
): BookingDayTranslationKey {
  return `booking:days.${value}`;
}

function getMonthTranslationKey(
  value: BookingMonthKey
): BookingMonthTranslationKey {
  return `booking:months.${value}`;
}

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function BookingModalScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId, eventTitle } = useLocalSearchParams<{
    eventId?: string;
    eventTitle?: string;
  }>();
  const { profile, userId } = useProfileData();
  const { bookingOccasions, bookingTimeSlots } = useBookingContentData();
  const { t } = useTranslation(['booking', 'common']);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [now, setNow] = useState(() => new Date());
  const dates = useMemo(() => getNext7Days(now), [now]);

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
  const { contentStyle } = useScreenEntry();

  const resolvedTimeSlots = useMemo<ResolvedTimeSlot[]>(() => {
    if (bookingTimeSlots.length === 0) {
      return TIME_SLOTS;
    }

    return bookingTimeSlots.map((slot) => ({
      available: slot.available,
      time: slot.time,
    }));
  }, [bookingTimeSlots]);

  const resolvedOccasions = useMemo<ResolvedOccasion[]>(() => {
    if (bookingOccasions.length === 0) {
      return OCCASIONS.map((value) => ({
        label: t(getOccasionTranslationKey(value), {
          defaultValue: getOccasionLabel(value),
        }),
        value,
      }));
    }

    return bookingOccasions.map((option) => ({
      label: isBookingOccasionTranslationKeyFromApi(option.label_key)
        ? t(option.label_key, { defaultValue: option.value })
        : option.value,
      value: option.value,
    }));
  }, [bookingOccasions, t]);

  const isSelectedTimeValid = useMemo(
    () =>
      selectedTime !== null &&
      resolvedTimeSlots.some(
        (slot) => slot.time === selectedTime && slot.available
      ),
    [resolvedTimeSlots, selectedTime]
  );

  const isOccasionValid = useMemo(
    () =>
      occasion !== null &&
      resolvedOccasions.some((option) => option.value === occasion),
    [occasion, resolvedOccasions]
  );

  const canConfirm = isSelectedTimeValid && isOccasionValid;

  useEffect(() => {
    if (selectedTime && !isSelectedTimeValid) setSelectedTime(null);
  }, [isSelectedTimeValid, selectedTime]);

  useEffect(() => {
    if (occasion && !isOccasionValid) setOccasion(null);
  }, [isOccasionValid, occasion]);

  function getConfirmationDate(): string {
    return (
      t(getDayTranslationKey(dates[selectedDate].dayNameKey)) +
      ', ' +
      t(getMonthTranslationKey(dates[selectedDate].monthKey)) +
      ' ' +
      dates[selectedDate].day
    );
  }

  async function handleConfirm(): Promise<void> {
    if (!canConfirm) return;
    if (!userId || !selectedTime || !occasion) {
      Alert.alert(
        t('booking:reservationFailedTitle'),
        t('booking:reservationFailedMessage')
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await submitTableReservation({
        event_id: eventId,
        event_title: eventTitle,
        occasion,
        party_size: pax,
        reservation_date: toLocalDateString(dates[selectedDate].date),
        reservation_time: selectedTime,
        source: eventId ? 'event' : 'general',
        user_id: userId,
      });

      const name =
        profile?.full_name?.split(' ')[0] ?? t('common:bookingSuccess.guest');
      const subtitle = t('booking:confirmationMessage', {
        date: getConfirmationDate(),
        time: selectedTime,
      });

      router.replace({
        pathname: '/booking/success' as never,
        params: { name, subtitle },
      });
    } catch (error: unknown) {
      console.error('[Booking] Failed to submit reservation:', error);
      Alert.alert(
        t('booking:reservationFailedTitle'),
        t('booking:reservationFailedMessage')
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View
      className="flex-1 bg-background dark:bg-dark-bg"
      style={{ paddingTop: insets.top }}
    >
      <ModalHeader
        className="border-b border-border dark:border-dark-border"
        closeTestID="close-booking"
        onClose={() => router.back()}
        subtitle={eventTitle}
        title={t('booking:reserveSpot')}
      />

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-5"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={contentStyle}>
          <View className="mb-7">
            <View className="mb-3.5 flex-row items-center">
              <CalendarDays
                color={accentOnDarkBackground(Colors.primary, isDark)}
                size={18}
              />
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
                        ? 'h-20 w-17 items-center justify-center rounded-2xl bg-primary'
                        : 'h-20 w-17 items-center justify-center rounded-2xl border-[1.5px] border-border bg-white dark:border-dark-border dark:bg-dark-bg-card'
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
                      {t(getDayTranslationKey(d.labelKey))}
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
              <Sparkles
                color={accentOnDarkBackground(Colors.primary, isDark)}
                size={18}
              />
              <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
                {t('booking:pickTime')}
              </Text>
            </View>
            <View className="flex-row flex-wrap">
              {resolvedTimeSlots.map((slot) => {
                const active = selectedTime === slot.time;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={slot.time}
                    className="mb-2.5 items-center rounded-[14px] py-3.5"
                    onPress={() =>
                      slot.available &&
                      !isSubmitting &&
                      setSelectedTime(slot.time)
                    }
                    disabled={!slot.available || isSubmitting}
                    style={{
                      backgroundColor: getSlotColors(
                        isDark,
                        slot.available,
                        active
                      ).backgroundColor,
                      borderColor: getSlotColors(isDark, slot.available, active)
                        .borderColor,
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
                        color: getSlotColors(isDark, slot.available, active)
                          .color,
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
              <Users
                color={accentOnDarkBackground(Colors.primary, isDark)}
                size={18}
              />
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
                  color={
                    pax <= 1
                      ? isDark
                        ? Colors.textMutedDark
                        : Colors.textLight
                      : isDark
                        ? Colors.textPrimaryDark
                        : Colors.text
                  }
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
                  color={
                    pax >= 20
                      ? isDark
                        ? Colors.textMutedDark
                        : Colors.textLight
                      : isDark
                        ? Colors.textPrimaryDark
                        : Colors.text
                  }
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
              {resolvedOccasions.map((option) => {
                const active = occasion === option.value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={option.value}
                    className="mb-2.5 mr-2.5 rounded-full px-4.5 py-3"
                    onPress={() => !isSubmitting && setOccasion(option.value)}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: active
                        ? isDark
                          ? Colors.secondaryBright
                          : Colors.secondary
                        : isDark
                          ? Colors.darkBgCard
                          : Colors.surface,
                      borderColor: active
                        ? isDark
                          ? Colors.secondaryBright
                          : Colors.secondary
                        : isDark
                          ? Colors.darkBorder
                          : Colors.border,
                      borderWidth: 1.5,
                      opacity: isSubmitting ? 0.7 : 1,
                    }}
                    testID={`occasion-${option.value}`}
                  >
                    <Text
                      className="text-sm font-semibold"
                      style={{
                        color: active
                          ? isDark
                            ? Colors.secondaryDeeper
                            : '#fff'
                          : isDark
                            ? Colors.textPrimaryDark
                            : Colors.text,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="h-30" />
        </Animated.View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-5 pt-3.5 dark:border-dark-border dark:bg-dark-bg-card"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <Button
          className="rounded-2xl"
          onPress={handleConfirm}
          disabled={!canConfirm || isSubmitting}
          size="lg"
          testID="confirm-booking"
        >
          {isSubmitting
            ? t('booking:reserving')
            : t('booking:confirmReservation')}
        </Button>
      </View>
    </View>
  );
}

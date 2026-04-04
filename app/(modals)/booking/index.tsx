import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { submitTableReservation } from '@/lib/api';
import {
  useBookingContentData,
  useProfileData,
} from '@/providers/DataProvider';
import {
  BookingFooterBar,
  BookingFormContent,
} from '@/src/components/booking/booking-form-sections';
import { ModalHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import {
  FALLBACK_OCCASIONS,
  FALLBACK_TIME_SLOTS,
  getBookingConfirmationDate,
  getNext7Days,
  getOccasionTranslationKey,
  isBookingOccasionTranslationKeyFromApi,
  type ResolvedOccasion,
  type ResolvedTimeSlot,
  toLocalDateString,
} from '@/src/lib/booking/booking-screen';
import { hapticMedium, hapticSelection } from '@/src/lib/haptics/haptics';
import { ActivityIndicator, View } from '@/src/tw';

export default function BookingModalScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { eventId, eventTitle } = useLocalSearchParams<{
    eventId?: string;
    eventTitle?: string;
  }>();
  const { profile, userId } = useProfileData();
  const { bookingContentLoading, bookingOccasions, bookingTimeSlots } =
    useBookingContentData();
  const { t } = useTranslation(['booking', 'common']);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [now, setNow] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toLocalDateString(new Date())
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [pax, setPax] = useState<number>(2);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);
  const { contentStyle } = useScreenEntry();

  const dates = useMemo(() => getNext7Days(now), [now]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const nextNow = new Date();
      setNow(nextNow);
    }, getMillisecondsUntilMidnight());

    return () => clearTimeout(timeout);
  }, [now]);

  const resolvedTimeSlots = useMemo<ResolvedTimeSlot[]>(() => {
    if (bookingContentLoading) return [];
    if (bookingTimeSlots.length === 0) return [...FALLBACK_TIME_SLOTS];

    return bookingTimeSlots.map((slot) => ({
      available: slot.available,
      time: slot.time,
    }));
  }, [bookingContentLoading, bookingTimeSlots]);

  const resolvedOccasions = useMemo<ResolvedOccasion[]>(() => {
    if (bookingContentLoading) return [];

    if (bookingOccasions.length === 0) {
      return FALLBACK_OCCASIONS.map((value) => ({
        label: t(getOccasionTranslationKey(value), {
          defaultValue: value,
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
  }, [bookingContentLoading, bookingOccasions, t]);

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
  const isSelectedDateValid = useMemo(
    () => dates.some((date) => date.dateKey === selectedDateKey),
    [dates, selectedDateKey]
  );
  const canConfirm =
    isSelectedDateValid && isSelectedTimeValid && isOccasionValid;

  useEffect(() => {
    if (isSelectedDateValid) return;

    const nextDateKey = dates[0]?.dateKey ?? toLocalDateString(now);
    setSelectedDateKey(nextDateKey);
  }, [dates, isSelectedDateValid, now]);

  useEffect(() => {
    if (selectedTime !== null && !isSelectedTimeValid) {
      setSelectedTime(null);
    }
  }, [isSelectedTimeValid, selectedTime]);

  useEffect(() => {
    if (occasion !== null && !isOccasionValid) {
      setOccasion(null);
    }
  }, [isOccasionValid, occasion]);

  function handleSelectDate(dateKey: string): void {
    if (isSubmittingRef.current || isSubmitting) return;
    hapticSelection();
    setSelectedDateKey(dateKey);
  }

  function handleSelectTime(time: string): void {
    const slot = resolvedTimeSlots.find((candidate) => candidate.time === time);
    if (!slot?.available || isSubmittingRef.current || isSubmitting) return;

    hapticSelection();
    setSelectedTime(time);
  }

  function handlePaxChange(nextPax: number): void {
    if (
      !canChangeGuestCount(nextPax) ||
      isSubmittingRef.current ||
      isSubmitting
    )
      return;

    hapticSelection();
    setPax(nextPax);
  }

  function handleSelectOccasion(value: string): void {
    if (isSubmittingRef.current || isSubmitting) return;

    hapticSelection();
    setOccasion(value);
  }

  async function handleConfirm(): Promise<void> {
    if (isSubmittingRef.current || !canConfirm) return;
    if (!userId || !selectedTime || !occasion) {
      Alert.alert(
        t('booking:reservationFailedTitle'),
        t('booking:reservationFailedMessage')
      );
      return;
    }

    hapticMedium();
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await submitTableReservation({
        event_id: eventId,
        event_title: eventTitle,
        occasion,
        party_size: pax,
        reservation_date: selectedDateKey,
        reservation_time: selectedTime,
        source: eventId ? 'event' : 'general',
        user_id: userId,
      });

      const name =
        profile?.full_name?.split(' ')[0] ?? t('common:bookingSuccess.guest');
      const subtitle = t('booking:confirmationMessage', {
        date: getBookingConfirmationDate({
          dates,
          selectedDateKey,
          t,
        }),
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
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  if (bookingContentLoading) {
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
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator
            color={isDark ? Colors.primaryBright : Colors.primary}
            size="large"
          />
        </View>
      </View>
    );
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

      <BookingFormContent
        canChangeGuestCount={canChangeGuestCount}
        contentStyle={contentStyle}
        dates={dates}
        isDark={isDark}
        isSubmitting={isSubmitting}
        occasion={occasion}
        pax={pax}
        resolvedOccasions={resolvedOccasions}
        resolvedTimeSlots={resolvedTimeSlots}
        selectedDateKey={selectedDateKey}
        selectedTime={selectedTime}
        t={t}
        onOccasionSelect={handleSelectOccasion}
        onPaxChange={handlePaxChange}
        onSelectDate={handleSelectDate}
        onSelectTime={handleSelectTime}
      />

      <BookingFooterBar
        canConfirm={canConfirm}
        insetsBottom={insets.bottom}
        isSubmitting={isSubmitting}
        t={t}
        onConfirm={() => {
          void handleConfirm();
        }}
      />
    </View>
  );
}

function getMillisecondsUntilMidnight(): number {
  const nextMidnight = new Date();
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - Date.now();
}

function canChangeGuestCount(nextPax: number): boolean {
  return nextPax >= 1 && nextPax <= 20;
}

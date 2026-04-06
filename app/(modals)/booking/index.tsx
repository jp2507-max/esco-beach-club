import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { submitTableReservation } from '@/lib/api';
import { useProfileData } from '@/providers/DataProvider';
import { BookingContactInlineLinks } from '@/src/components/booking/booking-contact-actions';
import {
  BookingFooterBar,
  BookingFormContent,
} from '@/src/components/booking/booking-form-sections';
import { ModalHeader } from '@/src/components/ui';
import { useScreenEntry } from '@/src/lib/animations/use-screen-entry';
import {
  BOOKING_WINDOW_DAYS,
  getBookableTimeSlots,
  getBookingConfirmationDate,
  getNextBookingDays,
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
  const { profile, profileLoading, userId } = useProfileData();
  const { t } = useTranslation(['booking', 'common']);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [now, setNow] = useState(() => new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(() =>
    toLocalDateString(new Date())
  );
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string>('');
  const [specialRequest, setSpecialRequest] = useState<string>('');
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);
  const [pax, setPax] = useState<number>(2);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef(false);
  const { contentStyle } = useScreenEntry();

  const dates = useMemo(
    () => getNextBookingDays(now, BOOKING_WINDOW_DAYS),
    [now]
  );

  useEffect(() => {
    const todayKey = toLocalDateString(new Date());
    const refreshAfterMs =
      selectedDateKey === todayKey ? 60_000 : getMillisecondsUntilMidnight();
    const timeout = setTimeout(() => {
      setNow(new Date());
    }, refreshAfterMs);

    return () => clearTimeout(timeout);
  }, [now, selectedDateKey]);

  const availableTimeSlots = useMemo(
    () =>
      getBookableTimeSlots({
        now,
        selectedDateKey,
      }),
    [now, selectedDateKey]
  );

  const isSelectedTimeValid = useMemo(
    () => selectedTime !== null && availableTimeSlots.includes(selectedTime),
    [availableTimeSlots, selectedTime]
  );

  const normalizedContactEmail = useMemo(
    () => contactEmail.trim().toLowerCase(),
    [contactEmail]
  );
  const isContactEmailValid = useMemo(
    () => isEmailValid(normalizedContactEmail),
    [normalizedContactEmail]
  );
  const shouldShowEmailError =
    hasAttemptedSubmit || normalizedContactEmail.length > 0;
  const emailErrorMessage =
    shouldShowEmailError && !isContactEmailValid
      ? t('booking:contactEmailRequired')
      : null;

  const isSelectedDateValid = useMemo(
    () => dates.some((date) => date.dateKey === selectedDateKey),
    [dates, selectedDateKey]
  );
  const canConfirm = canSubmitReservation({
    isContactEmailValid,
    isSelectedTimeValid,
    userId,
  });

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

  function handleSelectDate(dateKey: string): void {
    if (isSubmittingRef.current || isSubmitting) return;
    hapticSelection();
    const nextSlots = getBookableTimeSlots({
      now,
      selectedDateKey: dateKey,
    });
    setSelectedDateKey(dateKey);
    setSelectedTime((current) =>
      current !== null && !nextSlots.includes(current) ? null : current
    );
  }

  function handleSelectTime(time: string): void {
    if (
      !availableTimeSlots.includes(time) ||
      isSubmittingRef.current ||
      isSubmitting
    )
      return;

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

  async function handleConfirm(): Promise<void> {
    if (isSubmittingRef.current || !userId) return;
    setHasAttemptedSubmit(true);

    if (!isSelectedTimeValid) {
      Alert.alert(
        t('booking:reservationFailedTitle'),
        t('booking:selectTimeRequired')
      );
      return;
    }

    if (!isContactEmailValid) {
      Alert.alert(
        t('booking:reservationFailedTitle'),
        t('booking:contactEmailRequired')
      );
      return;
    }

    hapticMedium();
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await submitTableReservation({
        contact_email: normalizedContactEmail,
        event_id: eventId,
        event_title: eventTitle,
        party_size: pax,
        reservation_date: selectedDateKey,
        reservation_time: selectedTime,
        special_request: specialRequest.trim() || undefined,
        source: eventId ? 'event' : 'general',
        user_id: userId,
      });

      const name =
        profile?.full_name?.split(' ')[0] ?? t('common:bookingSuccess.guest');
      const subtitle = t('booking:followUpMessage', {
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

  if (profileLoading) {
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
        contactEmail={contactEmail}
        contentStyle={contentStyle}
        dates={dates}
        emailErrorMessage={emailErrorMessage}
        footerExtras={<BookingContactInlineLinks />}
        isDark={isDark}
        isSubmitting={isSubmitting}
        now={now}
        pax={pax}
        availableTimeSlots={availableTimeSlots}
        selectedDateKey={selectedDateKey}
        selectedTime={selectedTime}
        specialRequest={specialRequest}
        t={t}
        onContactEmailChange={setContactEmail}
        onPaxChange={handlePaxChange}
        onSelectDate={handleSelectDate}
        onSelectTime={handleSelectTime}
        onSpecialRequestChange={setSpecialRequest}
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

function canSubmitReservation({
  isContactEmailValid,
  isSelectedTimeValid,
  userId,
}: {
  isContactEmailValid: boolean;
  isSelectedTimeValid: boolean;
  userId?: string;
}): boolean {
  return Boolean(userId) && isSelectedTimeValid && isContactEmailValid;
}

function isEmailValid(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

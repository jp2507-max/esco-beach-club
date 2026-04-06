import type { TFunction } from 'i18next';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Mail,
  Minus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, type StyleProp, type ViewStyle } from 'react-native';
import type { AnimatedStyle } from 'react-native-reanimated';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { Button } from '@/src/components/ui';
import type {
  BookingDateOption,
  BookingDayKey,
} from '@/src/lib/booking/booking-screen';
import {
  buildBookingCalendarCells,
  getBookingMonthOptions,
  getDayTranslationKey,
  getMonthTranslationKey,
} from '@/src/lib/booking/booking-screen';
import { Pressable, ScrollView, Text, TextInput, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

const WEEKDAY_KEYS: BookingDayKey[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
];

type BookingFormContentProps = {
  availableTimeSlots: string[];
  canChangeGuestCount: (nextPax: number) => boolean;
  contactEmail: string;
  contentStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  dates: BookingDateOption[];
  emailErrorMessage: string | null;
  footerExtras?: React.ReactNode;
  isDark: boolean;
  isSubmitting: boolean;
  now: Date;
  pax: number;
  selectedDateKey: string;
  selectedTime: string | null;
  specialRequest: string;
  t: TFunction;
  onContactEmailChange: (value: string) => void;
  onPaxChange: (nextPax: number) => void;
  onSelectDate: (dateKey: string) => void;
  onSelectTime: (time: string) => void;
  onSpecialRequestChange: (value: string) => void;
};

export function BookingFormContent({
  availableTimeSlots,
  canChangeGuestCount,
  contactEmail,
  contentStyle,
  dates,
  emailErrorMessage,
  footerExtras,
  isDark,
  isSubmitting,
  now,
  pax,
  selectedDateKey,
  selectedTime,
  specialRequest,
  t,
  onContactEmailChange,
  onPaxChange,
  onSelectDate,
  onSelectTime,
  onSpecialRequestChange,
}: BookingFormContentProps): React.JSX.Element {
  const { t: tCommon } = useTranslation('common');
  const accentColor = accentOnDarkBackground(Colors.primary, isDark);
  const minusDisabled = !canChangeGuestCount(pax - 1) || isSubmitting;
  const plusDisabled = !canChangeGuestCount(pax + 1) || isSubmitting;
  const monthOptions = useMemo(() => getBookingMonthOptions(dates), [dates]);
  const selectedMonthKey = selectedDateKey.slice(0, 7);
  const [activeMonthKey, setActiveMonthKey] =
    useState<string>(selectedMonthKey);
  const [isTimePickerVisible, setIsTimePickerVisible] =
    useState<boolean>(false);

  useEffect(() => {
    const isSelectedMonthValid = monthOptions.some(
      (option) => option.key === selectedMonthKey
    );
    if (isSelectedMonthValid) {
      setActiveMonthKey(selectedMonthKey);
      return;
    }

    const isActiveMonthValid = monthOptions.some(
      (option) => option.key === activeMonthKey
    );
    if (!isActiveMonthValid) {
      setActiveMonthKey(monthOptions[0]?.key ?? selectedMonthKey);
    }
  }, [activeMonthKey, monthOptions, selectedMonthKey]);

  const activeMonthIndex = Math.max(
    monthOptions.findIndex((option) => option.key === activeMonthKey),
    0
  );
  const activeMonthOption = monthOptions[activeMonthIndex] ?? null;
  const canGoToPreviousMonth = activeMonthIndex > 0;
  const canGoToNextMonth = activeMonthIndex < monthOptions.length - 1;

  const calendarCells = useMemo(() => {
    if (!activeMonthOption) return [];

    return buildBookingCalendarCells({
      dateOptions: dates,
      monthOption: activeMonthOption,
      now,
    });
  }, [activeMonthOption, dates, now]);

  const activeMonthLabel = activeMonthOption
    ? t('monthYearLabel', {
        month: t(getMonthTranslationKey(activeMonthOption.monthKey)),
        year: activeMonthOption.year,
      })
    : '';

  const selectedDateText = dates.find(
    (date) => date.dateKey === selectedDateKey
  );
  const selectedDateLabel = selectedDateText
    ? t('dateLabel', {
        day: selectedDateText.day,
        month: t(getMonthTranslationKey(selectedDateText.monthKey)),
        weekday: t(getDayTranslationKey(selectedDateText.dayNameKey)),
      })
    : t('selectDate');

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-5 pb-6 pt-5"
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={contentStyle}>
        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <CalendarDays color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('selectDate')}
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-white p-3 dark:border-dark-border dark:bg-dark-bg-card">
            <View className="mb-3 flex-row items-center justify-between">
              <Pressable
                accessibilityHint={t('previousMonthHint')}
                accessibilityLabel={t('previousMonth')}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !canGoToPreviousMonth || isSubmitting,
                }}
                className="size-9 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
                disabled={!canGoToPreviousMonth || isSubmitting}
                onPress={() => {
                  if (!canGoToPreviousMonth) return;
                  setActiveMonthKey(
                    monthOptions[activeMonthIndex - 1]?.key ?? activeMonthKey
                  );
                }}
                style={
                  !canGoToPreviousMonth || isSubmitting
                    ? { opacity: 0.45 }
                    : undefined
                }
                testID="booking-month-prev"
              >
                <ChevronLeft
                  color={isDark ? Colors.textPrimaryDark : Colors.text}
                  size={18}
                />
              </Pressable>
              <Text className="text-base font-bold text-text dark:text-text-primary-dark">
                {activeMonthLabel}
              </Text>
              <Pressable
                accessibilityHint={t('nextMonthHint')}
                accessibilityLabel={t('nextMonth')}
                accessibilityRole="button"
                accessibilityState={{
                  disabled: !canGoToNextMonth || isSubmitting,
                }}
                className="size-9 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
                disabled={!canGoToNextMonth || isSubmitting}
                onPress={() => {
                  if (!canGoToNextMonth) return;
                  setActiveMonthKey(
                    monthOptions[activeMonthIndex + 1]?.key ?? activeMonthKey
                  );
                }}
                style={
                  !canGoToNextMonth || isSubmitting
                    ? { opacity: 0.45 }
                    : undefined
                }
                testID="booking-month-next"
              >
                <ChevronRight
                  color={isDark ? Colors.textPrimaryDark : Colors.text}
                  size={18}
                />
              </Pressable>
            </View>

            <View className="mb-2 flex-row">
              {WEEKDAY_KEYS.map((day) => (
                <View
                  className="items-center"
                  key={day}
                  style={{ width: '14.285%' }}
                >
                  <Text className="text-xs font-semibold text-text-muted dark:text-text-muted-dark">
                    {t(getDayTranslationKey(day))}
                  </Text>
                </View>
              ))}
            </View>

            <View className="flex-row flex-wrap">
              {calendarCells.map((cell, index) => {
                const isSelected =
                  cell.dateKey !== null && cell.dateKey === selectedDateKey;

                if (cell.dateKey === null || cell.day === null) {
                  return (
                    <View
                      className="items-center justify-center py-1"
                      key={`empty-${index}`}
                      style={{ width: '14.285%' }}
                    >
                      <View className="size-10" />
                    </View>
                  );
                }

                const isDisabled = !cell.isSelectable || isSubmitting;

                return (
                  <View
                    className="items-center justify-center py-1"
                    key={cell.dateKey}
                    style={{ width: '14.285%' }}
                  >
                    <Pressable
                      accessibilityHint={t('selectDateHint')}
                      accessibilityLabel={t('calendarDateLabel', {
                        date: cell.day,
                      })}
                      accessibilityRole="button"
                      accessibilityState={{
                        disabled: isDisabled,
                        selected: isSelected,
                      }}
                      className="size-10 items-center justify-center rounded-full border"
                      disabled={isDisabled}
                      onPress={() => {
                        if (!cell.dateKey) return;
                        onSelectDate(cell.dateKey);
                      }}
                      style={{
                        backgroundColor: isSelected
                          ? isDark
                            ? Colors.primaryBright
                            : Colors.primary
                          : isDark
                            ? Colors.darkBgCard
                            : Colors.white,
                        borderColor: isSelected
                          ? isDark
                            ? Colors.primaryBright
                            : Colors.primary
                          : cell.isToday
                            ? isDark
                              ? Colors.secondaryBright
                              : Colors.secondary
                            : isDark
                              ? Colors.darkBorder
                              : Colors.border,
                        opacity: isDisabled ? 0.35 : 1,
                      }}
                      testID={`date-${cell.dateKey}`}
                    >
                      <Text
                        className="text-[15px] font-semibold"
                        style={{
                          color: isSelected
                            ? isDark
                              ? Colors.secondaryDeeper
                              : Colors.white
                            : isDark
                              ? Colors.textPrimaryDark
                              : Colors.text,
                        }}
                      >
                        {cell.day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <Clock3 color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('pickTime')}
            </Text>
          </View>
          <Pressable
            accessibilityHint={t('openTimePickerHint')}
            accessibilityLabel={t('openTimePickerLabel', {
              date: selectedDateLabel,
              time: selectedTime ?? t('noTimeSelected'),
            })}
            accessibilityRole="button"
            accessibilityState={{ disabled: isSubmitting }}
            className="flex-row items-center justify-between rounded-2xl border border-border bg-white px-4 py-3.5 dark:border-dark-border dark:bg-dark-bg-card"
            disabled={isSubmitting}
            onPress={() => setIsTimePickerVisible(true)}
            testID="open-time-picker"
          >
            <View>
              <Text className="mb-0.5 text-xs font-semibold text-text-secondary dark:text-text-secondary-dark">
                {selectedDateLabel}
              </Text>
              <Text className="text-base font-bold text-text dark:text-text-primary-dark">
                {selectedTime ?? t('timePickerPlaceholder')}
              </Text>
            </View>
            <Sparkles color={accentColor} size={18} />
          </Pressable>
          <Text className="mt-2 text-xs text-text-muted dark:text-text-muted-dark">
            {t('timePickerHint', { start: '08:00', end: '23:00' })}
          </Text>

          <Modal
            animationType="slide"
            transparent
            visible={isTimePickerVisible}
            onRequestClose={() => setIsTimePickerVisible(false)}
          >
            <View className="flex-1">
              <Pressable
                accessibilityRole="button"
                accessibilityHint={t('timePickerDismissHint')}
                accessibilityLabel={tCommon('close')}
                className="flex-1"
                onPress={() => setIsTimePickerVisible(false)}
              />
              <View className="max-h-[78%] rounded-t-3xl border-t border-border bg-card pb-8 dark:border-dark-border dark:bg-dark-bg-card">
                <View className="flex-row items-center justify-between border-b border-border/60 px-5 py-3 dark:border-dark-border/60">
                  <Text className="text-[17px] font-bold text-text dark:text-text-primary-dark">
                    {t('pickTime')}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    className="rounded-full px-2 py-1"
                    onPress={() => setIsTimePickerVisible(false)}
                    testID="close-time-picker"
                  >
                    <Text className="text-sm font-bold text-primary dark:text-primary-bright">
                      {tCommon('done')}
                    </Text>
                  </Pressable>
                </View>
                <View className="px-5 pb-2 pt-3">
                  <Text className="text-xs text-text-secondary dark:text-text-secondary-dark">
                    {selectedDateLabel}
                  </Text>
                </View>

                {availableTimeSlots.length === 0 ? (
                  <View className="px-5 pb-2 pt-2">
                    <Text className="text-sm text-text-secondary dark:text-text-secondary-dark">
                      {t('noBookableTimes')}
                    </Text>
                  </View>
                ) : null}

                <ScrollView
                  contentContainerClassName="flex-row flex-wrap gap-y-2 px-5 pb-2"
                  contentInsetAdjustmentBehavior="automatic"
                  showsVerticalScrollIndicator={false}
                >
                  {availableTimeSlots.map((time) => {
                    const active = selectedTime === time;
                    return (
                      <View key={time} style={{ width: '33.333%' }}>
                        <Pressable
                          accessibilityHint={t('selectTimeHint')}
                          accessibilityLabel={time}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          className="mx-1.5 items-center rounded-xl border py-3"
                          onPress={() => {
                            onSelectTime(time);
                            setIsTimePickerVisible(false);
                          }}
                          style={{
                            backgroundColor: active
                              ? isDark
                                ? Colors.primaryBright
                                : Colors.primary
                              : isDark
                                ? Colors.darkBg
                                : Colors.surface,
                            borderColor: active
                              ? isDark
                                ? Colors.primaryBright
                                : Colors.primary
                              : isDark
                                ? Colors.darkBorder
                                : Colors.border,
                          }}
                          testID={`time-${time}`}
                        >
                          <Text
                            className="text-[15px] font-bold"
                            style={{
                              color: active
                                ? isDark
                                  ? Colors.secondaryDeeper
                                  : Colors.white
                                : isDark
                                  ? Colors.textPrimaryDark
                                  : Colors.text,
                            }}
                          >
                            {time}
                          </Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </View>

        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <Users color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('numGuests')}
            </Text>
          </View>
          <View className="flex-row items-center justify-center rounded-[20px] border border-border bg-white py-5 dark:border-dark-border dark:bg-dark-bg-card">
            <Pressable
              accessibilityHint={t('paxDecreaseHint')}
              accessibilityRole="button"
              accessibilityLabel={t('paxDecrease')}
              accessibilityState={{ disabled: minusDisabled }}
              className="size-12 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
              disabled={minusDisabled}
              onPress={() => onPaxChange(pax - 1)}
              style={minusDisabled ? { opacity: 0.4 } : undefined}
              testID="pax-minus"
            >
              <Minus
                color={getGuestCountIconColor({
                  disabled: minusDisabled,
                  isDark,
                })}
                size={20}
              />
            </Pressable>
            <View className="mx-6 items-center">
              <Text className="text-4xl font-extrabold text-text dark:text-text-primary-dark">
                {pax}
              </Text>
              <Text className="mt-0.5 text-[13px] font-medium text-text-secondary dark:text-text-secondary-dark">
                {t('guestsUnit')}
              </Text>
            </View>
            <Pressable
              accessibilityHint={t('paxIncreaseHint')}
              accessibilityRole="button"
              accessibilityLabel={t('paxIncrease')}
              accessibilityState={{ disabled: plusDisabled }}
              className="size-12 items-center justify-center rounded-full bg-sand dark:bg-dark-bg"
              disabled={plusDisabled}
              onPress={() => onPaxChange(pax + 1)}
              style={plusDisabled ? { opacity: 0.4 } : undefined}
              testID="pax-plus"
            >
              <Plus
                color={getGuestCountIconColor({
                  disabled: plusDisabled,
                  isDark,
                })}
                size={20}
              />
            </Pressable>
          </View>
        </View>

        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <Mail color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('contactEmailTitle')}
            </Text>
          </View>
          <View
            className="rounded-2xl border bg-white px-4 py-3 dark:bg-dark-bg-card"
            style={{
              borderColor: emailErrorMessage
                ? isDark
                  ? Colors.errorDark
                  : Colors.danger
                : isDark
                  ? Colors.darkBorder
                  : Colors.border,
            }}
          >
            <TextInput
              accessibilityHint={t('contactEmailHint')}
              accessibilityLabel={t('contactEmailTitle')}
              autoCapitalize="none"
              autoCorrect={false}
              className="text-[15px] font-semibold text-text dark:text-text-primary-dark"
              editable={!isSubmitting}
              inputMode="email"
              keyboardType="email-address"
              onChangeText={onContactEmailChange}
              placeholder={t('contactEmailPlaceholder')}
              placeholderTextColor={
                isDark ? Colors.textMutedDark : Colors.textLight
              }
              testID="booking-contact-email"
              value={contactEmail}
            />
          </View>
          {emailErrorMessage ? (
            <Text className="mt-2 text-xs font-medium text-danger dark:text-error-dark">
              {emailErrorMessage}
            </Text>
          ) : null}
        </View>

        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <Sparkles color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('specialRequestTitle')}
            </Text>
          </View>
          <View className="rounded-2xl border border-border bg-white px-4 py-3 dark:border-dark-border dark:bg-dark-bg-card">
            <TextInput
              accessibilityHint={t('specialRequestHint')}
              accessibilityLabel={t('specialRequestTitle')}
              className="min-h-23 text-[15px] font-medium text-text dark:text-text-primary-dark"
              editable={!isSubmitting}
              multiline
              numberOfLines={4}
              onChangeText={onSpecialRequestChange}
              placeholder={t('specialRequestPlaceholder')}
              placeholderTextColor={
                isDark ? Colors.textMutedDark : Colors.textLight
              }
              testID="booking-special-request"
              textAlignVertical="top"
              value={specialRequest}
            />
          </View>
        </View>

        {footerExtras ? <View className="mb-1">{footerExtras}</View> : null}

        <View className="h-30" />
      </Animated.View>
    </ScrollView>
  );
}

export function BookingFooterBar({
  canConfirm,
  insetsBottom,
  isSubmitting,
  t,
  onConfirm,
}: {
  canConfirm: boolean;
  insetsBottom: number;
  isSubmitting: boolean;
  t: TFunction;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <View
      className="absolute bottom-0 left-0 right-0 border-t border-border bg-white px-5 pt-3.5 dark:border-dark-border dark:bg-dark-bg-card"
      style={{ paddingBottom: Math.max(insetsBottom, 16) }}
    >
      <Button
        className="rounded-2xl"
        disabled={!canConfirm || isSubmitting}
        onPress={onConfirm}
        size="lg"
        testID="confirm-booking"
      >
        {isSubmitting ? t('reserving') : t('confirmReservation')}
      </Button>
    </View>
  );
}

function getGuestCountIconColor({
  disabled,
  isDark,
}: {
  disabled: boolean;
  isDark: boolean;
}): string {
  if (disabled) {
    return isDark ? Colors.textMutedDark : Colors.textLight;
  }

  return isDark ? Colors.textPrimaryDark : Colors.text;
}

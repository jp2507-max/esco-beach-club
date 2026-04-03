import type { TFunction } from 'i18next';
import {
  CalendarDays,
  Minus,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react-native';
import React from 'react';

import { accentOnDarkBackground, Colors } from '@/constants/colors';
import { Button } from '@/src/components/ui';
import type {
  BookingDateOption,
  ResolvedOccasion,
  ResolvedTimeSlot,
} from '@/src/lib/booking/booking-screen';
import {
  getDayTranslationKey,
  getMonthTranslationKey,
  getSlotColors,
} from '@/src/lib/booking/booking-screen';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import { Animated } from '@/src/tw/animated';

type BookingFormContentProps = {
  canChangeGuestCount: (nextPax: number) => boolean;
  contentStyle: object;
  dates: BookingDateOption[];
  isDark: boolean;
  isSubmitting: boolean;
  occasion: string | null;
  pax: number;
  resolvedOccasions: ResolvedOccasion[];
  resolvedTimeSlots: ResolvedTimeSlot[];
  selectedDate: number;
  selectedTime: string | null;
  t: TFunction;
  onOccasionSelect: (value: string) => void;
  onPaxChange: (nextPax: number) => void;
  onSelectDate: (index: number) => void;
  onSelectTime: (time: string) => void;
};

export function BookingFormContent({
  canChangeGuestCount,
  contentStyle,
  dates,
  isDark,
  isSubmitting,
  occasion,
  pax,
  resolvedOccasions,
  resolvedTimeSlots,
  selectedDate,
  selectedTime,
  t,
  onOccasionSelect,
  onPaxChange,
  onSelectDate,
  onSelectTime,
}: BookingFormContentProps): React.JSX.Element {
  const accentColor = accentOnDarkBackground(Colors.primary, isDark);
  const minusDisabled = !canChangeGuestCount(pax - 1) || isSubmitting;
  const plusDisabled = !canChangeGuestCount(pax + 1) || isSubmitting;

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="px-5 pt-5"
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
          <ScrollView
            contentContainerClassName="gap-2.5 pr-5"
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {dates.map((date, index) => {
              const active = selectedDate === index;

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t(getDayTranslationKey(date.dayNameKey))}, ${t(getMonthTranslationKey(date.monthKey))} ${date.day}`}
                  accessibilityState={{
                    disabled: isSubmitting,
                    selected: active,
                  }}
                  key={`${date.day}-${date.monthKey}`}
                  className={
                    active
                      ? 'h-20 w-17 items-center justify-center rounded-2xl bg-primary'
                      : 'h-20 w-17 items-center justify-center rounded-2xl border-[1.5px] border-border bg-white dark:border-dark-border dark:bg-dark-bg-card'
                  }
                  disabled={isSubmitting}
                  onPress={() => onSelectDate(index)}
                  style={isSubmitting ? { opacity: 0.7 } : undefined}
                  testID={`date-${index}`}
                >
                  <Text
                    className={
                      active
                        ? 'text-xs font-semibold text-white/80'
                        : 'text-xs font-semibold text-text-secondary dark:text-text-secondary-dark'
                    }
                  >
                    {t(getDayTranslationKey(date.labelKey))}
                  </Text>
                  <Text
                    className={
                      active
                        ? 'mt-1 text-[22px] font-extrabold text-white'
                        : 'mt-1 text-[22px] font-extrabold text-text dark:text-text-primary-dark'
                    }
                  >
                    {date.day}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View className="mb-7">
          <View className="mb-3.5 flex-row items-center">
            <Sparkles color={accentColor} size={18} />
            <Text className="ml-2 text-[17px] font-bold text-text dark:text-text-primary-dark">
              {t('pickTime')}
            </Text>
          </View>
          <View className="flex-row flex-wrap">
            {resolvedTimeSlots.map((slot) => {
              const active = selectedTime === slot.time;
              const slotColors = getSlotColors({
                isDark,
                available: slot.available,
                active,
              });

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${slot.time}, ${slot.available ? t('available') : t('full')}`}
                  accessibilityState={{
                    disabled: !slot.available || isSubmitting,
                    selected: active,
                  }}
                  key={slot.time}
                  className="mb-2.5 items-center rounded-[14px] py-3.5"
                  disabled={!slot.available || isSubmitting}
                  onPress={() => onSelectTime(slot.time)}
                  style={{
                    backgroundColor: slotColors.backgroundColor,
                    borderColor: slotColors.borderColor,
                    borderWidth: 1.5,
                    marginRight: 10,
                    opacity: !slot.available ? 0.6 : isSubmitting ? 0.7 : 1,
                    width: '23%',
                  }}
                  testID={`time-${slot.time}`}
                >
                  <Text
                    className="text-[15px] font-bold"
                    style={{ color: slotColors.color }}
                  >
                    {slot.time}
                  </Text>
                  {!slot.available ? (
                    <Text className="mt-0.5 text-[9px] font-bold tracking-[0.5px] text-primary">
                      {t('full')}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
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
              accessibilityRole="button"
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
              accessibilityRole="button"
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
          <Text className="text-[17px] font-bold text-text dark:text-text-primary-dark">
            {t('occasionTitle')}
          </Text>
          <View className="mt-2.5 flex-row flex-wrap">
            {resolvedOccasions.map((option) => {
              const active = occasion === option.value;

              return (
                <Pressable
                  accessibilityRole="button"
                  key={option.value}
                  className="mb-2.5 mr-2.5 rounded-full px-4.5 py-3"
                  disabled={isSubmitting}
                  onPress={() => onOccasionSelect(option.value)}
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
                          : Colors.white
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

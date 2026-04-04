import type { TFunction } from 'i18next';

import { Colors } from '@/constants/colors';

export const FALLBACK_TIME_SLOTS = [
  { time: '18:00', available: true },
  { time: '18:30', available: true },
  { time: '19:00', available: true },
  { time: '19:30', available: false },
  { time: '20:00', available: true },
  { time: '20:30', available: false },
  { time: '21:00', available: true },
  { time: '21:30', available: true },
] as const;

export const FALLBACK_OCCASIONS = [
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

export type BookingDayKey = (typeof DAY_KEYS)[number];
export type BookingMonthKey = (typeof MONTH_KEYS)[number];
export type BookingOccasionKey = (typeof FALLBACK_OCCASIONS)[number];
export type BookingDayLabelKey = 'today' | BookingDayKey;
export type BookingOccasionTranslationKey = `occasions.${BookingOccasionKey}`;
export type BookingDayTranslationKey = `days.${BookingDayLabelKey}`;
export type BookingMonthTranslationKey = `months.${BookingMonthKey}`;
type BookingOccasionTranslationKeyFromApi = `occasions.${string}`;

export type SlotColors = {
  backgroundColor: string;
  borderColor: string;
  color: string;
};

export type BookingDateOption = {
  dateKey: string;
  labelKey: BookingDayLabelKey;
  day: string;
  date: Date;
  monthKey: BookingMonthKey;
  dayNameKey: BookingDayKey;
};

export type ResolvedOccasion = {
  label: string;
  value: string;
};

export type ResolvedTimeSlot = {
  available: boolean;
  time: string;
};

export function getSlotColors(params: {
  isDark: boolean;
  available: boolean;
  active: boolean;
}): SlotColors {
  const { active, available, isDark } = params;

  if (!available) {
    return {
      backgroundColor: isDark ? Colors.darkBgElevated : Colors.sand,
      borderColor: isDark ? Colors.darkBorder : Colors.sandDark,
      color: isDark ? Colors.textMutedDark : Colors.textLight,
    };
  }

  if (active) {
    return {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
      color: Colors.white,
    };
  }

  return {
    backgroundColor: isDark ? Colors.darkBgCard : Colors.surface,
    borderColor: isDark ? Colors.darkBorder : Colors.border,
    color: isDark ? Colors.textPrimaryDark : Colors.text,
  };
}

export function getNext7Days(baseDate: Date): BookingDateOption[] {
  const days: BookingDateOption[] = [];

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);

    days.push({
      dateKey: toLocalDateString(date),
      date,
      day: String(date.getDate()),
      dayNameKey: DAY_KEYS[date.getDay()],
      labelKey: index === 0 ? 'today' : DAY_KEYS[date.getDay()],
      monthKey: MONTH_KEYS[date.getMonth()],
    });
  }

  return days;
}

export function getOccasionTranslationKey(
  value: BookingOccasionKey
): BookingOccasionTranslationKey {
  return `occasions.${value}`;
}

export function isBookingOccasionTranslationKeyFromApi(
  key: unknown
): key is BookingOccasionTranslationKeyFromApi {
  return typeof key === 'string' && key.startsWith('occasions.');
}

export function getDayTranslationKey(
  value: BookingDayLabelKey
): BookingDayTranslationKey {
  return `days.${value}`;
}

export function getMonthTranslationKey(
  value: BookingMonthKey
): BookingMonthTranslationKey {
  return `months.${value}`;
}

export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getBookingConfirmationDate(params: {
  dates: BookingDateOption[];
  selectedDateKey: string;
  t: TFunction;
}): string {
  const { dates, selectedDateKey, t } = params;
  const currentDate =
    dates.find((option) => option.dateKey === selectedDateKey) ??
    getBookingDateOptionFromKey(selectedDateKey);

  if (!currentDate) {
    return '';
  }

  return (
    t(getDayTranslationKey(currentDate.dayNameKey)) +
    ', ' +
    t(getMonthTranslationKey(currentDate.monthKey)) +
    ' ' +
    currentDate.day
  );
}

function getBookingDateOptionFromKey(
  dateKey: string
): BookingDateOption | null {
  const parsedDate = new Date(`${dateKey}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return null;

  return {
    dateKey,
    date: parsedDate,
    day: String(parsedDate.getDate()),
    dayNameKey: DAY_KEYS[parsedDate.getDay()],
    labelKey: DAY_KEYS[parsedDate.getDay()],
    monthKey: MONTH_KEYS[parsedDate.getMonth()],
  };
}

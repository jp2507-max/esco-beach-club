import type { TFunction } from 'i18next';

import { Colors } from '@/constants/colors';

export const BOOKING_WINDOW_DAYS = 30;
export const BOOKING_SLOT_START_HOUR = 8;
export const BOOKING_SLOT_END_HOUR = 23;
export const BOOKING_SLOT_INTERVAL_MINUTES = 15;
export const BOOKING_SAME_DAY_BUFFER_MINUTES = 30;

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
export type BookingDayLabelKey = 'today' | BookingDayKey;
export type BookingDayTranslationKey = `days.${BookingDayLabelKey}`;
export type BookingMonthTranslationKey = `months.${BookingMonthKey}`;

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

export type BookingMonthOption = {
  key: string;
  monthIndex: number;
  monthKey: BookingMonthKey;
  year: number;
};

export type BookingCalendarCell = {
  dateKey: string | null;
  day: number | null;
  isSelectable: boolean;
  isToday: boolean;
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

export function getNextBookingDays(
  baseDate: Date,
  totalDays: number = BOOKING_WINDOW_DAYS
): BookingDateOption[] {
  const days: BookingDateOption[] = [];

  for (let index = 0; index < totalDays; index += 1) {
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

export function getNext7Days(baseDate: Date): BookingDateOption[] {
  return getNextBookingDays(baseDate, 7);
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

export function getBookingMonthOptions(
  dates: readonly BookingDateOption[]
): BookingMonthOption[] {
  const monthMap = new Map<string, BookingMonthOption>();

  for (const date of dates) {
    const year = date.date.getFullYear();
    const monthIndex = date.date.getMonth();
    const key = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

    if (monthMap.has(key)) continue;

    monthMap.set(key, {
      key,
      monthIndex,
      monthKey: MONTH_KEYS[monthIndex],
      year,
    });
  }

  return Array.from(monthMap.values());
}

export function buildBookingCalendarCells(params: {
  dateOptions: readonly BookingDateOption[];
  monthOption: BookingMonthOption;
  now: Date;
}): BookingCalendarCell[] {
  const { dateOptions, monthOption, now } = params;
  const dateMap = new Map(dateOptions.map((date) => [date.dateKey, date]));
  const firstDayOfMonth = new Date(monthOption.year, monthOption.monthIndex, 1);
  const daysInMonth = new Date(
    monthOption.year,
    monthOption.monthIndex + 1,
    0
  ).getDate();
  const leadingEmptyCells = firstDayOfMonth.getDay();
  const todayKey = toLocalDateString(now);
  const cells: BookingCalendarCell[] = [];

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    cells.push({
      dateKey: null,
      day: null,
      isSelectable: false,
      isToday: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(monthOption.year, monthOption.monthIndex, day);
    const dateKey = toLocalDateString(date);
    const option = dateMap.get(dateKey);

    cells.push({
      dateKey,
      day,
      isSelectable: option !== undefined,
      isToday: dateKey === todayKey,
    });
  }

  return cells;
}

export function getBookableTimeSlots(params: {
  now: Date;
  selectedDateKey: string;
  bufferMinutes?: number;
  intervalMinutes?: number;
  startHour?: number;
  endHour?: number;
}): string[] {
  const {
    now,
    selectedDateKey,
    bufferMinutes = BOOKING_SAME_DAY_BUFFER_MINUTES,
    endHour = BOOKING_SLOT_END_HOUR,
    intervalMinutes = BOOKING_SLOT_INTERVAL_MINUTES,
    startHour = BOOKING_SLOT_START_HOUR,
  } = params;

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) return [];

  const startMinutes = startHour * 60;
  const endMinutes = endHour * 60;
  let minimumMinutes = startMinutes;
  const safeBufferMinutes = Number.isFinite(bufferMinutes) ? bufferMinutes : 0;

  if (selectedDateKey === toLocalDateString(now)) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    minimumMinutes = Math.max(
      startMinutes,
      roundMinutesUpToInterval(nowMinutes + safeBufferMinutes, intervalMinutes)
    );
  }

  if (minimumMinutes > endMinutes) return [];

  const slots: string[] = [];
  for (
    let totalMinutes = minimumMinutes;
    totalMinutes <= endMinutes;
    totalMinutes += intervalMinutes
  ) {
    slots.push(formatMinutesAsTime(totalMinutes));
  }

  return slots;
}

function roundMinutesUpToInterval(
  totalMinutes: number,
  interval: number
): number {
  if (interval <= 1) return totalMinutes;
  return Math.ceil(totalMinutes / interval) * interval;
}

function formatMinutesAsTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
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

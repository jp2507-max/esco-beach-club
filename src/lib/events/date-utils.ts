import type { Event } from '@/lib/types';

export type EventWeekDayOption = {
  aliases: string[];
  dateLabel: string;
  fullLabel: string;
  isToday: boolean;
  key: string;
  shortLabel: string;
};

const MONTH_TOKEN_TO_INDEX: Record<string, number> = {
  apr: 3,
  aug: 7,
  dec: 11,
  feb: 1,
  jan: 0,
  jul: 6,
  jun: 5,
  mar: 2,
  may: 4,
  nov: 10,
  oct: 9,
  sep: 8,
};

export function normalizeDayToken(value: string): string {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function startOfDay(date: Date): Date {
  const localDay = new Date(date);
  localDay.setHours(0, 0, 0, 0);
  return localDay;
}

export function getDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getStartOfWeek(referenceDate: Date): Date {
  const day = startOfDay(referenceDate);
  const currentDay = day.getDay();
  const offsetFromMonday = (currentDay + 6) % 7;
  day.setDate(day.getDate() - offsetFromMonday);
  return day;
}

export function createValidLocalDate(
  year: number,
  monthIndex: number,
  day: number
): Date | null {
  const parsed = new Date(year, monthIndex, day);
  const isValid =
    !Number.isNaN(parsed.getTime()) &&
    parsed.getFullYear() === year &&
    parsed.getMonth() === monthIndex &&
    parsed.getDate() === day;

  return isValid ? parsed : null;
}

export function parseEventDate(dateText: string, now: Date): Date | null {
  if (!dateText.trim()) return null;

  const isoDateOnlyMatch = dateText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDateOnlyMatch) {
    const year = Number.parseInt(isoDateOnlyMatch[1], 10);
    const month = Number.parseInt(isoDateOnlyMatch[2], 10);
    const day = Number.parseInt(isoDateOnlyMatch[3], 10);
    const parsed = createValidLocalDate(year, month - 1, day);
    return parsed ? startOfDay(parsed) : null;
  }

  const shortWeekdayMonthMatch = dateText.match(
    /^[A-Za-z]{3,9},\s*([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,\s*(\d{4}))?$/
  );
  if (shortWeekdayMonthMatch) {
    const monthToken = shortWeekdayMonthMatch[1].slice(0, 3).toLowerCase();
    const monthIndex = MONTH_TOKEN_TO_INDEX[monthToken];
    const day = Number.parseInt(shortWeekdayMonthMatch[2], 10);

    if (monthIndex !== undefined) {
      const explicitYear = shortWeekdayMonthMatch[3];
      if (explicitYear) {
        const parsed = createValidLocalDate(
          Number.parseInt(explicitYear, 10),
          monthIndex,
          day
        );
        if (parsed) {
          return startOfDay(parsed);
        }
      } else {
        const weekStart = getStartOfWeek(now);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const currentYear = now.getFullYear();
        for (const candidateYear of [
          currentYear,
          currentYear - 1,
          currentYear + 1,
        ]) {
          const candidateRaw = createValidLocalDate(
            candidateYear,
            monthIndex,
            day
          );
          if (!candidateRaw) continue;

          const candidate = startOfDay(candidateRaw);
          if (candidate >= weekStart && candidate <= weekEnd) {
            return candidate;
          }
        }

        const fallback = createValidLocalDate(currentYear, monthIndex, day);
        if (fallback) {
          return startOfDay(fallback);
        }
      }
    }
  }

  if (!/\b\d{4}\b/.test(dateText)) {
    return null;
  }

  const parsed = new Date(dateText);
  if (Number.isNaN(parsed.getTime())) return null;

  return startOfDay(parsed);
}

export function buildCurrentWeek(
  locale: string,
  referenceDate: Date
): EventWeekDayOption[] {
  const start = getStartOfWeek(referenceDate);
  const todayKey = getDayKey(startOfDay(referenceDate));
  const shortFormatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  const fullFormatter = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    weekday: 'long',
  });
  const englishShortFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  });
  const englishFullFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    const key = getDayKey(date);
    const localizedShort = shortFormatter.format(date);
    const englishShort = englishShortFormatter.format(date);
    const englishFull = englishFullFormatter.format(date);

    return {
      aliases: [localizedShort, englishShort, englishFull].map(
        normalizeDayToken
      ),
      dateLabel: String(date.getDate()),
      fullLabel: fullFormatter.format(date),
      isToday: key === todayKey,
      key,
      shortLabel: localizedShort,
    };
  });
}

export function resolveEventDayKey(
  event: Event,
  weekDays: readonly EventWeekDayOption[],
  now: Date
): string | null {
  const parsedDate = parseEventDate(event.date, now);
  if (parsedDate) {
    const parsedKey = getDayKey(parsedDate);
    if (weekDays.some((day) => day.key === parsedKey)) {
      return parsedKey;
    }
  }

  if (!event.day_label) return null;

  const dayToken = normalizeDayToken(event.day_label);
  if (!dayToken) return null;

  const matchedWeekDay = weekDays.find((day) =>
    day.aliases.some(
      (alias) => dayToken.startsWith(alias) || alias.startsWith(dayToken)
    )
  );

  return matchedWeekDay?.key ?? null;
}

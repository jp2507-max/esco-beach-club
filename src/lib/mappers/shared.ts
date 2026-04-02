import type { OnboardingPermissionStatus } from '@/lib/types';
import { onboardingPermissionStatuses } from '@/lib/types';

export type InstantRecord = {
  id: string;
  [key: string]: unknown;
};

export function toNumber(value: unknown, fallback: number = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function toStringOr(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function toNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function toBoolean(value: unknown, fallback: boolean = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function toIsoString(value: unknown): string {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }
  if (typeof value !== 'string') return '';

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

export function toNullableIsoString(value: unknown): string | null {
  const isoValue = toIsoString(value);
  return isoValue || null;
}

export function toForeignKeyId(
  record: InstantRecord,
  key: string
): string | null {
  const nested = record[key];
  if (
    typeof nested === 'object' &&
    nested !== null &&
    'id' in nested &&
    typeof (nested as { id: unknown }).id === 'string'
  ) {
    return (nested as { id: string }).id;
  }
  return null;
}

export function toOnboardingPermissionStatus(
  value: unknown
): OnboardingPermissionStatus {
  const normalized =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (normalized === onboardingPermissionStatuses.granted) {
    return onboardingPermissionStatuses.granted;
  }

  if (normalized === onboardingPermissionStatuses.denied) {
    return onboardingPermissionStatuses.denied;
  }

  return onboardingPermissionStatuses.undetermined;
}

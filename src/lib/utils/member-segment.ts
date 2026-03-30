import { type MemberSegment, memberSegments } from '@/lib/types';
import { readSingleSearchParam } from '@/src/lib/utils/search-params';

export function normalizeMemberSegment(
  value: string | null | undefined
): MemberSegment | undefined {
  const normalized = value?.trim().toUpperCase();

  if (normalized === memberSegments.local) {
    return memberSegments.local;
  }

  if (normalized === memberSegments.foreigner) {
    return memberSegments.foreigner;
  }

  return undefined;
}

export function parseOnboardingMemberSegmentSearchParam(
  value: string | string[] | undefined
): MemberSegment | undefined {
  return normalizeMemberSegment(readSingleSearchParam(value));
}

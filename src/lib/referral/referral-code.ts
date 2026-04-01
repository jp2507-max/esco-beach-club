/** Normalized invite codes: ESCO- + alphanumeric segment (matches generated codes). */
const REFERRAL_CODE_PATTERN = /^ESCO-[A-Z0-9]{4,16}$/;

export function normalizeReferralCode(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (!REFERRAL_CODE_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function extractInviteCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);

    if (parsed.host.toLowerCase() === 'invite') {
      const hostSegment = parsed.pathname.split('/').filter(Boolean)[0] ?? '';
      return normalizeReferralCode(hostSegment);
    }

    const path = parsed.pathname.replace(/^\/+|\/+$/g, '');
    const segments = path.split('/').filter(Boolean);
    const inviteIdx = segments.indexOf('invite');
    if (inviteIdx >= 0 && segments[inviteIdx + 1]) {
      return normalizeReferralCode(segments[inviteIdx + 1] ?? '');
    }
    return null;
  } catch {
    return null;
  }
}

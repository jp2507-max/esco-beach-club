import {
  extractInviteCodeFromUrl,
  normalizeReferralCode,
} from '@/src/lib/referral/referral-code';

type NativeIntentRedirectEvent = {
  initial: boolean;
  path: string;
};

const FALLBACK_BASE_URL = 'esco-beach-club://app.home';

function resolveInviteRoute(path: string): string | null {
  const decodedPath = decodeURIComponent(path).trim();
  if (!decodedPath) return null;

  const fromRawUrl = extractInviteCodeFromUrl(decodedPath);
  if (fromRawUrl) return `/invite/${fromRawUrl}`;

  const parsedUrl = new URL(decodedPath, FALLBACK_BASE_URL);
  const fromParsedUrl = extractInviteCodeFromUrl(parsedUrl.toString());
  if (fromParsedUrl) return `/invite/${fromParsedUrl}`;

  const pathname = parsedUrl.pathname.replace(/^\/+/g, '');
  const [firstSegment, secondSegment] = pathname.split('/');

  if (firstSegment?.toLowerCase() !== 'invite') return null;

  const normalizedCode = normalizeReferralCode(secondSegment ?? '');
  if (!normalizedCode) return null;

  return `/invite/${normalizedCode}`;
}

export function redirectSystemPath({
  path,
}: NativeIntentRedirectEvent): string {
  try {
    const inviteRoute = resolveInviteRoute(path);
    if (inviteRoute) return inviteRoute;

    // Normalizing the incoming URL to an internal router path (pathname + search)
    // to ensure it's a valid relative route for Expo Router.
    const url = new URL(path, FALLBACK_BASE_URL);
    return url.pathname + url.search;
  } catch {
    return '/';
  }
}

import {
  buildClientApiUrl,
  type ClientApiResult,
  readApiErrorDetails,
} from '@/src/lib/api/client-api';

export type ClaimReferralResult = ClientApiResult<unknown>;

export async function postClaimReferral(params: {
  refreshToken: string;
  referralCode: string;
}): Promise<ClaimReferralResult> {
  const url = buildClientApiUrl('/api/referrals/claim', {
    explicitBaseUrl: process.env.EXPO_PUBLIC_REFERRAL_API_BASE_URL,
  });
  if (!url) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.refreshToken}`,
      },
      body: JSON.stringify({
        referralCode: params.referralCode,
      }),
      signal: controller.signal,
    });

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (response.ok) {
      return { ok: true, status: response.status, body };
    }

    return {
      ok: false,
      reason: 'http_error',
      status: response.status,
      ...readApiErrorDetails(body, response.status),
    };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, reason: 'network', message: 'request timed out' };
    }
    return {
      ok: false,
      reason: 'network',
      message: e instanceof Error ? e.message : 'fetch failed',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

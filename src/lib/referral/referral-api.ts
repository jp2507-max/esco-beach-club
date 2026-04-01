import Constants from 'expo-constants';

function getReferralApiBaseUrl(): string | null {
  const fromEnv = process.env.EXPO_PUBLIC_REFERRAL_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');

  const hostUri = Constants.expoConfig?.hostUri;
  if (__DEV__ && hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:8081`;
    }
  }

  return null;
}

export type ClaimReferralResult =
  | { ok: true; status: number; body: unknown }
  | {
      ok: false;
      reason: 'no_endpoint' | 'network';
      status?: number;
      message?: string;
    };

export async function postClaimReferral(params: {
  refreshToken: string;
  referralCode: string;
}): Promise<ClaimReferralResult> {
  const base = getReferralApiBaseUrl();
  if (!base) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const url = `${base}/api/referrals/claim`;

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
      reason: 'network',
      status: response.status,
      message: `HTTP ${response.status}`,
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

export type CompleteReferralResult =
  | { ok: true; status: number; body: unknown }
  | { ok: false; reason: 'no_endpoint' | 'network'; message?: string };

export async function postCompleteReferral(params: {
  refreshToken: string;
  referralId: string;
}): Promise<CompleteReferralResult> {
  const base = getReferralApiBaseUrl();
  if (!base) {
    return { ok: false, reason: 'no_endpoint' };
  }

  const url = `${base}/api/referrals/complete`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${params.refreshToken}`,
      },
      body: JSON.stringify({ referralId: params.referralId }),
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
      reason: 'network',
      message: `HTTP ${response.status}`,
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

import {
  parseRewardServiceResponse,
  type RewardServiceApiResponse,
} from '@/lib/api/shared';
import {
  buildClientApiUrl,
  type ClientApiResult,
  readApiErrorDetails,
} from '@/src/lib/api/client-api';

export type ClaimRewardBillResult = ClientApiResult<RewardServiceApiResponse>;

export async function postClaimRewardBill(params: {
  qrData: string;
  refreshToken: string;
}): Promise<ClaimRewardBillResult> {
  const url = buildClientApiUrl('/api/rewards/claim', {
    explicitBaseUrl: process.env.EXPO_PUBLIC_REWARD_API_BASE_URL,
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
        qrData: params.qrData,
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
      const parsed = parseRewardServiceResponse(body);
      if (!parsed) {
        return {
          ok: false,
          reason: 'parse_error',
          status: response.status,
          code: 'invalidRewardServiceResponse',
          message: 'invalidRewardServiceResponse',
        };
      }

      return { ok: true, status: response.status, body: parsed };
    }

    return {
      ok: false,
      reason: 'http_error',
      status: response.status,
      ...readApiErrorDetails(body, response.status),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, reason: 'network', message: 'request timed out' };
    }

    return {
      ok: false,
      reason: 'network',
      message: error instanceof Error ? error.message : 'fetch failed',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const addMonitoringBreadcrumbMock = mock(() => {});

mock.module('@/src/lib/monitoring', () => ({
  addMonitoringBreadcrumb: addMonitoringBreadcrumbMock,
  captureHandledError() {},
}));

const { postRestoreAccountDeletion, postScheduleAccountDeletion } =
  await import('@/src/lib/account-deletion/account-deletion-api');

describe('account deletion api client', () => {
  const originalFetch = global.fetch;
  const originalClearTimeout = global.clearTimeout;
  const originalSetTimeout = global.setTimeout;
  const originalAccountBaseUrl = process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL;

  beforeEach(() => {
    addMonitoringBreadcrumbMock.mockReset();
    process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL = 'https://example.com';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.clearTimeout = originalClearTimeout;
    global.setTimeout = originalSetTimeout;
    process.env.EXPO_PUBLIC_ACCOUNT_API_BASE_URL = originalAccountBaseUrl;
  });

  test('uses a 30 second timeout budget for scheduling deletion', async () => {
    const observedTimeouts: number[] = [];

    global.setTimeout = ((handler: TimerHandler, timeout?: number) => {
      observedTimeouts.push(Number(timeout));
      if (typeof handler === 'function') handler();
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => undefined) as typeof clearTimeout;
    global.fetch = mock(async () => new Response('{}', { status: 200 }));

    await postScheduleAccountDeletion({
      authProvider: 'google',
      refreshToken: 'refresh-token',
    });

    expect(observedTimeouts).toContain(30000);
  });

  test('keeps restore requests on the default timeout budget', async () => {
    const observedTimeouts: number[] = [];

    global.setTimeout = ((handler: TimerHandler, timeout?: number) => {
      observedTimeouts.push(Number(timeout));
      if (typeof handler === 'function') handler();
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => undefined) as typeof clearTimeout;
    global.fetch = mock(async () => new Response('{}', { status: 200 }));

    await postRestoreAccountDeletion({
      refreshToken: 'refresh-token',
    });

    expect(observedTimeouts).toContain(15000);
  });

  test('maps aborted requests to timeout failures', async () => {
    const abortError = new Error('request timed out');
    abortError.name = 'AbortError';

    global.fetch = mock(async () => {
      throw abortError;
    });

    const result = await postScheduleAccountDeletion({
      authProvider: 'google',
      refreshToken: 'refresh-token',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'timeout',
      message: 'request timed out',
    });
  });

  test('maps non-timeout fetch failures to network failures', async () => {
    global.fetch = mock(async () => {
      throw new Error('socket hang up');
    });

    const result = await postScheduleAccountDeletion({
      authProvider: 'google',
      refreshToken: 'refresh-token',
    });

    expect(result).toEqual({
      ok: false,
      reason: 'network',
      message: 'socket hang up',
    });
  });
});

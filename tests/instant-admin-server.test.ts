import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';

const runtimeConfigMock = {
  getInstantAppIdForServer: mock(() => 'app-123'),
  getInstantApiUriForServer: mock(() => 'https://api.instantdb.com'),
};

mock.module(
  '@/src/lib/referral/instant-runtime-server',
  () => runtimeConfigMock
);

const { instantAdminFetch } =
  await import('@/src/lib/referral/instant-admin-server');

describe('instant admin server fetch composition', () => {
  const originalFetch = global.fetch;
  const originalSetTimeout = global.setTimeout;
  const originalClearTimeout = global.clearTimeout;
  const originalAdminToken = process.env.INSTANT_APP_ADMIN_TOKEN;

  beforeEach(() => {
    process.env.INSTANT_APP_ADMIN_TOKEN = 'admin-token';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    global.setTimeout = originalSetTimeout;
    global.clearTimeout = originalClearTimeout;
    process.env.INSTANT_APP_ADMIN_TOKEN = originalAdminToken;
  });

  test('keeps the timeout active when the caller passes a signal', async () => {
    const observedSignals: AbortSignal[] = [];
    const callerController = new AbortController();
    const config = {
      adminToken: 'admin-token',
      apiUri: 'https://api.instantdb.com',
      appId: 'app-123',
    };
    let timeoutHandler: TimerHandler | undefined;

    global.setTimeout = ((handler: TimerHandler, timeout?: number) => {
      expect(timeout).toBe(30000);
      timeoutHandler = handler;
      return 1 as unknown as ReturnType<typeof setTimeout>;
    }) as typeof setTimeout;
    global.clearTimeout = (() => undefined) as typeof clearTimeout;
    global.fetch = mock(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        if (typeof timeoutHandler === 'function') {
          timeoutHandler();
        }
        if (init?.signal) {
          observedSignals.push(init.signal);
        }
        return new Response('{"ok":true}', { status: 200 });
      }
    );

    await instantAdminFetch(config, '/admin/query', {
      body: '{}',
      method: 'POST',
      signal: callerController.signal,
    });

    expect(observedSignals).toHaveLength(1);
    expect(observedSignals[0]).not.toBe(callerController.signal);
    expect(observedSignals[0].aborted).toBe(true);
    expect(observedSignals[0].reason).toBeInstanceOf(Error);
    expect((observedSignals[0].reason as Error).message).toBe(
      'instant_admin_request_timeout_after_30000ms'
    );
  });
});

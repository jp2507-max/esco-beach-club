import { describe, expect, test } from 'bun:test';

import { runWithProfileClaimLock } from '@/app/api/rewards/claim+api';

function createDeferred<T>(): {
  promise: Promise<T>;
  reject: (reason?: unknown) => void;
  resolve: (value: T | PromiseLike<T>) => void;
} {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, reject, resolve };
}

describe('reward claim profile lock', () => {
  test('serializes tasks for the same profile', async () => {
    const executionOrder: string[] = [];
    const firstGate = createDeferred<void>();

    const firstTask = runWithProfileClaimLock('profile-1', async () => {
      executionOrder.push('first:start');
      await firstGate.promise;
      executionOrder.push('first:end');
      return 'first';
    });

    let secondStarted = false;
    const secondTask = runWithProfileClaimLock('profile-1', async () => {
      secondStarted = true;
      executionOrder.push('second:start');
      executionOrder.push('second:end');
      return 'second';
    });

    await Promise.resolve();
    expect(secondStarted).toBe(false);

    firstGate.resolve(undefined);

    await expect(firstTask).resolves.toBe('first');
    await expect(secondTask).resolves.toBe('second');
    expect(executionOrder).toEqual([
      'first:start',
      'first:end',
      'second:start',
      'second:end',
    ]);
  });

  test('does not block different profiles', async () => {
    const firstGate = createDeferred<void>();

    const firstTask = runWithProfileClaimLock('profile-1', async () => {
      await firstGate.promise;
      return 'first';
    });

    const secondTask = runWithProfileClaimLock('profile-2', async () => {
      return 'second';
    });

    await expect(secondTask).resolves.toBe('second');

    firstGate.resolve(undefined);
    await expect(firstTask).resolves.toBe('first');
  });

  test('continues queue after a task failure', async () => {
    await expect(
      runWithProfileClaimLock('profile-3', async () => {
        throw new Error('lock-test-failure');
      })
    ).rejects.toThrow('lock-test-failure');

    await expect(
      runWithProfileClaimLock('profile-3', async () => 'recovered')
    ).resolves.toBe('recovered');
  });
});

import { sealData } from 'iron-session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSiteSealValid, SITE_SESSION_TTL_SECONDS } from '@/lib/session';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const seal = (data: object, password = SECRET) => sealData(data, { password, ttl: SITE_SESSION_TTL_SECONDS });

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('isSiteSealValid', () => {
  it('accepts an unlocked seal made with AUTH_SECRET', async () => {
    expect(await isSiteSealValid(await seal({ unlocked: true }))).toBe(true);
  });

  it('rejects a missing cookie', async () => {
    expect(await isSiteSealValid(undefined)).toBe(false);
  });

  it('rejects a forged value', async () => {
    expect(await isSiteSealValid('not-a-real-seal')).toBe(false);
  });

  it('rejects a seal made with a different secret', async () => {
    expect(await isSiteSealValid(await seal({ unlocked: true }, 'a-completely-different-secret-of-32-chars'))).toBe(false);
  });

  it('rejects a seal without the unlocked flag', async () => {
    expect(await isSiteSealValid(await seal({}))).toBe(false);
  });

  it('rejects a seal older than 45 days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const oldSeal = await seal({ unlocked: true });
    vi.setSystemTime(new Date('2026-11-20T00:00:00Z'));
    expect(await isSiteSealValid(oldSeal)).toBe(false);
  });

  it('throws a clear error when AUTH_SECRET is missing or too short', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    await expect(isSiteSealValid('anything')).rejects.toThrow(/AUTH_SECRET/);
    vi.stubEnv('AUTH_SECRET', 'short');
    await expect(isSiteSealValid('anything')).rejects.toThrow(/AUTH_SECRET/);
  });
});

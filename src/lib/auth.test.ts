import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeSitePassword, passwordsMatch } from '@/lib/auth';

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

const getIronSessionMock = vi.fn();
vi.mock('iron-session', () => ({
  getIronSession: (...args: unknown[]) => getIronSessionMock(...args),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({})),
}));

describe('passwordsMatch', () => {
  it('matches identical strings', () => {
    expect(passwordsMatch('fiesta2026', 'fiesta2026')).toBe(true);
  });

  it('rejects a different string of the same length', () => {
    expect(passwordsMatch('fiesta2027', 'fiesta2026')).toBe(false);
  });

  it('rejects a different length without throwing', () => {
    expect(passwordsMatch('fiesta', 'fiesta2026')).toBe(false);
  });
});

describe('normalizeSitePassword', () => {
  it('ignores surrounding whitespace and letter case', () => {
    expect(normalizeSitePassword('  Fiesta2026 ')).toBe('fiesta2026');
  });
});

describe('requireSiteSession', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getIronSessionMock.mockReset();
    vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long');
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('does not redirect when the session is unlocked', async () => {
    getIronSessionMock.mockResolvedValue({ unlocked: true });
    const { requireSiteSession } = await import('@/lib/auth');
    await requireSiteSession();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to /unlock when unlocked is missing', async () => {
    getIronSessionMock.mockResolvedValue({});
    const { requireSiteSession } = await import('@/lib/auth');
    await requireSiteSession();
    expect(redirectMock).toHaveBeenCalledWith('/unlock');
  });

  it('redirects to /unlock when unlocked is false', async () => {
    getIronSessionMock.mockResolvedValue({ unlocked: false });
    const { requireSiteSession } = await import('@/lib/auth');
    await requireSiteSession();
    expect(redirectMock).toHaveBeenCalledWith('/unlock');
  });
});

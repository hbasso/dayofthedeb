import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: { admin: undefined as boolean | undefined, save: vi.fn(async () => {}), destroy: vi.fn() },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  getAdminSession: async () => mocks.session,
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));

import { adminLogin, adminLogout } from '@/server/actions/admin-login';

const ADMIN_PASSWORD = 'Correct-Horse-Battery';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.admin = undefined;
  vi.stubEnv('ADMIN_PASSWORD', ADMIN_PASSWORD);
  vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long');
});

describe('adminLogin', () => {
  it('reports a setup error and does not save a session when ADMIN_PASSWORD is missing or too short', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubEnv('ADMIN_PASSWORD', 'short');
    expect(await adminLogin({}, form({ password: ADMIN_PASSWORD }))).toEqual({
      error: 'Admin sign-in is not set up yet. Check ADMIN_PASSWORD.',
    });
    expect(mocks.session.save).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith('admin sign-in misconfigured', expect.any(Error));
    consoleError.mockRestore();
  });

  it('rejects a wrong password without creating a session', async () => {
    expect(await adminLogin({}, form({ password: 'wrong-password-here' }))).toEqual({
      error: expect.stringContaining('admin password'),
    });
    expect(mocks.session.save).not.toHaveBeenCalled();
  });

  it('is case-sensitive and does not trim', async () => {
    expect((await adminLogin({}, form({ password: ADMIN_PASSWORD.toLowerCase() }))).error).toBeDefined();
    expect((await adminLogin({}, form({ password: ` ${ADMIN_PASSWORD}` }))).error).toBeDefined();
    expect(mocks.session.save).not.toHaveBeenCalled();
  });

  it('saves the admin session and redirects to a safe admin path', async () => {
    await expect(adminLogin({}, form({ password: ADMIN_PASSWORD, next: '/admin?status=awaiting' }))).rejects.toThrow(
      'NEXT_REDIRECT /admin?status=awaiting',
    );
    expect(mocks.session.admin).toBe(true);
    expect(mocks.session.save).toHaveBeenCalled();
  });

  it('never redirects outside the admin pages', async () => {
    await expect(adminLogin({}, form({ password: ADMIN_PASSWORD, next: 'https://evil.example' }))).rejects.toThrow(
      'NEXT_REDIRECT /admin',
    );
  });
});

describe('adminLogout', () => {
  it('destroys the admin session and returns to the login page', async () => {
    await expect(adminLogout()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(mocks.session.destroy).toHaveBeenCalled();
  });
});

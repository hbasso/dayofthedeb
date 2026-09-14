import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdminPassword, MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAdminPassword', () => {
  it('returns a long enough admin password unchanged', () => {
    vi.stubEnv('ADMIN_PASSWORD', ' Long-Admin-Pass ');
    expect(getAdminPassword()).toBe(' Long-Admin-Pass ');
  });

  it('throws when missing or too short', () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(() => getAdminPassword()).toThrow(/ADMIN_PASSWORD/);
    vi.stubEnv('ADMIN_PASSWORD', 'x'.repeat(MIN_ADMIN_PASSWORD_LENGTH - 1));
    expect(() => getAdminPassword()).toThrow(/at least 12/);
  });

  it('rejects an admin password matching the site password, case/space-insensitively', () => {
    vi.stubEnv('ADMIN_PASSWORD', '  Long-Admin-Pass  ');
    vi.stubEnv('SITE_PASSWORD', 'long-admin-pass');
    expect(() => getAdminPassword()).toThrow(/must differ from SITE_PASSWORD/);
  });

  it('allows a different admin password even when a site password is set', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'Correct-Horse-Battery');
    vi.stubEnv('SITE_PASSWORD', 'some-other-password');
    expect(getAdminPassword()).toBe('Correct-Horse-Battery');
  });

  it('does not throw for a missing SITE_PASSWORD', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'Correct-Horse-Battery');
    vi.stubEnv('SITE_PASSWORD', '');
    expect(getAdminPassword()).toBe('Correct-Horse-Battery');
  });
});

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
});

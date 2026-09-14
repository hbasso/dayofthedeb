import { describe, expect, it } from 'vitest';
import { normalizeSitePassword, passwordsMatch } from '@/lib/auth';

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

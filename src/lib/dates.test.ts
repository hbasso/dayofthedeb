import { describe, expect, it } from 'vitest';
import { formatEventDate } from '@/lib/dates';

describe('formatEventDate', () => {
  it('formats a date-only string as month and day', () => {
    expect(formatEventDate('2026-11-15')).toBe('November 15');
    expect(formatEventDate('2026-12-01')).toBe('December 1');
  });

  it('returns null for a missing or unparseable date', () => {
    expect(formatEventDate(null)).toBeNull();
    expect(formatEventDate('soon')).toBeNull();
  });
});

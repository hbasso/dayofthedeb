import { describe, expect, it } from 'vitest';
import { formatEventDate, formatLongDate, formatTimeRange } from '@/lib/dates';

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

describe('formatLongDate', () => {
  it('formats a date-only string with weekday, month, day, and year', () => {
    expect(formatLongDate('2026-12-05')).toBe('Saturday, December 5, 2026');
  });

  it('returns null for missing or invalid dates', () => {
    expect(formatLongDate(null)).toBeNull();
    expect(formatLongDate('soon')).toBeNull();
  });
});

describe('formatTimeRange', () => {
  it('joins a start and end time with an en dash', () => {
    expect(formatTimeRange('7:00 PM', '11:00 PM')).toBe('7:00 PM – 11:00 PM');
  });

  it('uses the start time alone when there is no end time', () => {
    expect(formatTimeRange('7:00 PM', null)).toBe('7:00 PM');
  });

  it('returns null without a start time', () => {
    expect(formatTimeRange(null, '11:00 PM')).toBeNull();
    expect(formatTimeRange(null, null)).toBeNull();
  });
});

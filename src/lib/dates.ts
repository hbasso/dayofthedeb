import { siteConfig } from '@/config/site';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reduces any accepted input to a plain calendar day. A date-only string already is one; a full
 * timestamp is resolved in the event's own time zone, so a response logged at 9pm in San Antonio
 * reads as that day rather than the next one in UTC. Anything unparseable becomes null.
 */
function calendarDay(iso: string | null): string | null {
  if (!iso) return null;
  if (DATE_ONLY.test(iso)) return iso;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: siteConfig.timeZone,
  }).format(parsed);
}

/** Noon UTC keeps the calendar day stable no matter where the reader is. */
function formatDay(iso: string | null, options: Intl.DateTimeFormatOptions): string | null {
  const day = calendarDay(iso);
  if (!day) return null;
  const date = new Date(`${day}T12:00:00Z`);
  // A day out of range rolls over rather than failing (Feb 30 becomes Mar 2), so a typo in the
  // config would render a confidently wrong date. Round-trip it and reject anything that moved.
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day) return null;
  return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' }).format(date);
}

/** "2026-12-27", or a full timestamp, → "December 27". */
export function formatEventDate(isoDate: string | null): string | null {
  return formatDay(isoDate, { month: 'long', day: 'numeric' });
}

/** "2026-12-27", or a full timestamp, → "Sunday, December 27, 2026". */
export function formatLongDate(isoDate: string | null): string | null {
  return formatDay(isoDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

/** "7:00 PM" + "11:00 PM" → "7:00 PM – 11:00 PM"; the start time alone when there is no end. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${start} – ${end}` : start;
}

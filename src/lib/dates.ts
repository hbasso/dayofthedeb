/** Formats a date-only ISO string ("2026-11-15") as "November 15" without shifting across time zones. */
export function formatEventDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

/** "2026-12-05" → "Saturday, December 5, 2026" without shifting across time zones. */
export function formatLongDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** "7:00 PM" + "11:00 PM" → "7:00 PM – 11:00 PM"; the start time alone when there is no end. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${start} – ${end}` : start;
}

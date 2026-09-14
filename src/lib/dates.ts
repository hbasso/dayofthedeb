/** Formats a date-only ISO string ("2026-11-15") as "November 15" without shifting across time zones. */
export function formatEventDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

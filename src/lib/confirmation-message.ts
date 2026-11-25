import type { Attendance } from '@/types/domain';

export const CONFIRMATION_YES =
  "We can't wait to see you! The party starts at 8 PM, and the girls will be celebrated at 9. Please allow extra time to arrive. Rideshare is recommended for the busy Riverwalk during the holiday season!";
export const CONFIRMATION_ALL_NO = 'We will miss you!';
export const CONFIRMATION_PENDING = 'Your RSVP is saved.';

/**
 * The line under "¡Gracias!" after a household submits.
 * Any yes gets the party details; every guest a no gets the miss-you line;
 * no yes with someone still unanswered keeps a neutral saved line.
 */
export function confirmationMessage(guests: ReadonlyArray<{ attending: Attendance }>): string {
  if (guests.some((guest) => guest.attending === 'yes')) return CONFIRMATION_YES;
  if (guests.length > 0 && guests.every((guest) => guest.attending === 'no')) return CONFIRMATION_ALL_NO;
  return CONFIRMATION_PENDING;
}

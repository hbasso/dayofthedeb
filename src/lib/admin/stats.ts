import { toCalendarDay } from '@/lib/dates';
import { countedPlusOne } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';

export interface ResponseStats {
  headcount: number;
  attendingGuests: number;
  plusOnesComing: number;
  plusOnesOffered: number;
  declinedGuests: number;
  awaitingGuests: number;
  guestsResponded: number;
  totalGuests: number;
  householdsResponded: number;
  totalHouseholds: number;
  householdsRespondedLast7Days: number;
  lastResponseDate: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Midnight UTC for the stored value's calendar day *in the event's time zone*. It has to be the
 * same reduction lib/dates.ts uses for display: slicing the first ten characters off the ISO
 * string reads the UTC day instead, so an 8pm response in San Antonio lands on tomorrow's date
 * and drops out of this tile while "Latest response" beside it still shows today.
 */
function startOfDay(value: string): number {
  const day = toCalendarDay(value);
  return day ? Date.parse(`${day}T00:00:00Z`) : NaN;
}

function daysBefore(today: string, date: string): number {
  return Math.round((startOfDay(today) - startOfDay(date)) / DAY_MS);
}

function latestResponse(invitation: Invitation): string | null {
  const dates = invitation.guests.flatMap((guest) => (guest.respondedAt ? [guest.respondedAt] : []));
  return dates.length > 0 ? dates.sort().at(-1)! : null;
}

/** All numbers for the admin summary (DESIGN §7). `today` is YYYY-MM-DD in the event time zone. */
export function computeStats(invitations: readonly Invitation[], today: string): ResponseStats {
  // A half-created row with no named guests can never respond, so counting it would cap
  // the response rate below 100% forever. It is not a household anyone was invited to.
  const households = invitations.filter((invitation) => invitation.guests.length > 0);
  const guests = households.flatMap((invitation) => invitation.guests);
  const attendingGuests = guests.filter((guest) => guest.attending === 'yes').length;
  const plusOnesComing = guests.filter((guest) => countedPlusOne(guest) !== null).length;
  const householdDates = households.flatMap((invitation) => {
    const date = latestResponse(invitation);
    return date ? [date] : [];
  });

  return {
    headcount: attendingGuests + plusOnesComing,
    attendingGuests,
    plusOnesComing,
    plusOnesOffered: guests.filter((guest) => guest.hasPlusOne).length,
    declinedGuests: guests.filter((guest) => guest.attending === 'no').length,
    awaitingGuests: guests.filter((guest) => guest.attending === null).length,
    guestsResponded: guests.filter((guest) => guest.attending !== null).length,
    totalGuests: guests.length,
    householdsResponded: households.filter((invitation) => invitation.guests.some((guest) => guest.attending !== null)).length,
    totalHouseholds: households.length,
    householdsRespondedLast7Days: householdDates.filter((date) => {
      const days = daysBefore(today, date);
      return days >= 0 && days < 7;
    }).length,
    lastResponseDate: householdDates.length > 0 ? [...householdDates].sort().at(-1)! : null,
  };
}

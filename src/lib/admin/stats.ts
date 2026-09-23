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
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Midnight UTC for a stored date. Accepts a full timestamp by taking its date part, matching what
 * lib/dates.ts renders: otherwise a timestamped Responded At would make this tile read zero while
 * "Latest response" beside it still showed a date. NaN for anything else, which never counts.
 */
function startOfDay(value: string): number {
  const day = DATE_ONLY.test(value) ? value : value.slice(0, 10);
  return DATE_ONLY.test(day) ? Date.parse(`${day}T00:00:00Z`) : NaN;
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
  // A half-created Airtable row with no named guests can never respond, so counting it would cap
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

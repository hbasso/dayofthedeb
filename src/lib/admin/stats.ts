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

function daysBefore(today: string, date: string): number {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS);
}

function latestResponse(invitation: Invitation): string | null {
  const dates = invitation.guests.flatMap((guest) => (guest.respondedAt ? [guest.respondedAt] : []));
  return dates.length > 0 ? dates.sort().at(-1)! : null;
}

/** All numbers for the admin summary (DESIGN §7). `today` is YYYY-MM-DD in the event time zone. */
export function computeStats(invitations: readonly Invitation[], today: string): ResponseStats {
  const guests = invitations.flatMap((invitation) => invitation.guests);
  const attendingGuests = guests.filter((guest) => guest.attending === 'yes').length;
  const plusOnesComing = guests.filter((guest) => countedPlusOne(guest) !== null).length;
  const householdDates = invitations.flatMap((invitation) => {
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
    householdsResponded: invitations.filter((invitation) => invitation.guests.some((guest) => guest.attending !== null)).length,
    totalHouseholds: invitations.length,
    householdsRespondedLast7Days: householdDates.filter((date) => {
      const days = daysBefore(today, date);
      return days >= 0 && days < 7;
    }).length,
    lastResponseDate: householdDates.length > 0 ? [...householdDates].sort().at(-1)! : null,
  };
}

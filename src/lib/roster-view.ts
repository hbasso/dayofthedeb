import { storedPlusOneName } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';
import type { RosterHousehold, RsvpAnswer } from '@/types/rsvp';

/** Projection sent to the browser. Never add email, alt names, or response dates here. */
export function toRosterHousehold(invitation: Invitation): RosterHousehold {
  return {
    id: invitation.id,
    household: invitation.household,
    guests: invitation.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      hasPlusOne: guest.hasPlusOne,
      attending: guest.attending,
      plusOneName: guest.plusOneName,
    })),
  };
}

/** The household as it looks after the given answers are saved (used for the confirmation screen). */
export function withAnswers(household: RosterHousehold, answers: readonly RsvpAnswer[]): RosterHousehold {
  const answersByGuest = new Map(answers.map((answer) => [answer.guestId, answer]));
  return {
    ...household,
    guests: household.guests.map((guest) => {
      const answer = answersByGuest.get(guest.id);
      if (!answer) return guest;
      if (!guest.hasPlusOne) return { ...guest, attending: answer.attending };
      const plusOneName = storedPlusOneName(true, answer.attending, answer.plusOneName) ?? undefined;
      return { ...guest, attending: answer.attending, plusOneName };
    }),
  };
}

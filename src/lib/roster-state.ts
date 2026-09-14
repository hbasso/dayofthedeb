import type { RosterHousehold, RsvpAnswer } from '@/types/rsvp';

export interface GuestAnswerState {
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  bringingGuest: boolean;
  plusOneName: string;
}

export type RosterState = Record<string, GuestAnswerState>;

export type RosterAction =
  | { type: 'setAttending'; guestId: string; attending: 'yes' | 'no' }
  | { type: 'setBringingGuest'; guestId: string; bringingGuest: boolean }
  | { type: 'setPlusOneName'; guestId: string; plusOneName: string };

export interface RosterIssue {
  guestId: string;
  problem: 'unanswered' | 'missing-guest-name';
}

/** Hydrates from current answers so returning guests see where they left off (DESIGN §6, editing). */
export function initRosterState(household: RosterHousehold): RosterState {
  return Object.fromEntries(
    household.guests.map((guest) => {
      const plusOneName = guest.hasPlusOne ? (guest.plusOneName ?? '') : '';
      return [
        guest.id,
        {
          hasPlusOne: guest.hasPlusOne,
          attending: guest.attending,
          bringingGuest: guest.hasPlusOne && guest.attending === 'yes' && plusOneName.trim() !== '',
          plusOneName,
        },
      ];
    }),
  );
}

function update(state: RosterState, guestId: string, next: GuestAnswerState): RosterState {
  return { ...state, [guestId]: next };
}

export function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  const current = state[action.guestId];
  if (!current) return state;

  switch (action.type) {
    case 'setAttending':
      return action.attending === 'yes'
        ? update(state, action.guestId, { ...current, attending: 'yes' })
        : update(state, action.guestId, { ...current, attending: 'no', bringingGuest: false, plusOneName: '' });
    case 'setBringingGuest':
      if (!current.hasPlusOne || current.attending !== 'yes') return state;
      return update(state, action.guestId, {
        ...current,
        bringingGuest: action.bringingGuest,
        plusOneName: action.bringingGuest ? current.plusOneName : '',
      });
    case 'setPlusOneName':
      if (!current.bringingGuest) return state;
      return update(state, action.guestId, { ...current, plusOneName: action.plusOneName });
  }
}

function bringsNamedGuest(answer: GuestAnswerState): boolean {
  return answer.attending === 'yes' && answer.bringingGuest && answer.plusOneName.trim() !== '';
}

export function partyHeadcount(state: RosterState): number {
  return Object.values(state).reduce(
    (count, answer) => count + (answer.attending === 'yes' ? 1 : 0) + (bringsNamedGuest(answer) ? 1 : 0),
    0,
  );
}

export function rosterIssues(household: RosterHousehold, state: RosterState): RosterIssue[] {
  return household.guests.flatMap((guest): RosterIssue[] => {
    const answer = state[guest.id];
    if (!answer || answer.attending === null) return [{ guestId: guest.id, problem: 'unanswered' }];
    if (answer.attending === 'yes' && answer.bringingGuest && answer.plusOneName.trim() === '') {
      return [{ guestId: guest.id, problem: 'missing-guest-name' }];
    }
    return [];
  });
}

/**
 * One answer per guest, in household roster order (submitRsvp requires exactly one
 * answer per guest). Call only after rosterIssues(household, state) is empty: an
 * unanswered guest still produces an entry here, with `attending` carrying `null`
 * despite the RsvpAnswer type, so callers must not submit until issues are resolved.
 */
export function toRsvpAnswers(household: RosterHousehold, state: RosterState): RsvpAnswer[] {
  return household.guests.map((guest): RsvpAnswer => {
    const answer = state[guest.id];
    const attending = (answer?.attending ?? null) as RsvpAnswer['attending'];
    return answer && bringsNamedGuest(answer)
      ? { guestId: guest.id, attending, plusOneName: answer.plusOneName.trim() }
      : { guestId: guest.id, attending };
  });
}

import type { Attendance } from '@/types/domain';

/** The only guest data the browser receives: no email, alt names, or response dates. */
export interface RosterGuest {
  id: string;
  name: string;
  hasPlusOne: boolean;
  attending: Attendance;
  plusOneName?: string;
}

export interface RosterHousehold {
  id: string;
  household: string;
  guests: RosterGuest[];
  hasEmailOnFile: boolean;
}

export interface RsvpAnswer {
  guestId: string;
  attending: 'yes' | 'no';
  plusOneName?: string;
}

export interface SubmitRsvpInput {
  invitationId: string;
  answers: RsvpAnswer[];
  email?: string;
}

export type SearchGuestsResult =
  | { status: 'ok'; households: RosterHousehold[]; truncated: boolean }
  | { status: 'invalid-query' }
  | { status: 'error' };

export type SubmitRsvpResult =
  | { status: 'ok'; household: RosterHousehold }
  | { status: 'invalid' }
  | { status: 'error' };

export interface SearchOutcome {
  query: string;
  households: RosterHousehold[];
  truncated: boolean;
}

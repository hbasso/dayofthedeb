export type Attendance = 'yes' | 'no' | null;

export interface Guest {
  id: string;
  name: string;
  altNames?: string[];
  hasPlusOne: boolean; // host-set: may this guest bring a plus-one
  attending: Attendance;
  plusOneName?: string; // captured at RSVP when they bring one; filled => counts a +1
  respondedAt?: string; // ISO timestamp, set by the site on submit
}

export interface Invitation {
  id: string;
  household: string;
  /** Household email. Entered by the guest at RSVP; never sent to the browser. */
  email?: string;
  /** Family name the host sorts by, when it differs from the household label. */
  primaryLastName?: string;
  /** Which host list the household came from. Host reference and export only. */
  source?: string;
  guests: Guest[];
}

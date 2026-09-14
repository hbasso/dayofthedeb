export type Attendance = 'yes' | 'no' | null;

export interface Guest {
  id: string;
  name: string;
  altNames?: string[];
  hasPlusOne: boolean; // host-set: may this guest bring a plus-one
  attending: Attendance;
  plusOneName?: string; // captured at RSVP when they bring one; filled => counts a +1
}

export interface Invitation {
  id: string;
  household: string;
  email?: string;
  guests: Guest[];
}

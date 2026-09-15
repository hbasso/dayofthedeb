export interface VenueInfo {
  name: string;
  streetAddress: string;
  /** e.g. "Unit 150"; null when there is none. */
  unit: string | null;
  city: string;
  region: string;
  postalCode: string;
  /** Short description for the venue page. null until the host confirms. */
  description: string | null;
  /** Which entrance guests should use. null until the host confirms. */
  entranceNote: string | null;
}

export interface SiteConfig {
  name: string;
  description: string;
  honorees: {
    count: number;
    /** Display names in order. Empty until the host confirms. */
    names: string[];
  };
  event: {
    /** YYYY-MM-DD. null until the host confirms. */
    date: string | null;
    /** Display text, e.g. "7:00 PM". null until the host confirms. */
    startTime: string | null;
    endTime: string | null;
    dressCode: string | null;
  };
  /** YYYY-MM-DD. null until the host confirms. */
  rsvpDeadline: string | null;
  venue: VenueInfo;
  /** IANA time zone of the event; used for date-only fields like Responded At. */
  timeZone: string;
}

export const siteConfig: SiteConfig = {
  name: 'Day of the Deb',
  description: 'A private débutante celebration. Event details and RSVP for invited guests.',
  honorees: {
    count: 5,
    names: [],
  },
  event: {
    date: null,
    startTime: null,
    endTime: null,
    dressCode: null,
  },
  rsvpDeadline: null,
  venue: {
    name: 'Mexico Ceaty',
    streetAddress: '849 E Commerce St',
    unit: 'Unit 150',
    city: 'San Antonio',
    region: 'TX',
    postalCode: '78205',
    description: null,
    entranceNote: null,
  },
  timeZone: 'America/Chicago',
};

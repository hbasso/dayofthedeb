export interface SiteConfig {
  name: string;
  description: string;
  venue: {
    name: string;
    city: string;
  };
  /** ISO 8601 with offset, e.g. "2026-12-05T19:00:00-06:00". null until the host confirms. */
  eventStartsAt: string | null;
  /** ISO 8601 date, e.g. "2026-11-15". null until the host confirms. */
  rsvpDeadline: string | null;
  /** IANA time zone of the event; used for date-only fields like Responded At. */
  timeZone: string;
}

export const siteConfig: SiteConfig = {
  name: 'Day of the Deb',
  description: 'A private débutante celebration. Event details and RSVP for invited guests.',
  venue: {
    name: 'Mexico Ceaty',
    city: 'San Antonio, TX',
  },
  eventStartsAt: null,
  rsvpDeadline: null,
  timeZone: 'America/Chicago',
};

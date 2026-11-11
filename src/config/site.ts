// Coordinates live with the directions config; the venue is just another place we pin.
import type { Coordinates } from '@/config/directions';

export interface VenueInfo {
  name: string;
  /** How the home page names the venue, in place of the full address; it links to the venue page. */
  homeLabel: string;
  streetAddress: string;
  /** e.g. "Unit 150"; null when there is none. */
  unit: string | null;
  city: string;
  region: string;
  postalCode: string;
  /** Where the address sits, shown under it. null when there is no landmark worth naming. */
  landmark: string | null;
  /** The venue's public phone number, as it should read on screen. null when there is none. */
  phone: string | null;
  /** The venue's own pin, so map links open on it rather than on a list of search results. */
  coordinates: Coordinates | null;
  /** Short description for the venue page. null until the host confirms. */
  description: string | null;
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
    date: '2026-12-27',
    startTime: '8:00 PM',
    endTime: '1:00 AM',
    dressCode: 'Vaquera chic',
  },
  rsvpDeadline: '2026-12-13',
  venue: {
    name: 'Mexico Ceaty',
    homeLabel: 'Mexico Ceaty at Rivercenter',
    streetAddress: '849 E Commerce St',
    unit: 'Unit 150',
    city: 'San Antonio',
    region: 'TX',
    postalCode: '78205',
    landmark: 'Inside the Shops at Rivercenter on the River Walk',
    phone: '(210) 293-5714',
    coordinates: { latitude: 29.4233841, longitude: -98.4840748 },
    description:
      "Mexico Ceaty is Chef Jason Dady's Mexican food hall on the River Walk. Its mole poblano with smoked chicken was named one of the best bites of the 2026 Austin Food & Wine Festival.",
  },
  timeZone: 'America/Chicago',
};

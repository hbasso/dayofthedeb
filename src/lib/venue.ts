import type { VenueInfo } from '@/config/site';

export function venueAddressLines(venue: VenueInfo): string[] {
  const street = venue.unit ? `${venue.streetAddress}, ${venue.unit}` : venue.streetAddress;
  return [street, `${venue.city}, ${venue.region} ${venue.postalCode}`];
}

export function venueSingleLine(venue: VenueInfo): string {
  return venueAddressLines(venue).join(', ');
}

/** Name + street address, without the unit number, which trips up map search. */
export function venueMapQuery(venue: VenueInfo): string {
  return `${venue.name}, ${venue.streetAddress}, ${venue.city}, ${venue.region} ${venue.postalCode}`;
}

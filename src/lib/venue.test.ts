import { describe, expect, it } from 'vitest';
import type { VenueInfo } from '@/config/site';
import { venueAddressLines, venueMapQuery, venueSingleLine } from '@/lib/venue';

const venue: VenueInfo = {
  name: 'Mexico Ceaty',
  streetAddress: '849 E Commerce St',
  unit: 'Unit 150',
  city: 'San Antonio',
  region: 'TX',
  postalCode: '78205',
  landmark: null,
  description: null,
  entranceNote: null,
};

describe('venue address helpers', () => {
  it('splits the address into mailing lines', () => {
    expect(venueAddressLines(venue)).toEqual(['849 E Commerce St, Unit 150', 'San Antonio, TX 78205']);
    expect(venueAddressLines({ ...venue, unit: null })).toEqual(['849 E Commerce St', 'San Antonio, TX 78205']);
  });

  it('joins the address onto one line', () => {
    expect(venueSingleLine(venue)).toBe('849 E Commerce St, Unit 150, San Antonio, TX 78205');
  });

  it('builds a map query from the venue name and street address (units confuse map search)', () => {
    expect(venueMapQuery(venue)).toBe('Mexico Ceaty, 849 E Commerce St, San Antonio, TX 78205');
  });
});

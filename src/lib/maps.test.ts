import { describe, expect, it } from 'vitest';
import {
  appleMapsPointUrl,
  appleMapsSearchUrl,
  googleMapsEmbedUrl,
  googleMapsPointUrl,
  googleMapsSearchUrl,
  lyftDropoffUrl,
  uberDropoffUrl,
} from '@/lib/maps';

const QUERY = 'Mexico Ceaty, 849 E Commerce St, San Antonio, TX 78205';
const DROPOFF = { latitude: 29.42, longitude: -98.48 };

describe('map links', () => {
  it('builds Google and Apple search links with the query encoded', () => {
    const google = new URL(googleMapsSearchUrl(QUERY));
    expect(google.origin + google.pathname).toBe('https://www.google.com/maps/search/');
    expect(google.searchParams.get('api')).toBe('1');
    expect(google.searchParams.get('query')).toBe(QUERY);

    const apple = new URL(appleMapsSearchUrl(QUERY));
    expect(apple.origin).toBe('https://maps.apple.com');
    expect(apple.searchParams.get('q')).toBe(QUERY);
  });

  it('opens an exact point rather than a list of search results', () => {
    const point = { latitude: 29.4233336, longitude: -98.4849453 };

    const google = new URL(googleMapsPointUrl(point));
    expect(google.origin + google.pathname).toBe('https://www.google.com/maps/search/');
    expect(google.searchParams.get('query')).toBe('29.4233336,-98.4849453');

    const apple = new URL(appleMapsPointUrl(point, 'Rivercenter Commerce Street Garage'));
    expect(apple.origin).toBe('https://maps.apple.com');
    expect(apple.searchParams.get('ll')).toBe('29.4233336,-98.4849453');
    expect(apple.searchParams.get('q')).toBe('Rivercenter Commerce Street Garage');
  });

  it('builds a keyless Google Maps embed link', () => {
    const embed = new URL(googleMapsEmbedUrl(QUERY));
    expect(embed.origin + embed.pathname).toBe('https://www.google.com/maps');
    expect(embed.searchParams.get('q')).toBe(QUERY);
    expect(embed.searchParams.get('output')).toBe('embed');
  });
});

describe('rideshare links', () => {
  it('sets the Uber drop-off and leaves pickup to the rider location', () => {
    const uber = new URL(uberDropoffUrl(DROPOFF, 'Mexico Ceaty', '849 E Commerce St, San Antonio, TX 78205'));
    expect(uber.origin + uber.pathname).toBe('https://m.uber.com/ul/');
    expect(uber.searchParams.get('action')).toBe('setPickup');
    expect(uber.searchParams.get('pickup')).toBe('my_location');
    expect(uber.searchParams.get('dropoff[latitude]')).toBe('29.42');
    expect(uber.searchParams.get('dropoff[longitude]')).toBe('-98.48');
    expect(uber.searchParams.get('dropoff[nickname]')).toBe('Mexico Ceaty');
    expect(uber.searchParams.get('dropoff[formatted_address]')).toBe('849 E Commerce St, San Antonio, TX 78205');
  });

  it('sets the Lyft destination', () => {
    const lyft = new URL(lyftDropoffUrl(DROPOFF));
    expect(lyft.origin + lyft.pathname).toBe('https://lyft.com/ride');
    expect(lyft.searchParams.get('id')).toBe('lyft');
    expect(lyft.searchParams.get('destination[latitude]')).toBe('29.42');
    expect(lyft.searchParams.get('destination[longitude]')).toBe('-98.48');
  });
});

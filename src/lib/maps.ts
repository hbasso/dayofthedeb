import type { Coordinates } from '@/config/directions';

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`;
}

export function appleMapsSearchUrl(query: string): string {
  return `https://maps.apple.com/?${new URLSearchParams({ q: query })}`;
}

/**
 * A pin at an exact point rather than a text search. Searching a garage by name hands the guest a
 * list to pick from; a coordinate opens on the place itself, which is what they wanted.
 */
export function pointQuery(point: Coordinates): string {
  return `${point.latitude},${point.longitude}`;
}

export function googleMapsPointUrl(point: Coordinates): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: pointQuery(point) })}`;
}

/** Apple fixes the location with `ll` and uses `q` only to label the pin it drops there. */
export function appleMapsPointUrl(point: Coordinates, label: string): string {
  const params = new URLSearchParams({ ll: pointQuery(point), q: label });
  return `https://maps.apple.com/?${params}`;
}

/** Google's keyless embed; fine for a single pin on a small private site. */
export function googleMapsEmbedUrl(query: string): string {
  return `https://www.google.com/maps?${new URLSearchParams({ q: query, output: 'embed' })}`;
}

/** Opens Uber with the rider's current location as pickup and the venue drop-off preset. */
export function uberDropoffUrl(dropoff: Coordinates, nickname: string, address: string): string {
  const params = new URLSearchParams({
    action: 'setPickup',
    pickup: 'my_location',
    'dropoff[latitude]': String(dropoff.latitude),
    'dropoff[longitude]': String(dropoff.longitude),
    'dropoff[nickname]': nickname,
    'dropoff[formatted_address]': address,
  });
  return `https://m.uber.com/ul/?${params}`;
}

/** Opens Lyft (app or ride.lyft.com) with the drop-off preset. */
export function lyftDropoffUrl(dropoff: Coordinates): string {
  const params = new URLSearchParams({
    id: 'lyft',
    'destination[latitude]': String(dropoff.latitude),
    'destination[longitude]': String(dropoff.longitude),
  });
  return `https://lyft.com/ride?${params}`;
}

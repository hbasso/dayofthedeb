import type { Coordinates } from '@/config/directions';

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query })}`;
}

export function appleMapsSearchUrl(query: string): string {
  return `https://maps.apple.com/?${new URLSearchParams({ q: query })}`;
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

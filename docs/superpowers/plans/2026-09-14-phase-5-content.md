# Phase 5: Content Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder home page with the real landing page and add `/venue` with rideshare-first arrival guidance, a map, and clearly marked "To be announced" placeholders for every fact the host hasn't confirmed yet.

**Architecture:** All event and arrival facts live in typed config (`src/config/site.ts`, `src/config/directions.ts`, `src/config/gallery.ts`); a `null` value renders as "To be announced", so updating a fact is a one-line config edit. Pure helpers (`lib/maps.ts`, `lib/venue.ts`, `lib/dates.ts`, `lib/platform.ts`) build addresses, dates, and map/rideshare links and are unit-tested. Guest pages move into an `app/(site)` route group that shares a header and footer; `/unlock` and `/admin` stay outside it. Pages are static Server Components; the only client pieces are the nav's active-link state and the platform-aware "Open in Maps" button.

**Tech Stack:** Next.js 16.3 (App Router, route groups, `next/image` remote patterns, Cache Components), React 19, Tailwind v4 tokens, Vitest.

**Spec:** `DESIGN.md` §8 (content pages), §9 (theme), §10 (structure). Covers §14 step 6.

## Host decisions (2026-09-14)

- **Honorees:** 5 débutantes; names to be announced.
- **Event date, start/end time, dress code, RSVP deadline:** all to be announced.
- **Venue:** Mexico Ceaty, 849 E Commerce St, Unit 150, San Antonio, TX 78205 (inside the Shops at Rivercenter). Entrance and description to be announced.
- **Arrival:** recommend **rideshare only**; parking is very limited. Drop-off point, valet, walking route, and step-free route are to be announced.
- **Event day:** a large event is expected nearby; details pending.
- **Photos:** placeholder San Antonio River Walk photos from Unsplash (credited) until real photos arrive.

## Global Constraints

- Never guess a fact. Unknown values are `null` (or empty arrays) in config and render as "To be announced" (or a clearly marked placeholder sentence). No invented coordinates, times, prices, or routes.
- Uber and Lyft deep links need drop-off coordinates. Until `directionsConfig.rideshare.dropoffCoordinates` is set, show only the platform-aware "Open in Maps" link to the venue address plus "Exact drop-off point coming soon."
- All event copy comes from `src/config/*`; components never hardcode event facts.
- Colors via semantic tokens only; `font-display` for headings; components ≤ ~150 lines; pages compose only.
- Accessibility for guests of every age on phones: text-base or larger for body copy, 48px (`h-12`) primary buttons, meaningful `alt` text, `iframe` `title`, native `<details>`/`<summary>` for collapsible sections, visible focus.
- External links (`maps`, `uber`, `lyft`, Unsplash credits) open in a new tab with `rel="noopener noreferrer"`.
- `next/image` loads Unsplash only from `images.unsplash.com` (remote pattern). Photos are decorative placeholders and are credited.
- No backslash escape sequences in regexes or strings (a tooling bug corrupted them before). Don't edit `src/components/ui/*`. Commit with `git add -A -- . ':!.claude'`. Never open `.env.local`.

## Verified references

- Uber universal link: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=…&dropoff[longitude]=…&dropoff[nickname]=…&dropoff[formatted_address]=…` (latitude/longitude required). Source: developer.uber.com deep links docs.
- Lyft universal link: `https://lyft.com/ride?id=lyft&destination[latitude]=…&destination[longitude]=…` (opens the app or ride.lyft.com). Source: developer.lyft.com universal links.
- Google Maps search URL: `https://www.google.com/maps/search/?api=1&query=…`; embed without an API key: `https://www.google.com/maps?q=…&output=embed`. Apple Maps: `https://maps.apple.com/?q=…`.
- Unsplash photos (all HTTP 200, free license, verified 2026-09-14): see `src/config/gallery.ts` in Task 1.

## Existing interfaces this phase uses

- `@/config/site`: `siteConfig` (`name`, `description`, `venue.name`, `venue.city`, `eventStartsAt`, `rsvpDeadline`, `timeZone`) — this phase reshapes it (Task 1) and updates every consumer.
- `@/lib/dates`: `formatEventDate(isoDate)` → "November 15" or null.
- Consumers of `siteConfig` today: `src/app/layout.tsx` (`name`, `description`), `src/app/page.tsx`, `src/app/rsvp/page.tsx` (`rsvpDeadline`), `src/components/rsvp/rsvp-confirmation.tsx` (`rsvpDeadline`), `src/app/unlock/page.tsx`, `src/app/admin/login/page.tsx`, `src/components/admin/admin-header.tsx` (`name`), `src/lib/airtable/rsvp.ts` (`timeZone`).
- UI: `Button`, `buttonVariants` (`@/components/ui/button`), `cn` (`@/lib/utils`).
- `src/components/rsvp/rsvp-confirmation.tsx` already links to `/` and `/venue`.

## File Map

| File | Responsibility |
|---|---|
| `src/config/site.ts` | Reshaped: honorees, event details, full venue address |
| `src/config/directions.ts` | Rideshare-first arrival content |
| `src/config/gallery.ts` | Placeholder River Walk photos with credits |
| `src/lib/dates.ts` | + `formatLongDate`, `formatTimeRange` |
| `src/lib/venue.ts` | `venueAddressLines`, `venueSingleLine`, `venueMapQuery` |
| `src/lib/maps.ts` | Google/Apple search URLs, embed URL, Uber/Lyft drop-off URLs |
| `src/lib/platform.ts` | `isApplePlatform(userAgent)` |
| `next.config.ts` | + `images.remotePatterns` for Unsplash |
| `src/app/(site)/layout.tsx` | Header + footer for guest pages |
| `src/app/(site)/page.tsx` | Landing page (moved from `src/app/page.tsx`) |
| `src/app/(site)/rsvp/page.tsx` | Moved from `src/app/rsvp/page.tsx` |
| `src/app/(site)/venue/page.tsx` | Venue page |
| `src/components/layout/site-header.tsx`, `nav-link.tsx`, `site-footer.tsx` | Shared chrome |
| `src/components/content/tbd.tsx` | "To be announced" renderer |
| `src/components/content/event-details.tsx` | Date / time / dress code / RSVP by |
| `src/components/content/honorees.tsx` | Honorees section |
| `src/components/content/gallery-grid.tsx` | Photo strip with credits |
| `src/components/content/open-in-maps-button.tsx` | Platform-aware maps link |
| `src/components/content/venue-overview.tsx` | Name, address, description, entrance |
| `src/components/content/venue-map.tsx` | Embedded map |
| `src/components/content/rideshare-card.tsx` | Primary arrival guidance |
| `src/components/content/arrival-options.tsx` | Parking / valet / walking / accessibility |
| `src/components/content/wayfinding-steps.tsx` | Numbered steps or placeholder |
| `src/components/content/event-notices.tsx` | Event-day notices |

---

### Task 1: Config and pure helpers

**Files:**
- Modify: `src/config/site.ts`, `src/lib/dates.ts`, `src/lib/dates.test.ts`, `src/app/page.tsx`
- Create: `src/config/directions.ts`, `src/config/gallery.ts`, `src/lib/venue.ts`, `src/lib/maps.ts`, `src/lib/platform.ts`
- Test: `src/lib/venue.test.ts`, `src/lib/maps.test.ts`, `src/lib/platform.test.ts`

**Interfaces:**
- Produces:
  - `SiteConfig` (below) and `siteConfig`; `VenueInfo` type.
  - `Coordinates { latitude: number; longitude: number }`, `DirectionsConfig` (below), `directionsConfig`.
  - `GalleryPhoto { id; src; alt; photographer; photoUrl }`, `galleryPhotos: GalleryPhoto[]`, `GALLERY_IS_PLACEHOLDER: boolean`.
  - `formatLongDate(isoDate: string | null): string | null` ("Saturday, December 5, 2026"), `formatTimeRange(start: string | null, end: string | null): string | null`.
  - `venueAddressLines(venue: VenueInfo): string[]`, `venueSingleLine(venue: VenueInfo): string`, `venueMapQuery(venue: VenueInfo): string`.
  - `googleMapsSearchUrl(query)`, `appleMapsSearchUrl(query)`, `googleMapsEmbedUrl(query)`, `uberDropoffUrl(dropoff: Coordinates, nickname: string, address: string)`, `lyftDropoffUrl(dropoff: Coordinates)` — all return strings.
  - `isApplePlatform(userAgent: string): boolean`.

- [ ] **Step 1: Reshape the site config**

Replace `src/config/site.ts` with:
```ts
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
```

In `src/app/page.tsx` (temporary stub, replaced in Task 3), replace `{siteConfig.venue.name} · {siteConfig.venue.city}` with `{siteConfig.venue.name} · {siteConfig.venue.city}, {siteConfig.venue.region}` so the build keeps passing. `eventStartsAt` has no other consumers (verify with a grep; fix any you find).

- [ ] **Step 2: Arrival and gallery config**

`src/config/directions.ts`:
```ts
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface DirectionsConfig {
  rideshare: {
    /** Where drivers should drop guests off, e.g. "Commerce St entrance". null until confirmed. */
    dropoffDescription: string | null;
    /** Exact drop-off point for the Uber and Lyft buttons. null until confirmed; never guess. */
    dropoffCoordinates: Coordinates | null;
    /** Where to meet a ride home afterwards. null until confirmed. */
    pickupNote: string | null;
  };
  parking: {
    summary: string;
    details: string | null;
  };
  valet: {
    /** null until confirmed. */
    available: boolean | null;
    details: string | null;
  };
  walking: {
    /** Numbered steps from the drop-off to the venue entrance. Empty until confirmed. */
    steps: string[];
    note: string | null;
  };
  accessibility: {
    /** Numbered step-free (elevator) route. Empty until confirmed. */
    stepFreeRoute: string[];
    note: string | null;
  };
  notices: { title: string; body: string }[];
}

export const directionsConfig: DirectionsConfig = {
  rideshare: {
    dropoffDescription: null,
    dropoffCoordinates: null,
    pickupNote: null,
  },
  parking: {
    summary: 'Parking near the venue is very limited, so we recommend taking a rideshare (Uber or Lyft) instead of driving.',
    details: null,
  },
  valet: {
    available: null,
    details: null,
  },
  walking: {
    steps: [],
    note: null,
  },
  accessibility: {
    stepFreeRoute: [],
    note: null,
  },
  notices: [
    {
      title: 'Another large event nearby',
      body: 'A large event is expected downtown the same day, so please allow extra travel time. More details soon.',
    },
  ],
};
```

`src/config/gallery.ts`:
```ts
export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  photographer: string;
  photoUrl: string;
}

/** Placeholder River Walk photos (free Unsplash license) until the host's own photos arrive. */
export const GALLERY_IS_PLACEHOLDER = true;

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=70`;
}

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: 'river-bridge',
    src: unsplash('1570423024093-1896ade6736b'),
    alt: 'A stone bridge over the San Antonio River Walk',
    photographer: 'Robin LeeAnn',
    photoUrl: 'https://unsplash.com/photos/60eJMAe4LFw',
  },
  {
    id: 'river-footbridge',
    src: unsplash('1616357921792-a6ea1d53e13b'),
    alt: 'People crossing a footbridge on the River Walk on a sunny day',
    photographer: 'Carl Hunley Jr',
    photoUrl: 'https://unsplash.com/photos/lQ02HboejMQ',
  },
  {
    id: 'river-downtown',
    src: unsplash('1692428572326-66edcffafca8'),
    alt: 'The river winding past a tall downtown building',
    photographer: 'Prathibha Murdough',
    photoUrl: 'https://unsplash.com/photos/e3GwZkyIL-0',
  },
  {
    id: 'river-promenade',
    src: unsplash('1656525867077-ca7511adc7ab'),
    alt: 'River Walk promenade lined with buildings and visitors',
    photographer: 'Lesli Whitecotton',
    photoUrl: 'https://unsplash.com/photos/0t2dO-YWkuI',
  },
  {
    id: 'river-skyline',
    src: unsplash('1691171347017-d3d3d7b45a95'),
    alt: 'The river running between downtown San Antonio buildings',
    photographer: 'Thomas Stephan',
    photoUrl: 'https://unsplash.com/photos/QiKzLPX5X2c',
  },
  {
    id: 'river-waterfront',
    src: unsplash('1674491414642-ce5816479852'),
    alt: 'A large building beside the water on the River Walk',
    photographer: 'Valerie Cervantes',
    photoUrl: 'https://unsplash.com/photos/Ek5rjcPxHFo',
  },
];
```

- [ ] **Step 3: Write the failing tests**

Append to `src/lib/dates.test.ts` (add the new names to the import):
```ts
describe('formatLongDate', () => {
  it('formats a date-only string with weekday, month, day, and year', () => {
    expect(formatLongDate('2026-12-05')).toBe('Saturday, December 5, 2026');
  });

  it('returns null for missing or invalid dates', () => {
    expect(formatLongDate(null)).toBeNull();
    expect(formatLongDate('soon')).toBeNull();
  });
});

describe('formatTimeRange', () => {
  it('joins a start and end time with an en dash', () => {
    expect(formatTimeRange('7:00 PM', '11:00 PM')).toBe('7:00 PM – 11:00 PM');
  });

  it('uses the start time alone when there is no end time', () => {
    expect(formatTimeRange('7:00 PM', null)).toBe('7:00 PM');
  });

  it('returns null without a start time', () => {
    expect(formatTimeRange(null, '11:00 PM')).toBeNull();
    expect(formatTimeRange(null, null)).toBeNull();
  });
});
```

`src/lib/venue.test.ts`:
```ts
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
```

`src/lib/maps.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  appleMapsSearchUrl,
  googleMapsEmbedUrl,
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
```

`src/lib/platform.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { isApplePlatform } from '@/lib/platform';

describe('isApplePlatform', () => {
  it('detects iPhone, iPad, and Mac', () => {
    expect(isApplePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(true);
    expect(isApplePlatform('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe(true);
    expect(isApplePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15')).toBe(true);
  });

  it('treats Android and Windows as non-Apple', () => {
    expect(isApplePlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/128.0')).toBe(false);
    expect(isApplePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0')).toBe(false);
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on missing modules / exports.

- [ ] **Step 5: Implement the helpers**

Append to `src/lib/dates.ts`:
```ts
/** "2026-12-05" → "Saturday, December 5, 2026" without shifting across time zones. */
export function formatLongDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** "7:00 PM" + "11:00 PM" → "7:00 PM – 11:00 PM"; the start time alone when there is no end. */
export function formatTimeRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  return end ? `${start} – ${end}` : start;
}
```

`src/lib/venue.ts`:
```ts
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
```

`src/lib/maps.ts`:
```ts
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
```

`src/lib/platform.ts`:
```ts
const APPLE_MARKERS = ['iPhone', 'iPad', 'iPod', 'Macintosh'] as const;

/** Apple devices get Apple Maps links; everything else gets Google Maps. */
export function isApplePlatform(userAgent: string): boolean {
  return APPLE_MARKERS.some((marker) => userAgent.includes(marker));
}
```

- [ ] **Step 6: Run tests, lint, type-check, build, commit**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` (all pass), then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: content config (event, venue, rideshare-first directions, gallery) and map/date helpers"
```

---

### Task 2: Guest-page layout and shared pieces

**Files:**
- Move: `src/app/page.tsx` → `src/app/(site)/page.tsx`; `src/app/rsvp/page.tsx` → `src/app/(site)/rsvp/page.tsx` (use `git mv`)
- Create: `src/app/(site)/layout.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/nav-link.tsx`, `src/components/layout/site-footer.tsx`, `src/components/content/tbd.tsx`
- Modify: `src/app/(site)/rsvp/page.tsx`, `next.config.ts`

**Interfaces:**
- Produces: `SiteHeader()`, `NavLink({ href, children })`, `SiteFooter()`, `Tbd({ value, placeholder? }: { value: string | null | undefined; placeholder?: string })`.

- [ ] **Step 1: Move the guest pages into a route group**

```bash
mkdir -p "src/app/(site)/rsvp"
git mv src/app/page.tsx "src/app/(site)/page.tsx"
git mv src/app/rsvp/page.tsx "src/app/(site)/rsvp/page.tsx"
```
URLs don't change (`/` and `/rsvp`). Remove the now-empty `src/app/rsvp` directory if it remains.

- [ ] **Step 2: Shared components**

`src/components/content/tbd.tsx`:
```tsx
/** Renders a confirmed fact, or a clearly marked placeholder until the host confirms it. */
export function Tbd({ value, placeholder = 'To be announced' }: { value: string | null | undefined; placeholder?: string }) {
  if (value) return <>{value}</>;
  return <span className="text-muted-foreground italic">{placeholder}</span>;
}
```

`src/components/layout/nav-link.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-11 items-center rounded-lg px-3 text-base font-semibold transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
        active ? 'text-primary' : 'text-foreground',
      )}
    >
      {children}
    </Link>
  );
}
```

`src/components/layout/site-header.tsx`:
```tsx
import Link from 'next/link';
import { NavLink } from '@/components/layout/nav-link';
import { siteConfig } from '@/config/site';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" className="font-display text-2xl text-foreground">
          {siteConfig.name}
        </Link>
        <nav aria-label="Main">
          <ul className="flex items-center gap-1">
            <li>
              <NavLink href="/">Home</NavLink>
            </li>
            <li>
              <NavLink href="/rsvp">RSVP</NavLink>
            </li>
            <li>
              <NavLink href="/venue">Venue</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
```

`src/components/layout/site-footer.tsx`:
```tsx
import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        {siteConfig.name} · {siteConfig.venue.name}, {siteConfig.venue.city}, {siteConfig.venue.region} · A private celebration
      </div>
    </footer>
  );
}
```

`src/app/(site)/layout.tsx`:
```tsx
import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
```

- [ ] **Step 3: Tidy the RSVP page**

In `src/app/(site)/rsvp/page.tsx`, remove the `Link` import and the `← {siteConfig.name}` link (the header now provides navigation), and change the header's top margin class from `mt-6 mb-8` to `mb-8`. Nothing else changes.

- [ ] **Step 4: Allow Unsplash images**

Replace `next.config.ts` with:
```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Guest list: host edits in Airtable show up within ~5 minutes; RSVP submits call updateTag('guests').
    guestList: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },
  images: {
    // Placeholder gallery photos (src/config/gallery.ts).
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-**' }],
  },
};

export default nextConfig;
```

- [ ] **Step 5: Verify and commit**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit` (run `npx next typegen` first if `PageProps` types for the moved routes are stale), `npm run build` (route table still lists `/` and `/rsvp`).
```bash
git add -A -- . ':!.claude'
git commit -m "feat: shared header and footer for guest pages via (site) route group"
```

---

### Task 3: Landing page

**Files:**
- Create: `src/components/content/event-details.tsx`, `src/components/content/honorees.tsx`, `src/components/content/gallery-grid.tsx`
- Modify: `src/app/(site)/page.tsx` (replace the stub)

**Interfaces:**
- Consumes: `siteConfig`, `galleryPhotos`, `GALLERY_IS_PLACEHOLDER`, `formatLongDate`, `formatTimeRange`, `formatEventDate`, `venueAddressLines`, `Tbd`, `buttonVariants`.
- Produces: `EventDetails()`, `Honorees()`, `GalleryGrid()`; route `/`.

- [ ] **Step 1: Event details**

`src/components/content/event-details.tsx`:
```tsx
import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { formatEventDate, formatLongDate, formatTimeRange } from '@/lib/dates';
import { venueAddressLines } from '@/lib/venue';

export function EventDetails() {
  const { event, venue } = siteConfig;
  const details = [
    { label: 'Date', value: <Tbd value={formatLongDate(event.date)} /> },
    { label: 'Time', value: <Tbd value={formatTimeRange(event.startTime, event.endTime)} /> },
    {
      label: 'Place',
      value: (
        <>
          <span className="block font-semibold">{venue.name}</span>
          {venueAddressLines(venue).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </>
      ),
    },
    { label: 'Dress code', value: <Tbd value={event.dressCode} /> },
    { label: 'Please RSVP by', value: <Tbd value={formatEventDate(siteConfig.rsvpDeadline)} /> },
  ];

  return (
    <section aria-labelledby="details-heading" className="space-y-4">
      <h2 id="details-heading" className="font-display text-3xl">
        The details
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{detail.label}</dt>
            <dd className="mt-1 text-lg">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

- [ ] **Step 2: Honorees**

`src/components/content/honorees.tsx`:
```tsx
import { siteConfig } from '@/config/site';

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

export function Honorees() {
  const { count, names } = siteConfig.honorees;
  const countWord = NUMBER_WORDS[count] ?? String(count);

  return (
    <section aria-labelledby="honorees-heading" className="space-y-4 text-center">
      <h2 id="honorees-heading" className="font-display text-3xl">
        Celebrating our {countWord} débutantes
      </h2>
      {names.length > 0 ? (
        <ul className="flex flex-wrap justify-center gap-3">
          {names.map((name) => (
            <li key={name} className="rounded-full bg-secondary px-4 py-2 text-lg font-semibold text-secondary-foreground">
              {name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-lg text-muted-foreground italic">Names to be announced</p>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Gallery**

`src/components/content/gallery-grid.tsx`:
```tsx
import Image from 'next/image';
import { GALLERY_IS_PLACEHOLDER, galleryPhotos } from '@/config/gallery';

export function GalleryGrid() {
  return (
    <section aria-labelledby="gallery-heading" className="space-y-4">
      <h2 id="gallery-heading" className="font-display text-3xl">
        On the River Walk
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {galleryPhotos.map((photo) => (
          <li key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {GALLERY_IS_PLACEHOLDER && 'Placeholder photos. '}
        Photos by{' '}
        {galleryPhotos.map((photo, index) => (
          <span key={photo.id}>
            {index > 0 && ', '}
            <a href={photo.photoUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              {photo.photographer}
            </a>
          </span>
        ))}{' '}
        on Unsplash.
      </p>
    </section>
  );
}
```

- [ ] **Step 4: Landing page**

Replace `src/app/(site)/page.tsx` with:
```tsx
import Link from 'next/link';
import { EventDetails } from '@/components/content/event-details';
import { GalleryGrid } from '@/components/content/gallery-grid';
import { Honorees } from '@/components/content/honorees';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { formatLongDate } from '@/lib/dates';

export default function HomePage() {
  const date = formatLongDate(siteConfig.event.date);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-10 sm:py-16">
      <section className="space-y-6 text-center">
        <p className="text-base font-semibold tracking-widest text-primary uppercase">You&apos;re invited</p>
        <h1 className="font-display text-6xl leading-tight sm:text-7xl">{siteConfig.name}</h1>
        <p className="mx-auto max-w-xl text-xl text-muted-foreground">
          {date ? `${date} · ` : ''}
          {siteConfig.venue.name}, {siteConfig.venue.city}
        </p>
        <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
          <Link href="/rsvp" className={buttonVariants({ className: 'h-12 flex-1 text-base' })}>
            RSVP
          </Link>
          <Link href="/venue" className={buttonVariants({ variant: 'outline', className: 'h-12 flex-1 text-base' })}>
            Venue &amp; directions
          </Link>
        </div>
      </section>
      <Honorees />
      <EventDetails />
      <GalleryGrid />
    </main>
  );
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
```bash
git add -A -- . ':!.claude'
git commit -m "feat: landing page with event details, honorees, and River Walk gallery"
```

---

### Task 4: Venue page

**Files:**
- Create: `src/components/content/open-in-maps-button.tsx`, `venue-overview.tsx`, `venue-map.tsx`, `rideshare-card.tsx`, `wayfinding-steps.tsx`, `arrival-options.tsx`, `event-notices.tsx`, `src/app/(site)/venue/page.tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: `siteConfig`, `directionsConfig`, `venueAddressLines`, `venueSingleLine`, `venueMapQuery`, map/rideshare URL helpers, `isApplePlatform`, `Tbd`, `buttonVariants`, `cn`.
- Produces: route `/venue`; `OpenInMapsButton({ query, label, variant? })`.

- [ ] **Step 1: Platform-aware maps button**

`src/components/content/open-in-maps-button.tsx`:
```tsx
'use client';

import { useSyncExternalStore } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { appleMapsSearchUrl, googleMapsSearchUrl } from '@/lib/maps';
import { isApplePlatform } from '@/lib/platform';

const subscribe = () => () => {};

interface OpenInMapsButtonProps {
  query: string;
  label: string;
  variant?: 'default' | 'outline';
}

/** Google Maps link on the server and non-Apple devices; Apple Maps on iPhone, iPad, and Mac. */
export function OpenInMapsButton({ query, label, variant = 'default' }: OpenInMapsButtonProps) {
  const apple = useSyncExternalStore(
    subscribe,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );
  const href = apple ? appleMapsSearchUrl(query) : googleMapsSearchUrl(query);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant, className: 'h-12 w-full text-base' })}>
      {label}
    </a>
  );
}
```

- [ ] **Step 2: Overview, map, rideshare**

`src/components/content/venue-overview.tsx`:
```tsx
import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { venueAddressLines } from '@/lib/venue';

export function VenueOverview() {
  const { venue } = siteConfig;

  return (
    <section aria-labelledby="venue-heading" className="space-y-4">
      <h1 id="venue-heading" className="font-display text-5xl">
        {venue.name}
      </h1>
      <address className="text-lg not-italic">
        {venueAddressLines(venue).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
        <span className="block text-muted-foreground">Inside the Shops at Rivercenter on the River Walk</span>
      </address>
      <p className="text-lg">
        <Tbd value={venue.description} placeholder="More about the venue coming soon." />
      </p>
      <p className="text-lg">
        <span className="font-semibold">Entrance: </span>
        <Tbd value={venue.entranceNote} />
      </p>
    </section>
  );
}
```
(The "Inside the Shops at Rivercenter" line is a verified fact: 849 E Commerce St is the Shops at Rivercenter.)

`src/components/content/venue-map.tsx`:
```tsx
import { siteConfig } from '@/config/site';
import { googleMapsEmbedUrl } from '@/lib/maps';
import { venueMapQuery } from '@/lib/venue';

export function VenueMap() {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-video">
      <iframe
        title={`Map showing ${siteConfig.venue.name}`}
        src={googleMapsEmbedUrl(venueMapQuery(siteConfig.venue))}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
```

`src/components/content/rideshare-card.tsx`:
```tsx
import { OpenInMapsButton } from '@/components/content/open-in-maps-button';
import { Tbd } from '@/components/content/tbd';
import { buttonVariants } from '@/components/ui/button';
import { directionsConfig } from '@/config/directions';
import { siteConfig } from '@/config/site';
import { lyftDropoffUrl, uberDropoffUrl } from '@/lib/maps';
import { venueMapQuery, venueSingleLine } from '@/lib/venue';

export function RideshareCard() {
  const { rideshare } = directionsConfig;
  const { venue } = siteConfig;
  const dropoff = rideshare.dropoffCoordinates;

  return (
    <section aria-labelledby="rideshare-heading" className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="space-y-1">
        <p className="text-base font-semibold">Getting here</p>
        <h2 id="rideshare-heading" className="font-display text-4xl">
          Take a rideshare
        </h2>
      </div>
      <p className="text-lg">{directionsConfig.parking.summary}</p>
      <div className="rounded-xl bg-card p-4 text-card-foreground">
        <p className="text-base">
          <span className="font-semibold">Drop-off: </span>
          <Tbd value={rideshare.dropoffDescription} placeholder="Exact drop-off point coming soon." />
        </p>
        {rideshare.pickupNote && (
          <p className="mt-2 text-base">
            <span className="font-semibold">Ride home: </span>
            {rideshare.pickupNote}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dropoff ? (
          <>
            <a
              href={uberDropoffUrl(dropoff, venue.name, venueSingleLine(venue))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'h-12 w-full text-base' })}
            >
              Request an Uber
            </a>
            <a
              href={lyftDropoffUrl(dropoff)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'h-12 w-full text-base' })}
            >
              Request a Lyft
            </a>
          </>
        ) : (
          <div className="sm:col-span-2">
            <OpenInMapsButton query={venueMapQuery(venue)} label="Open the venue in Maps" variant="outline" />
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Arrival details and notices**

`src/components/content/wayfinding-steps.tsx`:
```tsx
export function WayfindingSteps({ steps, placeholder }: { steps: string[]; placeholder: string }) {
  if (steps.length === 0) {
    return <p className="text-base text-muted-foreground italic">{placeholder}</p>;
  }
  return (
    <ol className="list-decimal space-y-2 pl-6 text-base marker:font-semibold marker:text-primary">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}
```

`src/components/content/arrival-options.tsx`:
```tsx
import type { ReactNode } from 'react';
import { Tbd } from '@/components/content/tbd';
import { WayfindingSteps } from '@/components/content/wayfinding-steps';
import { directionsConfig } from '@/config/directions';

function Option({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-lg font-semibold focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
        {title}
        <span aria-hidden className="text-2xl text-muted-foreground transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <div className="space-y-3 px-4 pb-4 text-base">{children}</div>
    </details>
  );
}

export function ArrivalOptions() {
  const { parking, valet, walking, accessibility } = directionsConfig;
  const valetStatus = valet.available === null ? null : valet.available ? 'Valet is available.' : 'Valet is not offered.';

  return (
    <section aria-labelledby="arrival-heading" className="space-y-4">
      <h2 id="arrival-heading" className="font-display text-3xl">
        More arrival details
      </h2>
      <div className="space-y-3">
        <Option title="Walking from the drop-off">
          <WayfindingSteps steps={walking.steps} placeholder="Step-by-step walking directions coming soon." />
          {walking.note && <p>{walking.note}</p>}
        </Option>
        <Option title="Step-free and elevator route">
          <WayfindingSteps steps={accessibility.stepFreeRoute} placeholder="Step-free route coming soon." />
          {accessibility.note && <p>{accessibility.note}</p>}
        </Option>
        <Option title="Driving and parking">
          <p>{parking.summary}</p>
          {parking.details && <p>{parking.details}</p>}
        </Option>
        <Option title="Valet">
          <p>
            <Tbd value={valetStatus} />
          </p>
          {valet.details && <p>{valet.details}</p>}
        </Option>
      </div>
    </section>
  );
}
```

`src/components/content/event-notices.tsx`:
```tsx
import { directionsConfig } from '@/config/directions';

export function EventNotices() {
  if (directionsConfig.notices.length === 0) return null;

  return (
    <section aria-labelledby="notices-heading" className="space-y-3">
      <h2 id="notices-heading" className="sr-only">
        Event-day notices
      </h2>
      {directionsConfig.notices.map((notice) => (
        <div key={notice.title} className="rounded-xl border-2 border-secondary bg-card p-4">
          <p className="text-lg font-semibold">{notice.title}</p>
          <p className="text-base">{notice.body}</p>
        </div>
      ))}
    </section>
  );
}
```

- [ ] **Step 4: Venue page**

`src/app/(site)/venue/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { ArrivalOptions } from '@/components/content/arrival-options';
import { EventNotices } from '@/components/content/event-notices';
import { RideshareCard } from '@/components/content/rideshare-card';
import { VenueMap } from '@/components/content/venue-map';
import { VenueOverview } from '@/components/content/venue-overview';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Venue & directions · ${siteConfig.name}`,
};

export default function VenuePage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:py-16">
      <VenueOverview />
      <RideshareCard />
      <EventNotices />
      <VenueMap />
      <ArrivalOptions />
    </main>
  );
}
```

- [ ] **Step 5: Update DESIGN.md**

1. §8 "Getting to the venue" / "Page structure": add a note at the top of the section: `Host decision (2026-09-14): parking is very limited, so the page recommends rideshare only. The primary card is "Take a rideshare"; Uber and Lyft buttons appear once directionsConfig.rideshare.dropoffCoordinates is set (never guessed), and until then an "Open the venue in Maps" button is shown. Parking and valet are secondary collapsible sections.`
2. §8 Landing: add `Five honorees (names to be announced). Placeholder River Walk photos from Unsplash (credited) until the host's photos arrive. Every unconfirmed fact renders "To be announced" from config.`
3. §10 tree: `app/(site)/` group containing `page.tsx`, `rsvp/page.tsx`, `venue/page.tsx`, `layout.tsx`; `components/layout/` with `site-header.tsx`, `nav-link.tsx`, `site-footer.tsx`; `components/content/` with the components from this phase (replace the old list; `schedule-list.tsx` and `parking-info.tsx` are not built — parking is a section of `arrival-options.tsx`); `config/gallery.ts`; `lib/venue.ts`, `lib/maps.ts`, `lib/platform.ts`.

- [ ] **Step 6: Verify**

Run: `npm test`, `npm run lint` (0 warnings), `npx tsc --noEmit`, `npm run build` (route table lists `/`, `/rsvp`, `/venue`, all static or partially prerendered).

Start `npm run start` in the background and check the gate still covers the new page:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/venue
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/
```
Expected: `307 http://localhost:3000/unlock?next=%2Fvenue` and `307 http://localhost:3000/unlock?next=%2F`. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add -A -- . ':!.claude'
git commit -m "feat: venue page with rideshare-first arrival guidance and map"
```

- [ ] **Step 8: Human check (controller asks the user)**

On a phone after unlocking:
1. Home: "You're invited", Day of the Deb, RSVP and Venue buttons, "Celebrating our five débutantes / Names to be announced", details show "To be announced" for date/time/dress code/RSVP by, and the address; six River Walk photos load with credits.
2. Header links (Home / RSVP / Venue) work and highlight the current page.
3. Venue: address + "Inside the Shops at Rivercenter", pink "Take a rideshare" card, drop-off "coming soon", "Open the venue in Maps" opens Apple Maps on iPhone / Google Maps on Android at Mexico Ceaty; the large-event notice; the map shows the venue; the four collapsible sections open and show their placeholders.
4. RSVP confirmation's "Venue & directions" button now lands on this page.

---

## Phase 5 Done When

- All unit tests, lint, tsc, and build pass; `/venue` is gated.
- The human check passes.
- DESIGN.md reflects the rideshare-first decision, honorees, placeholders, and structure.

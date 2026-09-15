# Débutante RSVP Site: Design Document

Engineering spec for a private, invite-only RSVP website for a debutante celebration at Mexico Ceaty, San Antonio. This document is the source of truth for implementation. Hand it to Claude Code as the working spec.

---

## 1. Overview

A private website where invited guests can RSVP for themselves and their household. Guests reach the site from a URL printed on a physical, mailed invitation. The site is gated by a single shared password (also printed on the invitation). Once inside, a guest searches their own name to find their household, then marks each member attending or not, including any attached plus-ones. A password-protected admin area lets the host view responses and export the current guest list as CSV.

### Scale

- ~250 invitations (households)
- ~700 to 800 named guests total
- Traffic is not simultaneous. Worst-case RSVP burst is ~100 responses spread over the response window, never concurrent.
- Two soft traffic events: the invite drop (reads plus a modest write burst) and party night (read-only content views).

### Non-goals

- No meal selection. The venue is a private food court; guests choose their own food on the night.
- No guest-facing accounts, logins, or per-guest credentials. Access is one shared site password plus name identification.
- No payments, registry, or ticketing.
- No real-time features. A short cache staleness window is acceptable everywhere.

---

## 2. Tech stack

- **Next.js** (App Router) with **React Server Components**, deployed on Vercel.
- **TypeScript** throughout.
- **Tailwind CSS v4** for styling.
- **shadcn/ui** as the component primitive layer, themed via CSS variables.
- **next-themes** as the theme provider.
- **Airtable** as the datastore and source of truth, accessed server-side via a personal access token.
- **papaparse** (CSV) and optionally **SheetJS / xlsx** for export.

---

## 3. Architecture principles

These are the rules that keep the app simple, fast, and safe. They should hold across the whole codebase.

**Server-first.** Pages and content routes are Server Components that fetch on the server. Only genuinely interactive leaves carry `'use client'`: the search input, the roster form, the yes/no toggle, the plus-one field. Pages stay thin and compose small components; they never become large stateful files.

**Hard server-only data boundary.** Everything that touches the Airtable token lives under `lib/airtable` and `server/actions`, and those modules import the `server-only` package so an accidental client import fails the build. Client components never call Airtable directly. They invoke server actions. The token must never appear in a client bundle.

**Cache the list, search in memory.** The full guest list is small (a few hundred KB of JSON). It is fetched once and cached server-side; search runs against the cached copy. The Airtable API is never in the hot path of a page view. This is what makes a spreadsheet-class backend safe at this scale.

**Search runs on the server.** The client never receives the full guest list. The search form calls a server action that searches the cached list server-side and returns only matching households. This prevents anyone from scraping all guest names out of the JS bundle, which matters because names would otherwise be a weak identifier.

**Pure logic separated from I/O.** Name normalization and matching are pure functions with no network dependency, so they are unit-testable in isolation. The same applies to the CSV unpivot.

**Tokens, not hex.** Colors are referenced through semantic Tailwind tokens (`bg-primary`, `text-foreground`), never hardcoded hex values. Swapping the palette is a single edit to the token block in `globals.css`.

---

## 4. Data model

### Airtable base: two linked tables

**Invitations** (one record per invite, ~250)

| Field | Type | Notes |
|---|---|---|
| Household | Single line text (primary) | Display label, e.g. "The Biggs Family". Cosmetic only, never used as a key. |
| Contact Email | Email | Optional, one per household. Entered by the guest on the RSVP page (not by the host); used for deadline reminders and schedule-change notices. Never sent to the browser — the roster projection carries only a `hasEmailOnFile` flag. |
| Address / City / State / Zip | Single line text | Mailing address for the printed invitation. Host reference and CSV export only; the site never reads them. |
| Expected Size | Number | Optional headcount for the host's own tracking. |
| Notes | Long text | Optional, host-facing. Not read by the site. |
| Guests | Link to Guests | The household roster (auto-created reverse of the Guests link). |

Household-level totals (people coming, response rate) are computed in the app from the cached list, not stored as Airtable rollups. See Section 7.

**Guests** (one record per named person, ~800)

| Field | Type | Notes |
|---|---|---|
| Name | Single line text (primary) | e.g. "Marco Biggs". |
| Invitation | Link to Invitations | The join back to the household. This is what the host picks from a dropdown when adding a guest. |
| Alt Names | Single line text | Comma-separated nicknames / accent-free spellings for search matching (e.g. "Hector" for "Héctor", "Sue" for "Susan"). |
| Has Plus One | Checkbox | Host-set eligibility: may this guest bring a plus-one. The site reveals a plus-one name input only for an eligible guest who is attending. Not everyone is eligible (the Biggs kids are, the parents are not). |
| Attending | Single select: Yes / No | Set by the site at RSVP. Empty means no response yet. |
| Plus One Name | Single line text | The plus-one's name, captured at RSVP when an eligible attending guest brings someone. A filled value is what counts a +1 toward the headcount. Hosts may pre-fill if known. |
| Responded At | Date | Set by the site on submit. |

A plus-one is not its own record. It is a checkbox plus a name on the named guest's own row. This resolves the earlier boolean-vs-name question: the name is captured (via Plus One Name), and there are no separate or placeholder +1 rows for hosts to manage. If a guest's date is known ahead of time and you want them treated as a full guest, just add them as their own named row instead.

The base already exists in Airtable with these two tables, and hosts enter invitations and guests into it directly; there is no spreadsheet import step. The app connects to it via `AIRTABLE_BASE_ID`.

The 1,000-record free-tier cap is crossed by design at full data (~1,050 records across both tables, counted per base). Upgrade to Team before the real list grows past the cap, not after hitting the wall, because records past the cap silently fail to insert.

### Domain types (`types/domain.ts`)

```ts
export type Attendance = 'yes' | 'no' | null;

export interface Guest {
  id: string;
  name: string;
  altNames?: string[];
  hasPlusOne: boolean;   // host-set: may this guest bring a plus-one
  attending: Attendance;
  plusOneName?: string;  // captured at RSVP when they bring one; filled => counts a +1
  respondedAt?: string;  // YYYY-MM-DD, set by the site on submit
}

export interface Invitation {
  id: string;
  household: string;
  email?: string;
  guests: Guest[];
}
```

The Airtable mappers in `lib/airtable` translate records to these types. The rest of the app depends only on the domain types, never on Airtable record shapes.

The app addresses Airtable by table and field IDs (`lib/airtable/fields.ts`), so renaming a column in the Airtable UI does not break the site. Adding or removing a field the site reads requires updating that file.

---

## 5. Access control

Three independent layers. Keep their responsibilities distinct.

### Layer 1: Site gate (shared password, printed on the invitation)

The real security boundary. Gates the entire site.

- `src/proxy.ts` (Next 16's name for middleware; Node runtime) checks a sealed `site_session` cookie on every route except the unlock page, the unlock endpoint, and static assets.
- Missing or invalid cookie redirects to `/unlock?next={originalPath}`.
- The `/unlock` page is a client form that posts the entered password to a server action (`unlockSite`). Validation happens server-side against `SITE_PASSWORD` using a constant-time comparison. On success it sets a signed, httpOnly, secure, `sameSite=lax` cookie (HMAC with `AUTH_SECRET`) with an expiry covering the response window (~45 days), then redirects to `next`.
- The password is never sent to or checked on the client.

### Layer 2: Household identification (name search)

Not a security boundary. Runs entirely behind Layer 1. Identifies which household the visitor belongs to so they can RSVP. Because a stranger cannot pass Layer 1 without the printed password, guessable names are no longer a risk here.

### Layer 3: Admin gate (separate, stronger password)

Protects the guest list and export from ordinary guests, all of whom hold the site password.

- The proxy decides admin paths (/admin, /admin/*, /api/export) before the site gate. The admin password alone grants access (host decision): /admin/login is public, other admin pages redirect to /admin/login?next=…, and /api/export answers 401 without a valid admin_session cookie.
- /admin/login posts to an adminLogin server action validating ADMIN_PASSWORD (exact, constant-time, at least 4 characters) and sets a sealed admin_session cookie (7 days). A site session never grants admin and vice versa.
- requireAdminSession() runs before any admin data read and at the start of every admin server action; the export route validates the admin cookie itself.

### Security requirements

- All password checks are server-side. Constant-time comparison for both passwords.
- Cookies: signed (HMAC via `AUTH_SECRET`), httpOnly, secure, `sameSite=lax`.
- Rate-limit the unlock and admin-login endpoints. In-memory counters do not work on Vercel (each serverless instance has its own memory), so use Upstash Redis if limiting is added.
- The proxy matcher must exclude `/_next/static`, `/_next/image`, `favicon`, `/unlock`, and the unlock endpoint to avoid redirect loops.
- Consider `iron-session` to handle both sessions cleanly rather than hand-rolling cookie signing.
- The submit-rsvp action must verify that every submitted guest ID belongs to the submitted invitation before writing, and every server action re-checks the site session itself rather than relying on the proxy alone.
- Every server action except `unlockSite` calls `requireSiteSession()` (in `lib/auth.ts`) as its first line.

### Interaction with caching and party-night traffic

The proxy runs per request (Node runtime) and only unseals a cookie, which is cheap. Static and ISR content stays cached; the gate does not defeat it. Once a guest unlocks, the cookie persists, so party-night repeat visits are one cookie check plus cached static HTML. The whole-site gate does not compromise the party-night performance profile.

---

## 6. RSVP flow

The visual flow is demonstrated in the standalone HTML prototype delivered earlier. Production differs in three ways: the whole flow lives on a single generic route (`/rsvp`) with no per-household URL, search is server-side (see Architecture), and the plus-one is a checkbox-plus-name on the named guest rather than a separate row (see step 5). Behavior to implement:

1. **Unlock.** Guest enters the site password (Layer 1). On success, continues to the landing page.
2. **Search.** Guest types the first and last name of one member of their party. The search matches against member names and alt-names, not the household label. It returns every household containing a match.
3. **Disambiguate.** If multiple households match a surname (e.g. three separate "Reyes" parties), each is shown as a selectable row previewing its named roster. The guest selects the correct one.
4. **Roster.** The household's named guests are listed, each with a Yes / No control. Empty means no response yet.
5. **Conditional plus-one.** For a guest whose `hasPlusOne` is checked, marking them attending reveals a "bringing a guest?" toggle; choosing yes reveals a name input that saves to `plusOneName`. If the guest flips to No (or answers no to the toggle), the name clears. Guests without `hasPlusOne` never see this. This is the only genuinely conditional piece of interaction in the app.
6. **Tally.** A live headcount sums attending guests plus one for each attending guest with a filled `plusOneName`. This number is exactly what the caterer export counts.
7. **Submit.** A server action validates the payload and upserts the household's guest records in Airtable: it writes `attending`, writes or clears `plusOneName`, sets `Responded At`, then calls updateTag('guests') (read-your-own-writes) so a re-search shows fresh data. Because it upserts, the same action serves both a first response and an edit. If the guest also entered a household email, the action writes it to the invitation's `Contact Email` field as a separate, best-effort step (a failure there does not fail the RSVP); the address itself is never sent to the browser, before or after — the roster projection only ever carries whether one is on file.
8. **Confirmation.** A summary of who is coming, with a note that they can search their name again anytime to update their response.

### One route, client-driven

The entire sequence above happens on `/rsvp`; there is no `/rsvp/[household]` URL. `rsvp/page.tsx` is a thin server shell that renders a client `rsvp-flow.tsx`, which owns the current step (search, results, roster, confirmation) in local state. The matched households and their rosters come back from the `searchGuests` server action and are held in that state, so selecting a household is a state change, not a navigation. This is the one place the app leans client-side rather than server-first, which is appropriate for a short multi-step wizard. The server-only data boundary still holds, because every read and write goes through a server action, never a direct Airtable call from the client.

Server actions return a RosterHousehold projection (id, household, and per guest: id, name, hasPlusOne, attending, plusOneName); contact emails, alt names, and response dates never reach the browser. submitRsvp requires exactly one answer per guest on the invitation.

### Name matching

Normalize both the query and the stored names before comparing: lowercase, strip accents, trim, and include the `altNames` list. This handles accents (Héctor vs Hector), nicknames (Sue vs Susan), and casing. Implemented as pure functions in `lib/search.ts`.

A query needs at least two words of two or more letters; each word must start a different word of the guest's name or alt names ("Dan Reyes" finds "Daniel Reyes"); apostrophes and periods are ignored and hyphens split words. The household label is not searched. Results are ranked (exact whole-word matches first) and capped at 10, and when more match the site asks the guest to type more of their name. There is no typo tolerance, so alt names matter.

### Editing an existing RSVP

Editing is not a separate feature or screen. A guest who wants to change an answer goes through the exact same path: unlock (or an unexpired cookie), search their name, select their household. The roster loads pre-populated from the cached list with their current answers (each guest's `attending`, and any `plusOneName`), so they see where they left off. They change whatever they want and resubmit; the submit action upserts, overwriting the previous values and refreshing `Responded At`. No edit tokens, no separate route, no distinct UI. The only implementation requirement beyond the first-time flow is that the roster hydrate from current values rather than render blank. The confirmation copy already invites this ("search your name again anytime to update").

## 7. Admin and export

Everything lives under a single `/admin` page behind the admin password (Layer 3). There is no separate summary route and no caterer code: anyone who needs to see responses, including the caterer, gets the admin password. The page is view-and-export only, so sharing that password lets someone read and download the list but never change it.

The page has four parts:

- **Guest table.** The whole list, rendered from the cache, with attending status, plus-one, and response state per guest. Filtering is client-side: by attending / declined / no-response, by household, and a name search. Because the full list is already cached, all filtering is instant and hits no API, so the admin never waits on Airtable. If the row count ever feels heavy in the DOM, virtualize or client-paginate the rendered rows; this is a UI nicety, not an API concern.
- **Download CSV button.** Two downloads from /api/export. The headcount CSV (default) has one row per person coming: Name, Household, Type (Guest or Plus-one), Guest Of, Responded; its row count equals the headcount. The full guest list CSV (?scope=all) has every guest with Status and counted Plus One. Both neutralize spreadsheet formulas per cell (`neutralizeCell` in `lib/admin/export-csv.ts`, covering values with embedded line breaks) and include a UTF-8 byte-order mark for Excel. Plus-one names are whitespace-normalized on write (`lib/plus-one.ts`), so a guest-typed newline or tab never reaches the stored name or the export.
- **Stats summary (top).** A headline number and a few supporting stats, all computed in the app from the cached list. No Airtable rollups. See below.
- **Link to Airtable (bottom).** A link to the base in Airtable, for when the host wants to edit directly. This is the base link, gated by Airtable's own collaborator auth, not a public shared-view link. A visitor who is not an invited Airtable collaborator hits Airtable's permission wall, so the link exposes nothing even though the admin page itself is only password-protected.

### Response stats

All derived on the server from the cached list, a few `reduce`s over data already in memory, no schema changes. The one rule that matters: "how many people are coming" and "how many have responded" are different numbers with different denominators, and mixing them produces nonsense. Keep them separate.

- **People coming (headline).** Count guests with `attending === 'yes'`, then add one for each attending guest with a non-empty `plusOneName`. This is the caterer/venue headcount, and it is where the guest-plus-one combination is resolved.
- **Response rate, by household.** Answered households over total households (a household counts as answered once any member has a non-null `attending`, or per your chosen rule). Households is the actionable denominator because the host chases families, not individuals. Plus-ones never enter this denominator: a plus-one does not RSVP, the named guest answers for them. Never divide by headcount, or the denominator grows as plus-ones arrive and the percentage misbehaves.
- A household counts as responded once any member's attending is non-null.
- **Duplicate names.** The admin page lists guest names that appear in more than one household so the host can make those household names easy to tell apart.
- **Breakdown.** Yes / No / awaiting, as plain counts.
- **Plus-ones.** How many are coming (attending guests with a filled `plusOneName`) out of how many were offered (guests with `hasPlusOne` checked). Fun, and it sanity-checks the headcount.
- **Time-based (optional, free from `Responded At`).** Responses in the last 7 days, the date of the most recent RSVP, or a small response-over-time line.

A people-level rate ("620 of 800 guests answered") is fine to show too if you prefer a bigger denominator for a progress bar; just label it clearly so it is not read as the headcount.

---

## 8. Content pages

All informational content lives on two routes: the landing page (`/`) and the venue page (`/venue`). Both are Server Components with no data fetching; their content comes from typed config, not Airtable, so they render static / ISR and stay edge-cached. They sit behind the site password (Layer 1) like everything else, but the gate is only a cheap cookie check and does not defeat caching, so they stay fast during party-night and arrival-time traffic.

**Landing (`/`)** is the general front door: the event basics (date, time, dress code), an optional `next/image` gallery strip, and clear links into the RSVP flow and the venue page. Schedule and dress-code detail live here as sections, not separate routes. The landing links to `/rsvp`; it does not itself hold the search. Five honorees (names to be announced). Placeholder River Walk photos from Unsplash (credited) until the host's photos arrive. Every unconfirmed fact renders "To be announced" from config.

**Venue (`/venue`)** opens with a short overview of Mexico Ceaty (what the place is, the private food-court concept, a hero image (deferred until the host's photos arrive), the address, a map), then continues into the arrival logistics, which are the substantial part of the page and are described next.

### Getting to the venue

Host decision (2026-09-14): parking is very limited, so the page recommends rideshare only. The primary card is "Take a rideshare"; Uber and Lyft buttons appear once directionsConfig.rideshare.dropoffCoordinates is set (never guessed), and until then an "Open the venue in Maps" button is shown. Parking and valet are secondary collapsible sections.

Arrival at a downtown Riverwalk venue is genuinely complex: parking is in garages rather than a lot, the Riverwalk sits below street level so GPS often misroutes to the wrong level, and guests span every age and comfort with navigation. This lower part of the venue page moves a guest from "in the car" to "at the entrance" with as little reading as possible. It stays a clearly-marked section of its own so none of that arrival detail is lost by folding it into the venue page.

### Content model

All arrival content is typed data in `config/directions.ts`, rendered by small presentational components. No fetching, and no state beyond collapsible sections. Correcting a garage rate or a step is a config edit, not a component change.

### Page structure (mobile-first, progressive disclosure)

The reader is often in a car, so the essential action comes first and detail collapses below it.

1. **Primary action up top.** One unmissable "Navigate to parking" button that deep-links into the guest's maps app. This is the most important decision on the page: the deep link targets the parking garage, not the venue, because routing to a Riverwalk-level address frequently strands people at the wrong level. A secondary "Navigate to the venue entrance" link is there for rideshare and walking.
2. **Map.** The venue and recommended garage shown via the Google Maps embed from the original stack decision.
3. **Arrival options.** A short accordion or card set, one per mode: driving and parking, valet if offered, rideshare drop-off, and walking from nearby hotels. Each expands to its specifics.
4. **Parking detail.** The recommended garage or garages by name and address, approximate rate, and which to prefer, all from config so they are trivial to correct.
5. **Wayfinding once parked.** Numbered steps for the walk from the garage to the entrance, including the level change from street level down to River level. This is the part a map cannot convey.
6. **Accessibility.** The step-free, elevator route stated explicitly, since the Riverwalk has stairs and not every guest can take them.

### Components (`components/content/`)

- `open-in-maps-button.tsx`: builds a platform-aware deep link (Apple Maps on iOS, Google Maps otherwise) to a coordinate or address. Used twice, for the parking target and the venue target.
- `arrival-options.tsx`: the per-mode accordion or cards.
- `parking-info.tsx`: garages rendered from config.
- `wayfinding-steps.tsx`: the numbered arrival steps.
- `venue-map.tsx`: shared with the Venue page.

### Host-supplied content

The page's structure is fixed; its facts come from the host or planner and must not be guessed. Gather before build:

- The exact venue entrance and address, plus the coordinate to hand a GPS for the entrance.
- Recommended parking garage(s): name, address, approximate rate, and the coordinate to navigate to.
- Whether valet is offered, its cost, and where it is.
- The rideshare drop-off point that lands closest to the entrance.
- The step-by-step route from the recommended garage to the entrance, including any level change.
- The step-free, accessible route.
- Any event-day quirks: road closures, a hotel block guests walk from, after-hours mall entrances.

I can research typical Rivercenter and downtown parking to pre-fill sensible defaults, but the host must confirm specifics, since rates, valet arrangements, and the closest entrance change and only they know what has been booked.

---

## 9. Theme and design system

### Mechanism

Tailwind v4 plus shadcn theme via CSS variables. The palette lives as `:root` (and `.dark`, if used) token blocks in `globals.css`, mapped to Tailwind color utilities with the `@theme inline` directive that `shadcn init` scaffolds. `next-themes` provides the `ThemeProvider` in the root layout; set `suppressHydrationWarning` on `<html>` and never read the theme during SSR. Tokens use OKLCH (the shadcn v4 default); Tailwind v4 opacity modifiers (`bg-primary/10`) work with any color format. Do not edit generated shadcn primitives in `components/ui`; wrap them so CLI updates do not clobber changes.

### Palette (Mexican fiesta, mapped to semantic roles)

| Token | Color | Hex |
|---|---|---|
| `--primary` | Fiesta Hot Pink (deepened for contrast) | #C2127A (originally #E91E8C) |
| `--secondary` / `--accent` | Marigold Orange | `#D48000` |
| cool contrast (links, secondary buttons) | Altar Cobalt Blue | `#1565C0` |
| `--foreground` (grounding ink) | Deep Fiesta Red | `#6A0008` |
| success / confirmation accent | Mexico Green | `#008030` |
| `--background` | warm bone / cream | pick a warm off-white, not pure white |

Turquoise and a sunny yellow are available as secondary accents. Because everything references tokens, the palette can be retuned during development by editing this one block.

### Fonts

Pair a display serif with a clean sans using `--font-display` and `--font-sans` (the shadcn/Tailwind v4 default name). The prototype used Fraunces for display and a humanist sans for body; carry that pairing unless the host's invitation suite suggests otherwise.

---

## 10. File and component structure

```
src/
├─ app/
│  ├─ layout.tsx                    # fonts + ThemeProvider + shell (thin)
│  ├─ globals.css                   # Tailwind v4 + shadcn tokens, palette lives here
│  ├─ unlock/page.tsx               # site password gate (Layer 1)
│  ├─ (site)/
│  │  ├─ layout.tsx                 # header + footer shell for content pages
│  │  ├─ page.tsx                   # general landing: event basics, gallery, links to RSVP + venue
│  │  ├─ rsvp/page.tsx              # RSVP flow on one route: search, select, roster, submit (client-driven)
│  │  └─ venue/page.tsx             # venue overview + map + getting-here (rideshare, parking, wayfinding, accessibility)
│  ├─ admin/
│  │  ├─ login/page.tsx             # admin password gate (Layer 3)
│  │  └─ page.tsx                   # full guest list + filtering + export + Airtable link
│  └─ api/export/route.ts           # CSV/xlsx download (admin-guarded)
├─ components/
│  ├─ ui/                           # shadcn primitives (generated), do not hand-edit
│  ├─ rsvp/
│  │  ├─ rsvp-flow.tsx              # client: owns the step (search → results → roster → done)
│  │  ├─ name-search-form.tsx       # client: input + submit (calls search action)
│  │  ├─ search-results.tsx         # match list
│  │  ├─ result-card.tsx            # one household row (roster preview)
│  │  ├─ guest-roster.tsx           # client: hydrates from current answers, owns state
│  │  ├─ guest-row.tsx              # one guest: name + toggle
│  │  ├─ yes-no-toggle.tsx          # segmented control
│  │  ├─ plus-one-field.tsx         # conditional +1 name input (Has Plus One + attending)
│  │  ├─ party-tally.tsx            # headcount
│  │  └─ rsvp-confirmation.tsx      # summary
│  ├─ content/
│  │  ├─ tbd.tsx                    # renders a confirmed fact or a "to be announced" placeholder
│  │  ├─ gallery-grid.tsx
│  │  ├─ venue-overview.tsx         # venue name, address, description, entrance note
│  │  ├─ venue-map.tsx              # map + pin(s) on the venue page
│  │  ├─ rideshare-card.tsx         # primary "Take a rideshare" card; Uber/Lyft or Open in Maps
│  │  ├─ arrival-options.tsx        # collapsible sections: walking / step-free / parking / valet
│  │  ├─ wayfinding-steps.tsx       # numbered steps, drop-off to entrance
│  │  ├─ event-notices.tsx          # event-day notices (e.g. nearby large event)
│  │  └─ open-in-maps-button.tsx    # platform-aware deep link (Apple Maps vs Google Maps) to the venue
│  ├─ admin/
│  │  ├─ admin-dashboard.tsx        # composes header, stats, exports, duplicates, table (server)
│  │  ├─ admin-header.tsx           # title + refresh + sign-out
│  │  ├─ refresh-button.tsx         # client: calls refreshGuestList, then router.refresh()
│  │  ├─ stats-summary.tsx          # headline headcount + response stats (computed)
│  │  ├─ export-buttons.tsx         # the download-CSV buttons (headcount + full list)
│  │  ├─ duplicate-names.tsx        # same-name-in-multiple-households notice
│  │  ├─ guest-table.tsx            # client: filterable guest table
│  │  ├─ guest-table-filters.tsx    # client: search / status / household controls
│  │  └─ status-badge.tsx           # attending / declined / awaiting pill
│  ├─ auth/
│  │  ├─ unlock-form.tsx            # client: site password entry
│  │  └─ admin-login-form.tsx       # client: admin password entry
│  ├─ layout/
│  │  ├─ site-header.tsx            # nav (Home / RSVP / Venue)
│  │  ├─ nav-link.tsx               # header link, highlights the current page
│  │  └─ site-footer.tsx
│  └─ theme-provider.tsx            # next-themes wrapper (client)
├─ lib/
│  ├─ airtable/
│  │  ├─ client.ts                  # server-only Airtable client (token)
│  │  ├─ fields.ts                  # table + field IDs
│  │  ├─ invitations.ts             # read mappers: records -> domain types
│  │  └─ rsvp.ts                    # write mapper + ownership validation
│  ├─ guest-list.ts                 # cached fetch of the whole list (server-only)
│  ├─ search.ts                     # pure normalize + match (no I/O, unit-tested)
│  ├─ auth.ts                       # server-only: password checks, getSiteSession, requireSiteSession
│  ├─ session.ts                    # iron-session options + seal check (proxy-safe)
│  ├─ env.ts                        # lazy env getters (proxy-safe; no Airtable token here)
│  ├─ routes.ts                     # pure: public paths, safe redirect
│  ├─ admin/
│  │  ├─ stats.ts                   # pure: computeStats (response summary numbers)
│  │  ├─ guest-rows.ts              # pure: guest table rows, filters, duplicate-name check
│  │  └─ export-csv.ts              # pure: rows -> CSV records for /api/export
│  ├─ plus-one.ts                   # shared plus-one rule
│  ├─ roster-view.ts                # RosterHousehold projection sent to the browser
│  ├─ roster-state.ts               # pure roster reducer, headcount, validation
│  ├─ rsvp-input.ts                 # parses untrusted submit input
│  ├─ dates.ts                      # date formatting
│  ├─ venue.ts                      # pure: venue address lines, single line, map query
│  ├─ maps.ts                       # pure: Google/Apple Maps and Uber/Lyft deep-link builders
│  ├─ platform.ts                   # pure: isApplePlatform(userAgent)
│  └─ utils.ts                      # cn(), shadcn helpers
├─ server/actions/
│  ├─ unlock-site.ts                # 'use server': validate site password, set cookie
│  ├─ admin-login.ts                # 'use server': validate admin password, set cookie
│  ├─ search-guests.ts              # 'use server': search cached list, return matches
│  ├─ submit-rsvp.ts                # 'use server': validate, upsert (first RSVP or edit), revalidateTag
│  └─ refresh-guest-list.ts         # 'use server': admin-only, updateTag(GUEST_LIST_TAG)
├─ proxy.ts                         # Layer 1 + Layer 3 cookie gates (Next 16 middleware)
├─ types/
│  ├─ domain.ts                     # Invitation, Guest, Attendance
│  └─ rsvp.ts                       # client-safe RSVP types and action results
└─ config/
   ├─ site.ts                       # event name, date, venue, deadline (one source)
   ├─ gallery.ts                    # placeholder River Walk photos (Unsplash, credited)
   └─ directions.ts                 # typed arrival, parking, wayfinding content
```

### Conventions

- One component, one job. Soft ceiling of ~150 lines per file. This is what forces the roster to decompose into row, toggle, plus-one-field, and tally rather than becoming one large form.
- Pages do data loading and composition only. No business logic in `page.tsx` files.
- All event copy (name, date, venue, RSVP deadline) comes from `config/site.ts`, never hardcoded in components.

---

## 11. Caching and revalidation

- `lib/guest-list.ts` wraps the Airtable fetch in a `'use cache: remote'` function (shared across Vercel instances) with `cacheTag('guests')` and a `cacheLife` of a few minutes.
- The cache profile `guestList` (next.config.ts) is stale 60s / revalidate 300s / expire 3600s.
- The fetch must page through the Airtable list endpoint, which returns at most 100 records per request plus an `offset` token for the next page. Loop until no offset comes back, or the cache will silently hold only the first 100 guests. At ~1,050 records that is ~11 sequential requests inside the 5-per-second per-base limit, and it runs once per revalidation, not per page view.
- Reads (search, roster, admin, export) all draw from this cached list.
- `submit-rsvp` calls `updateTag('guests')` after writing, so a guest who re-searches to edit sees their own update.
- Host edits made directly in Airtable surface on the next revalidation window (a few minutes is acceptable). Optionally add a manual "refresh" affordance on the admin page that calls `updateTag('guests')` (admin-only server action).

---

## 12. Environment variables

```
AIRTABLE_TOKEN=            # personal access token, scoped to the base
AIRTABLE_BASE_ID=
SITE_PASSWORD=            # shared, printed on the invitation
ADMIN_PASSWORD=           # admin area: host, planner, caterer (at least 4 characters)
AUTH_SECRET=             # HMAC key for signing session cookies
```

All are server-only. None are prefixed `NEXT_PUBLIC_`.

---

## 13. Deferred decisions

These do not block scaffolding.

- **Alt-names population.** The `altNames` field must be seeded for common nicknames and accented names, or search will miss real guests. Decide who populates it during list entry.
- **Max party size.** Six named guests per invitation is the current maximum (from the couple-plus-two-kids case). Confirm none exceed this.
- **Private photos.** The proxy matcher skips `/_next/static` and `/_next/image`, so statically imported or optimized images are reachable by URL without the site password. Before building the gallery, decide: accept public-by-URL photos, or serve private photos through a gated route handler.
- **Password strength and rate limiting.** The printed site password is the only real security boundary and is matched case-insensitively. Before printing, either choose a high-entropy passphrase (e.g. three random words) or add Upstash rate limiting to `unlockSite`; decide before the printer deadline, not in Phase 7.
- **Expired session during a form submit.** The proxy answers a POST with a 307 to /unlock, which surfaces as a confusing action error. Revisit in the RSVP phase (e.g. 401 for requests carrying a `Next-Action` header).

Resolved: the plus-one model. A plus-one is a `Has Plus One` checkbox (host eligibility) plus a `Plus One Name` captured at RSVP, both on the named guest's row. There are no separate +1 records, so the earlier boolean-vs-name and pre-seeding questions no longer apply.

---

## 14. Suggested build phases

1. **Scaffold.** Next + TS + Tailwind v4, `shadcn init`, theme tokens and `ThemeProvider`, `config/site.ts`, domain types.
2. **Data layer.** Airtable client, read/write mappers, `guest-list` cache, pure `search` module with unit tests.
3. **Site gate (Layer 1).** `proxy.ts`, `/unlock`, `unlock-site` action, cookie signing in `lib/auth`.
4. **RSVP flow.** Search action and form, results, roster with conditional plus-one, submit action (upsert), confirmation. The returning-guest edit is the same flow: the roster hydrates from current answers and resubmitting overwrites them, so it needs no extra work beyond that hydration.
5. **Admin (Layer 3), stats, and export.** Admin login, admin page with the computed stats summary and the filterable guest table, guarded export route with CSV unpivot.
6. **Content pages.** The landing page (event basics, gallery, links) and the venue page (overview, map, and the getting-here section: arrival options, parking, wayfinding, accessibility). Static / ISR, content from `config`.
7. **Polish.** Optional confirmation email, rate limiting on auth endpoints, mobile QA across the age range of the guest list, dry run of the invite drop against seeded test data.

---

## 15. Testing notes

- The pure `search` module gets unit tests covering accents, nicknames, partial matches, and multi-household surname collisions.
- The plus-one conditional logic gets a test: for a guest with `hasPlusOne`, toggling attendance reveals and clears the name input, and the headcount counts a +1 only when `plusOneName` is filled.
- Editing gets a test: re-searching a household hydrates the roster with its current answers, and resubmitting overwrites them and refreshes `Responded At`.
- Stats get a test: the response-rate denominator is households (or named guests), never the headcount, and plus-ones are excluded from it.
- Before the real list is entered, run the full flow end to end against the seeded example households in the base (Biggs with its two plus-one states, Musgrove, Reyes, Hunter), which exercise the structural variations.
- Run `npm run test:airtable` to check reads, search, and a restoring write round-trip against the real base.
- Do a rehearsal of the invite drop on staging. This is a one-shot event with no second chance on invite night.
```

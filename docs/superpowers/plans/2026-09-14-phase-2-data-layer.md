# Phase 2: Data Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Read the whole guest list from Airtable into domain types, cache it across server instances, search it by name on the server, and turn an RSVP submission into validated Airtable record updates.

**Architecture:** A small server-only Airtable REST client (`fetch`, injectable for tests) pages through records by **field ID** and PATCHes updates in batches of 10. Pure mappers turn records into `Invitation`/`Guest` domain types and turn RSVP answers into record updates (including the guest-belongs-to-invitation ownership check). A pure `search` module normalizes names (case, accents, punctuation) and matches query tokens by prefix. `lib/guest-list.ts` wraps the fetch in `'use cache: remote'` with `cacheTag('guests')` so every Vercel instance shares one cached list. Phase 4 (RSVP flow) and Phase 5 (admin) consume these modules; no UI in this phase.

**Tech Stack:** Next.js 16.3 (Cache Components), TypeScript, Airtable REST API v0, Vitest.

**Spec:** `DESIGN.md` §3, §4, §6 (name matching, editing), §11, §15. Covers §14 step 2.

## Global Constraints

- Everything that touches the Airtable token lives under `src/lib/airtable/` or `src/lib/guest-list.ts` and imports `server-only`. The token must never appear in a client bundle, a log line, or an error message.
- The rest of the app depends only on the domain types in `src/types/domain.ts`, never on Airtable record shapes.
- Name normalization and matching are pure functions with no I/O (`src/lib/search.ts`). Mappers are pure too; only the client performs I/O.
- Airtable is addressed by table and field **IDs** (`src/lib/airtable/fields.ts`), never by display names, using `returnFieldsByFieldId=true`.
- Reads page through the list endpoint (max 100 records per request) following `offset` until none is returned. Writes PATCH at most 10 records per request.
- The client never receives the full guest list; search runs server-side and returns only matching households.
- Cache: `'use cache: remote'`, tag `guests`, profile `guestList` = stale 60s / revalidate 300s / expire 3600s. `submit-rsvp` (Phase 4) calls `updateTag('guests')`.
- `Attending` single-select values are exactly `Yes` / `No`; empty means no response. `Responded At` is a date-only field (`YYYY-MM-DD`), computed in the event's time zone `America/Chicago`.
- A plus-one counts only when an attending guest with `hasPlusOne` has a non-empty `plusOneName`. The site never writes `Plus One Name` for a guest without `Has Plus One` (hosts may have pre-filled it).
- Colors/tokens, file-size, and Next 16 conventions from Phase 1 still apply. No backslash escape sequences in regexes or strings in this phase's code (a tooling bug corrupted them in Phase 1); the plan's code avoids them on purpose.
- Shell: POSIX (Git Bash). Package manager: npm.

## Airtable base (verified 2026-09-14)

Base `appbgxLewd8oWk2Pc` ("Deb Party 2026").

| Table | ID | Field | Field ID | Type |
|---|---|---|---|---|
| Invitations | `tblw0nsKF2scJRMAP` | Household | `fldkiVYYRyX3FKU8Z` | singleLineText (primary) |
| | | Contact Email | `fldW2GJkEKK343mJj` | email |
| | | Guests | `fld6B3KxjlVDGjMbC` | multipleRecordLinks → Guests |
| Guests | `tblZAKY7pnmaq7ZfO` | Name | `fldMOgGzV24ZqOHgB` | singleLineText (primary) |
| | | Alt Names | `fldwDaBCmyEnnRWmO` | singleLineText (comma-separated) |
| | | Has Plus One | `fldpvqItoM49Roi4s` | checkbox |
| | | Attending | `fldyYDBE9nAaLCPMP` | singleSelect: Yes / No |
| | | Plus One Name | `fldoKigO1sGobrbof` | singleLineText |
| | | Responded At | `fldHgJkNQsT2C1uuc` | date |
| | | Invitation | `fldygUHX9dIeIp7sJ` | multipleRecordLinks → Invitations |

Seeded sample data: The Biggs Family (Grant: plus-one Priya Raman, attending; Truman: has plus-one, no response), The Musgroves (Sue alt name "Susan"; Noah no response), Daniel & Sofía Reyes (no responses), Bill & Traci Hunter.

## File Map

| File | Responsibility |
|---|---|
| `src/types/domain.ts` | Add `respondedAt?: string` to `Guest` |
| `src/config/site.ts` | Add `timeZone: 'America/Chicago'` |
| `src/lib/env.ts` | Export `readRequiredEnv(name)` (was private `required`) |
| `src/lib/airtable/fields.ts` | Table and field IDs (pure constants) |
| `src/lib/airtable/client.ts` | server-only REST client: `listAllRecords`, `updateRecords`; `getAirtableClient()` |
| `src/lib/airtable/invitations.ts` | server-only: `toGuest`, `toInvitations` (pure), `fetchInvitations(client)` |
| `src/lib/airtable/rsvp.ts` | server-only: `buildRsvpUpdates` (pure, validates ownership), `respondedOnDate`, `writeRsvp(client, updates)` |
| `src/lib/search.ts` | Pure: `normalizeName`, `nameTokens`, `isSearchableQuery`, `searchInvitations` |
| `src/lib/guest-list.ts` | server-only: cached `getInvitations()`, `GUEST_LIST_TAG` |
| `next.config.ts` | `cacheLife.guestList` profile |
| `vitest.config.mts` | Exclude `*.integration.test.ts` from `npm test` |
| `vitest.integration.config.mts` | Runs integration tests against the real base (`npm run test:airtable`) |
| `src/lib/airtable/airtable.integration.test.ts` | Real read, search, and write round-trip |

---

### Task 1: Airtable field IDs and REST client

**Files:**
- Modify: `src/types/domain.ts`, `src/config/site.ts`, `src/lib/env.ts`
- Create: `src/lib/airtable/fields.ts`, `src/lib/airtable/client.ts`
- Test: `src/lib/airtable/client.test.ts`

**Interfaces:**
- Consumes: nothing new (`server-only` is aliased to a stub under Vitest).
- Produces:
  - `Guest.respondedAt?: string` (date `YYYY-MM-DD`)
  - `siteConfig.timeZone: string` (`'America/Chicago'`)
  - `readRequiredEnv(name: string): string` from `@/lib/env`
  - `AIRTABLE` constant from `@/lib/airtable/fields` (shape below)
  - From `@/lib/airtable/client`: `interface AirtableRecord { id: string; fields: Record<string, unknown> }`, `interface RecordUpdate { id: string; fields: Record<string, unknown> }`, `interface AirtableClient { listAllRecords(tableId: string, fieldIds: readonly string[]): Promise<AirtableRecord[]>; updateRecords(tableId: string, updates: readonly RecordUpdate[]): Promise<void> }`, `UPDATE_BATCH_SIZE = 10`, `createAirtableClient(options: { token: string; baseId: string; fetch?: FetchLike }): AirtableClient`, `getAirtableClient(): AirtableClient`

- [ ] **Step 1: Extend the domain type and site config**

In `src/types/domain.ts`, add to `Guest` after `plusOneName`:
```ts
  respondedAt?: string; // YYYY-MM-DD, set by the site on submit
```

In `src/config/site.ts`, add to the `SiteConfig` interface:
```ts
  /** IANA time zone of the event; used for date-only fields like Responded At. */
  timeZone: string;
```
and to the `siteConfig` object:
```ts
  timeZone: 'America/Chicago',
```

- [ ] **Step 2: Export the env helper**

In `src/lib/env.ts`, rename the private `required` function to an exported `readRequiredEnv` and update its two call sites:
```ts
export function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
```
Keep the existing header comments. Run `npm test`; expected: all existing tests still pass.

- [ ] **Step 3: Add the field ID constants**

`src/lib/airtable/fields.ts`:
```ts
// Table and field IDs for the "Deb Party 2026" base. IDs survive renames in the Airtable UI.
// If the base is ever rebuilt, update these from the Airtable API or MCP schema.
export const AIRTABLE = {
  invitations: {
    tableId: 'tblw0nsKF2scJRMAP',
    fields: {
      household: 'fldkiVYYRyX3FKU8Z',
      email: 'fldW2GJkEKK343mJj',
      guests: 'fld6B3KxjlVDGjMbC',
    },
  },
  guests: {
    tableId: 'tblZAKY7pnmaq7ZfO',
    fields: {
      name: 'fldMOgGzV24ZqOHgB',
      altNames: 'fldwDaBCmyEnnRWmO',
      hasPlusOne: 'fldpvqItoM49Roi4s',
      attending: 'fldyYDBE9nAaLCPMP',
      plusOneName: 'fldoKigO1sGobrbof',
      respondedAt: 'fldHgJkNQsT2C1uuc',
      invitation: 'fldygUHX9dIeIp7sJ',
    },
  },
} as const;
```

- [ ] **Step 4: Write the failing client tests**

`src/lib/airtable/client.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { createAirtableClient, UPDATE_BATCH_SIZE } from '@/lib/airtable/client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function setup(responses: Response[] = []) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) => responses.shift() ?? json({ records: [] }));
  const client = createAirtableClient({ token: 'pat-test-token', baseId: 'appTEST', fetch });
  return { client, fetch };
}

describe('listAllRecords', () => {
  it('follows offsets until the last page and returns every record', async () => {
    const { client, fetch } = setup([
      json({ records: [{ id: 'rec1', fields: {} }], offset: 'page2' }),
      json({ records: [{ id: 'rec2', fields: {} }] }),
    ]);

    const records = await client.listAllRecords('tblGuests', ['fldA', 'fldB']);

    expect(records.map((record) => record.id)).toEqual(['rec1', 'rec2']);
    expect(fetch).toHaveBeenCalledTimes(2);
    const first = new URL(fetch.mock.calls[0][0]);
    expect(first.origin + first.pathname).toBe('https://api.airtable.com/v0/appTEST/tblGuests');
    expect(first.searchParams.get('pageSize')).toBe('100');
    expect(first.searchParams.get('returnFieldsByFieldId')).toBe('true');
    expect(first.searchParams.getAll('fields[]')).toEqual(['fldA', 'fldB']);
    expect(first.searchParams.has('offset')).toBe(false);
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('offset')).toBe('page2');
  });

  it('sends the token as a bearer header', async () => {
    const { client, fetch } = setup();
    await client.listAllRecords('tblGuests', []);
    expect(new Headers(fetch.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer pat-test-token');
  });

  it('throws with the status on a failed request without leaking the token', async () => {
    const { client } = setup([json({ error: { type: 'INVALID_PERMISSIONS' } }, 403)]);
    const error = await client.listAllRecords('tblGuests', []).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('403');
    expect((error as Error).message).not.toContain('pat-test-token');
  });
});

describe('updateRecords', () => {
  it('PATCHes updates in batches of 10', async () => {
    const { client, fetch } = setup();
    const updates = Array.from({ length: 23 }, (_, index) => ({ id: `rec${index}`, fields: { fldX: 'Yes' } }));

    await client.updateRecords('tblGuests', updates);

    expect(UPDATE_BATCH_SIZE).toBe(10);
    expect(fetch).toHaveBeenCalledTimes(3);
    const bodies = fetch.mock.calls.map(([, init]) => JSON.parse(String(init?.body)));
    expect(bodies.map((body) => body.records.length)).toEqual([10, 10, 3]);
    expect(bodies[2].records[2]).toEqual({ id: 'rec22', fields: { fldX: 'Yes' } });
    expect(fetch.mock.calls[0][1]?.method).toBe('PATCH');
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe('/v0/appTEST/tblGuests');
  });

  it('makes no request when there is nothing to update', async () => {
    const { client, fetch } = setup();
    await client.updateRecords('tblGuests', []);
    expect(fetch).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/airtable/client`.

- [ ] **Step 6: Implement the client**

`src/lib/airtable/client.ts`:
```ts
import 'server-only';
import { readRequiredEnv } from '@/lib/env';

export interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

export interface RecordUpdate {
  id: string;
  fields: Record<string, unknown>;
}

export interface AirtableClient {
  listAllRecords(tableId: string, fieldIds: readonly string[]): Promise<AirtableRecord[]>;
  updateRecords(tableId: string, updates: readonly RecordUpdate[]): Promise<void>;
}

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

const API_ROOT = 'https://api.airtable.com/v0';
const PAGE_SIZE = 100; // Airtable maximum
export const UPDATE_BATCH_SIZE = 10; // Airtable maximum per PATCH

interface ListPage {
  records: AirtableRecord[];
  offset?: string;
}

export function createAirtableClient(options: { token: string; baseId: string; fetch?: FetchLike }): AirtableClient {
  const doFetch = options.fetch ?? fetch;
  const headers = { Authorization: `Bearer ${options.token}`, 'Content-Type': 'application/json' };

  async function request<T>(tablePath: string, init: RequestInit = {}): Promise<T> {
    const response = await doFetch(`${API_ROOT}/${options.baseId}/${tablePath}`, { ...init, headers });
    if (!response.ok) {
      const detail = (await response.text()).slice(0, 300);
      const table = tablePath.split('?')[0];
      throw new Error(`Airtable ${init.method ?? 'GET'} ${table} failed with ${response.status}: ${detail}`);
    }
    return (await response.json()) as T;
  }

  return {
    async listAllRecords(tableId, fieldIds) {
      const records: AirtableRecord[] = [];
      let offset: string | undefined;
      do {
        const params = new URLSearchParams({ pageSize: String(PAGE_SIZE), returnFieldsByFieldId: 'true' });
        for (const fieldId of fieldIds) params.append('fields[]', fieldId);
        if (offset) params.set('offset', offset);
        const page = await request<ListPage>(`${tableId}?${params}`);
        records.push(...page.records);
        offset = page.offset;
      } while (offset);
      return records;
    },

    async updateRecords(tableId, updates) {
      for (let start = 0; start < updates.length; start += UPDATE_BATCH_SIZE) {
        const records = updates.slice(start, start + UPDATE_BATCH_SIZE);
        await request(tableId, { method: 'PATCH', body: JSON.stringify({ records, returnFieldsByFieldId: true }) });
      }
    },
  };
}

export function getAirtableClient(): AirtableClient {
  return createAirtableClient({
    token: readRequiredEnv('AIRTABLE_TOKEN'),
    baseId: readRequiredEnv('AIRTABLE_BASE_ID'),
  });
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (5 new client tests plus all existing).

- [ ] **Step 8: Lint and commit**

Run: `npm run lint` (expected clean), then:
```bash
git add -A
git commit -m "feat: Airtable field IDs and paging REST client"
```

---

### Task 2: Read mappers (records → domain types)

**Files:**
- Create: `src/lib/airtable/invitations.ts`
- Test: `src/lib/airtable/invitations.test.ts`

**Interfaces:**
- Consumes: `AIRTABLE` (`@/lib/airtable/fields`); types `AirtableClient`, `AirtableRecord` (`@/lib/airtable/client`); `Guest`, `Invitation`, `Attendance` (`@/types/domain`).
- Produces:
  - `toGuest(record: AirtableRecord): Guest`
  - `toInvitations(invitationRecords: readonly AirtableRecord[], guestRecords: readonly AirtableRecord[]): Invitation[]`: sorted by household; each roster in the invitation's link order; guests with a blank name or missing record are skipped
  - `fetchInvitations(client: AirtableClient): Promise<Invitation[]>`

- [ ] **Step 1: Write the failing tests**

`src/lib/airtable/invitations.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import type { AirtableClient, AirtableRecord } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import { fetchInvitations, toGuest, toInvitations } from '@/lib/airtable/invitations';

const G = AIRTABLE.guests.fields;
const I = AIRTABLE.invitations.fields;

const guestRecords: AirtableRecord[] = [
  {
    id: 'recGrant',
    fields: {
      [G.name]: 'Grant Biggs',
      [G.hasPlusOne]: true,
      [G.attending]: 'Yes',
      [G.plusOneName]: 'Priya Raman',
      [G.respondedAt]: '2026-09-10',
      [G.invitation]: ['recBiggs'],
    },
  },
  { id: 'recTruman', fields: { [G.name]: 'Truman Biggs', [G.hasPlusOne]: true, [G.invitation]: ['recBiggs'] } },
  {
    id: 'recSue',
    fields: { [G.name]: 'Sue Musgrove', [G.altNames]: 'Susan,  Suzy ,', [G.attending]: 'No', [G.invitation]: ['recMusgrove'] },
  },
  { id: 'recBlank', fields: { [G.name]: '   ', [G.invitation]: ['recMusgrove'] } },
];

const invitationRecords: AirtableRecord[] = [
  { id: 'recMusgrove', fields: { [I.household]: 'The Musgroves', [I.guests]: ['recSue', 'recBlank'] } },
  {
    id: 'recBiggs',
    fields: { [I.household]: 'The Biggs Family', [I.email]: 'biggs@example.com', [I.guests]: ['recTruman', 'recGrant', 'recMissing'] },
  },
];

describe('toGuest', () => {
  it('maps a guest who answered and is bringing a plus-one', () => {
    expect(toGuest(guestRecords[0])).toEqual({
      id: 'recGrant',
      name: 'Grant Biggs',
      hasPlusOne: true,
      attending: 'yes',
      plusOneName: 'Priya Raman',
      respondedAt: '2026-09-10',
    });
  });

  it('maps a guest with no response yet', () => {
    expect(toGuest(guestRecords[1])).toEqual({ id: 'recTruman', name: 'Truman Biggs', hasPlusOne: true, attending: null });
  });

  it('splits alt names on commas and drops blanks', () => {
    expect(toGuest(guestRecords[2])).toMatchObject({ altNames: ['Susan', 'Suzy'], attending: 'no', hasPlusOne: false });
  });
});

describe('toInvitations', () => {
  const invitations = toInvitations(invitationRecords, guestRecords);

  it('sorts households by name', () => {
    expect(invitations.map((invitation) => invitation.household)).toEqual(['The Biggs Family', 'The Musgroves']);
  });

  it('builds each roster in the invitation link order, skipping blank and missing guests', () => {
    expect(invitations[0].guests.map((guest) => guest.id)).toEqual(['recTruman', 'recGrant']);
    expect(invitations[1].guests.map((guest) => guest.id)).toEqual(['recSue']);
  });

  it('maps the contact email when present', () => {
    expect(invitations[0].email).toBe('biggs@example.com');
    expect(invitations[1].email).toBeUndefined();
  });
});

describe('fetchInvitations', () => {
  it('reads both tables by field ID and maps them', async () => {
    const listAllRecords = vi.fn(async (tableId: string) =>
      tableId === AIRTABLE.invitations.tableId ? invitationRecords : guestRecords,
    );
    const client: AirtableClient = { listAllRecords, updateRecords: vi.fn() };

    const invitations = await fetchInvitations(client);

    expect(invitations).toEqual(toInvitations(invitationRecords, guestRecords));
    expect(listAllRecords).toHaveBeenCalledWith(AIRTABLE.invitations.tableId, Object.values(AIRTABLE.invitations.fields));
    expect(listAllRecords).toHaveBeenCalledWith(AIRTABLE.guests.tableId, Object.values(AIRTABLE.guests.fields));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/airtable/invitations`.

- [ ] **Step 3: Implement the mappers**

`src/lib/airtable/invitations.ts`:
```ts
import 'server-only';
import type { AirtableClient, AirtableRecord } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import type { Attendance, Guest, Invitation } from '@/types/domain';

const G = AIRTABLE.guests.fields;
const I = AIRTABLE.invitations.fields;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function recordIds(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function attendance(value: unknown): Attendance {
  if (value === 'Yes') return 'yes';
  if (value === 'No') return 'no';
  return null;
}

export function toGuest(record: AirtableRecord): Guest {
  const fields = record.fields;
  const altNames = (text(fields[G.altNames]) ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return {
    id: record.id,
    name: text(fields[G.name]) ?? '',
    altNames: altNames.length > 0 ? altNames : undefined,
    hasPlusOne: fields[G.hasPlusOne] === true,
    attending: attendance(fields[G.attending]),
    plusOneName: text(fields[G.plusOneName]),
    respondedAt: text(fields[G.respondedAt]),
  };
}

export function toInvitations(
  invitationRecords: readonly AirtableRecord[],
  guestRecords: readonly AirtableRecord[],
): Invitation[] {
  const guestsById = new Map(guestRecords.map((record) => [record.id, toGuest(record)]));
  return invitationRecords
    .map((record) => ({
      id: record.id,
      household: text(record.fields[I.household]) ?? '',
      email: text(record.fields[I.email]),
      guests: recordIds(record.fields[I.guests]).flatMap((guestId) => {
        const guest = guestsById.get(guestId);
        return guest && guest.name ? [guest] : [];
      }),
    }))
    .sort((a, b) => a.household.localeCompare(b.household));
}

export async function fetchInvitations(client: AirtableClient): Promise<Invitation[]> {
  // Sequential on purpose: stays well inside Airtable's 5 requests/second per base.
  const invitationRecords = await client.listAllRecords(AIRTABLE.invitations.tableId, Object.values(I));
  const guestRecords = await client.listAllRecords(AIRTABLE.guests.tableId, Object.values(G));
  return toInvitations(invitationRecords, guestRecords);
}
```

Note: `toEqual` treats `undefined` properties as absent, which is why the "no response" test passes without `altNames`/`plusOneName`/`respondedAt` keys.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`, then:
```bash
git add -A
git commit -m "feat: map Airtable records to invitations and guests"
```

---

### Task 3: Name search

**Files:**
- Create: `src/lib/search.ts`
- Test: `src/lib/search.test.ts`

**Interfaces:**
- Consumes: `Guest`, `Invitation` (`@/types/domain`).
- Produces:
  - `MIN_QUERY_TOKENS = 2`, `MAX_SEARCH_RESULTS = 10`
  - `normalizeName(value: string): string`: lowercase, accents removed, apostrophes and periods removed, other non-alphanumerics become single spaces, trimmed
  - `nameTokens(value: string): string[]`
  - `isSearchableQuery(query: string): boolean`: at least 2 tokens (first and last name)
  - `searchInvitations(invitations: readonly Invitation[], query: string): Invitation[]`: households with at least one guest whose name or alt-name tokens match **every** query token by prefix; keeps input order; at most 10; `[]` for unsearchable queries

Matching rules (DESIGN §6): the household label is never searched; alt names contribute extra tokens (so "Susan Musgrove" finds "Sue Musgrove" with alt name "Susan"); prefix matching lets "Dan Reyes" find "Daniel Reyes". There is no typo tolerance.

- [ ] **Step 1: Write the failing tests**

`src/lib/search.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { isSearchableQuery, MAX_SEARCH_RESULTS, normalizeName, searchInvitations } from '@/lib/search';
import type { Guest, Invitation } from '@/types/domain';

const guest = (id: string, name: string, altNames?: string[]): Guest => ({
  id,
  name,
  altNames,
  hasPlusOne: false,
  attending: null,
});

const invitations: Invitation[] = [
  { id: 'inv1', household: 'Daniel & Sofía Reyes', guests: [guest('g1', 'Daniel Reyes'), guest('g2', 'Sofía Reyes')] },
  { id: 'inv2', household: 'The Reyes Family', guests: [guest('g3', 'Sofia Reyes'), guest('g4', 'Mateo Reyes')] },
  { id: 'inv3', household: 'The Musgroves', guests: [guest('g5', 'Sue Musgrove', ['Susan']), guest('g6', 'Emma Musgrove')] },
  {
    id: 'inv4',
    household: "The O'Brien-Garzas",
    guests: [guest('g7', "Liam O'Brien-Garza"), guest('g8', 'María de la Garza')],
  },
  { id: 'inv5', household: 'Héctor Salinas', guests: [guest('g9', 'Héctor Salinas')] },
];

const households = (query: string) => searchInvitations(invitations, query).map((invitation) => invitation.id);

describe('normalizeName', () => {
  it('lowercases, strips accents, and collapses spacing', () => {
    expect(normalizeName('  MARÍA  de   la Garza ')).toBe('maria de la garza');
    expect(normalizeName('Héctor')).toBe('hector');
  });

  it('drops apostrophes and periods and splits on hyphens', () => {
    expect(normalizeName("Liam O'Brien-Garza")).toBe('liam obrien garza');
    expect(normalizeName('Liam O’Brien Jr.')).toBe('liam obrien jr');
  });
});

describe('searchInvitations', () => {
  it('finds a household by one member’s full name', () => {
    expect(households('Emma Musgrove')).toEqual(['inv3']);
  });

  it('ignores case and extra spaces', () => {
    expect(households('  emma   MUSGROVE ')).toEqual(['inv3']);
  });

  it('matches accented names with or without the accent', () => {
    expect(households('Hector Salinas')).toEqual(['inv5']);
    expect(households('Héctor Salinas')).toEqual(['inv5']);
  });

  it('matches nicknames from alt names', () => {
    expect(households('Susan Musgrove')).toEqual(['inv3']);
  });

  it('matches partial names by prefix', () => {
    expect(households('Dan Reyes')).toEqual(['inv1']);
  });

  it('returns every household with a match when surnames collide', () => {
    expect(households('Sofia Reyes')).toEqual(['inv1', 'inv2']);
  });

  it('lists a household once even when several members match', () => {
    expect(households('Reyes Reyes')).toEqual(['inv1', 'inv2']);
  });

  it('handles punctuation and multi-part surnames', () => {
    expect(households('Liam OBrien')).toEqual(['inv4']);
    expect(households('Maria Garza')).toEqual(['inv4']);
  });

  it('never matches on the household label', () => {
    expect(households('The Musgroves')).toEqual([]);
  });

  it('requires at least a first and last name', () => {
    expect(isSearchableQuery('Musgrove')).toBe(false);
    expect(isSearchableQuery('Emma Musgrove')).toBe(true);
    expect(households('Musgrove')).toEqual([]);
    expect(households('   ')).toEqual([]);
  });

  it('returns nothing when no guest matches', () => {
    expect(households('Nobody Here')).toEqual([]);
  });

  it('returns the full roster of a matched household', () => {
    expect(searchInvitations(invitations, 'Emma Musgrove')[0].guests).toHaveLength(2);
  });

  it('caps the number of results', () => {
    const many = Array.from({ length: 15 }, (_, index) => ({
      id: `many${index}`,
      household: `Lopez ${index}`,
      guests: [guest(`m${index}`, 'Ana Lopez')],
    }));
    expect(MAX_SEARCH_RESULTS).toBe(10);
    expect(searchInvitations(many, 'Ana Lopez')).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/search`.

- [ ] **Step 3: Implement search**

`src/lib/search.ts`:
```ts
import type { Guest, Invitation } from '@/types/domain';

export const MIN_QUERY_TOKENS = 2;
export const MAX_SEARCH_RESULTS = 10;

// Unicode combining diacritical marks block. NFD splits "í" into "i" plus a mark in this range.
const COMBINING_MARKS_START = 0x300;
const COMBINING_MARKS_END = 0x36f;

function stripAccents(value: string): string {
  return [...value.normalize('NFD')]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARKS_START || code > COMBINING_MARKS_END;
    })
    .join('');
}

export function normalizeName(value: string): string {
  return stripAccents(value.toLowerCase())
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function nameTokens(value: string): string[] {
  const normalized = normalizeName(value);
  return normalized ? normalized.split(' ') : [];
}

export function isSearchableQuery(query: string): boolean {
  return nameTokens(query).length >= MIN_QUERY_TOKENS;
}

function guestMatches(queryTokens: readonly string[], guest: Guest): boolean {
  const candidateTokens = [guest.name, ...(guest.altNames ?? [])].flatMap(nameTokens);
  return queryTokens.every((queryToken) => candidateTokens.some((token) => token.startsWith(queryToken)));
}

export function searchInvitations(invitations: readonly Invitation[], query: string): Invitation[] {
  const queryTokens = nameTokens(query);
  if (queryTokens.length < MIN_QUERY_TOKENS) return [];
  return invitations
    .filter((invitation) => invitation.guests.some((guest) => guestMatches(queryTokens, guest)))
    .slice(0, MAX_SEARCH_RESULTS);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`, then:
```bash
git add -A
git commit -m "feat: server-side name search with accent, nickname, and prefix matching"
```

---

### Task 4: RSVP write mapper

**Files:**
- Create: `src/lib/airtable/rsvp.ts`
- Test: `src/lib/airtable/rsvp.test.ts`

**Interfaces:**
- Consumes: `AIRTABLE`; types `AirtableClient`, `RecordUpdate`; `Invitation`; `siteConfig.timeZone`.
- Produces:
  - `interface RsvpAnswer { guestId: string; attending: 'yes' | 'no'; plusOneName?: string }`
  - `class RsvpValidationError extends Error`
  - `MAX_PLUS_ONE_NAME_LENGTH = 100`
  - `buildRsvpUpdates(invitation: Invitation, answers: readonly RsvpAnswer[], respondedOn: string): RecordUpdate[]`: throws `RsvpValidationError` for a guest not on the invitation, duplicate answers, an attending value other than yes/no, or a plus-one name over 100 characters. Writes `Attending` (`Yes`/`No`) and `Responded At` for every answer; writes `Plus One Name` only for guests with `hasPlusOne` (trimmed name when attending and non-blank, otherwise `null` to clear).
  - `respondedOnDate(now?: Date): string`: `YYYY-MM-DD` in `siteConfig.timeZone`
  - `writeRsvp(client: AirtableClient, updates: readonly RecordUpdate[]): Promise<void>`

Phase 4's `submit-rsvp` action will: `requireSiteSession()`, load the invitation from the cached list by ID, `buildRsvpUpdates`, `writeRsvp`, `updateTag('guests')`.

- [ ] **Step 1: Write the failing tests**

`src/lib/airtable/rsvp.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import type { AirtableClient } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import {
  buildRsvpUpdates,
  MAX_PLUS_ONE_NAME_LENGTH,
  respondedOnDate,
  RsvpValidationError,
  writeRsvp,
} from '@/lib/airtable/rsvp';
import type { Invitation } from '@/types/domain';

const G = AIRTABLE.guests.fields;
const DAY = '2026-09-14';

const invitation: Invitation = {
  id: 'recBiggs',
  household: 'The Biggs Family',
  guests: [
    { id: 'recGrant', name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: 'recMario', name: 'Mario Biggs', hasPlusOne: false, attending: 'yes', plusOneName: 'Host Prefilled' },
  ],
};

describe('buildRsvpUpdates', () => {
  it('writes attendance, a trimmed plus-one name, and the response date', () => {
    const updates = buildRsvpUpdates(invitation, [{ guestId: 'recGrant', attending: 'yes', plusOneName: '  Priya Raman ' }], DAY);
    expect(updates).toEqual([
      { id: 'recGrant', fields: { [G.attending]: 'Yes', [G.plusOneName]: 'Priya Raman', [G.respondedAt]: DAY } },
    ]);
  });

  it('clears the plus-one when an eligible guest attends alone', () => {
    const [update] = buildRsvpUpdates(invitation, [{ guestId: 'recGrant', attending: 'yes', plusOneName: '   ' }], DAY);
    expect(update.fields[G.plusOneName]).toBeNull();
  });

  it('clears the plus-one when an eligible guest declines', () => {
    const [update] = buildRsvpUpdates(invitation, [{ guestId: 'recGrant', attending: 'no', plusOneName: 'Priya Raman' }], DAY);
    expect(update.fields).toEqual({ [G.attending]: 'No', [G.plusOneName]: null, [G.respondedAt]: DAY });
  });

  it('never touches the plus-one field for a guest without plus-one eligibility', () => {
    const [update] = buildRsvpUpdates(invitation, [{ guestId: 'recMario', attending: 'yes', plusOneName: 'Sneaky Guest' }], DAY);
    expect(update.fields).toEqual({ [G.attending]: 'Yes', [G.respondedAt]: DAY });
  });

  it('rejects a guest who is not on the invitation', () => {
    expect(() => buildRsvpUpdates(invitation, [{ guestId: 'recStranger', attending: 'yes' }], DAY)).toThrow(RsvpValidationError);
  });

  it('rejects duplicate answers for the same guest', () => {
    const answers = [
      { guestId: 'recGrant', attending: 'yes' as const },
      { guestId: 'recGrant', attending: 'no' as const },
    ];
    expect(() => buildRsvpUpdates(invitation, answers, DAY)).toThrow(RsvpValidationError);
  });

  it('rejects an attending value other than yes or no', () => {
    const answers = [{ guestId: 'recGrant', attending: 'maybe' as 'yes' }];
    expect(() => buildRsvpUpdates(invitation, answers, DAY)).toThrow(RsvpValidationError);
  });

  it('rejects an overlong plus-one name', () => {
    const answers = [{ guestId: 'recGrant', attending: 'yes' as const, plusOneName: 'x'.repeat(MAX_PLUS_ONE_NAME_LENGTH + 1) }];
    expect(() => buildRsvpUpdates(invitation, answers, DAY)).toThrow(RsvpValidationError);
  });
});

describe('respondedOnDate', () => {
  it('uses the event time zone, not UTC', () => {
    expect(respondedOnDate(new Date('2026-09-15T03:30:00Z'))).toBe('2026-09-14');
    expect(respondedOnDate(new Date('2026-09-15T06:00:00Z'))).toBe('2026-09-15');
  });
});

describe('writeRsvp', () => {
  it('sends the updates to the Guests table', async () => {
    const updateRecords = vi.fn(async () => {});
    const client: AirtableClient = { listAllRecords: vi.fn(), updateRecords };
    const updates = [{ id: 'recGrant', fields: { [G.attending]: 'Yes' } }];

    await writeRsvp(client, updates);

    expect(updateRecords).toHaveBeenCalledWith(AIRTABLE.guests.tableId, updates);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/airtable/rsvp`.

- [ ] **Step 3: Implement**

`src/lib/airtable/rsvp.ts`:
```ts
import 'server-only';
import type { AirtableClient, RecordUpdate } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import { siteConfig } from '@/config/site';
import type { Invitation } from '@/types/domain';

const G = AIRTABLE.guests.fields;

export const MAX_PLUS_ONE_NAME_LENGTH = 100;

export interface RsvpAnswer {
  guestId: string;
  attending: 'yes' | 'no';
  plusOneName?: string;
}

export class RsvpValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RsvpValidationError';
  }
}

/** Validates answers against the household (ownership check) and maps them to Guests-table updates. */
export function buildRsvpUpdates(
  invitation: Invitation,
  answers: readonly RsvpAnswer[],
  respondedOn: string,
): RecordUpdate[] {
  const guestsById = new Map(invitation.guests.map((guest) => [guest.id, guest]));
  const answered = new Set<string>();

  return answers.map((answer) => {
    const guest = guestsById.get(answer.guestId);
    if (!guest) throw new RsvpValidationError(`Guest ${answer.guestId} is not on invitation ${invitation.id}`);
    if (answered.has(guest.id)) throw new RsvpValidationError(`Duplicate answer for guest ${guest.id}`);
    answered.add(guest.id);
    if (answer.attending !== 'yes' && answer.attending !== 'no') {
      throw new RsvpValidationError(`Invalid attendance for guest ${guest.id}`);
    }

    const fields: Record<string, unknown> = {
      [G.attending]: answer.attending === 'yes' ? 'Yes' : 'No',
      [G.respondedAt]: respondedOn,
    };

    if (guest.hasPlusOne) {
      const plusOneName = answer.plusOneName?.trim() ?? '';
      if (plusOneName.length > MAX_PLUS_ONE_NAME_LENGTH) {
        throw new RsvpValidationError(`Plus-one name for guest ${guest.id} is too long`);
      }
      fields[G.plusOneName] = answer.attending === 'yes' && plusOneName ? plusOneName : null;
    }

    return { id: guest.id, fields };
  });
}

export function respondedOnDate(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: siteConfig.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function writeRsvp(client: AirtableClient, updates: readonly RecordUpdate[]): Promise<void> {
  await client.updateRecords(AIRTABLE.guests.tableId, updates);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Lint and commit**

Run: `npm run lint`, then:
```bash
git add -A
git commit -m "feat: validated RSVP-to-Airtable update mapper"
```

---

### Task 5: Cached guest list, live Airtable check, spec updates

**Files:**
- Create: `src/lib/guest-list.ts`, `vitest.integration.config.mts`, `src/lib/airtable/airtable.integration.test.ts`
- Modify: `next.config.ts`, `vitest.config.mts`, `package.json` (script), `DESIGN.md`

**Interfaces:**
- Consumes: `getAirtableClient`, `AIRTABLE`, `fetchInvitations`, `buildRsvpUpdates`, `respondedOnDate`, `writeRsvp`, `searchInvitations`.
- Produces:
  - `GUEST_LIST_TAG = 'guests'` and `getInvitations(): Promise<Invitation[]>` from `@/lib/guest-list` (cached, shared across instances)
  - `npm run test:airtable`: real-base integration run (not part of `npm test`)

- [ ] **Step 1: Add the cache profile**

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
};

export default nextConfig;
```

- [ ] **Step 2: Add the cached guest list**

`src/lib/guest-list.ts`:
```ts
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getAirtableClient } from '@/lib/airtable/client';
import { fetchInvitations } from '@/lib/airtable/invitations';
import type { Invitation } from '@/types/domain';

export const GUEST_LIST_TAG = 'guests';

/**
 * The whole guest list. Search, roster, admin, and export all read this; Airtable is never in the page-view hot path.
 * 'use cache: remote' shares one entry across Vercel instances, so updateTag after an RSVP is seen everywhere.
 */
export async function getInvitations(): Promise<Invitation[]> {
  'use cache: remote';
  cacheTag(GUEST_LIST_TAG);
  cacheLife('guestList');
  return fetchInvitations(getAirtableClient());
}
```

- [ ] **Step 3: Verify the build**

Run: `npm run lint` then `npm run build`
Expected: both succeed. (`getInvitations` has no callers yet; Phase 4 wires it in. The build still type-checks it, including the `'guestList'` profile name.)

- [ ] **Step 4: Split unit and integration test runs**

In `vitest.config.mts`, import `configDefaults` and exclude integration tests. The `test` block becomes:
```ts
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: [...configDefaults.exclude, 'src/**/*.integration.test.ts'],
  },
```
with the import line changed to:
```ts
import { configDefaults, defineConfig } from 'vitest/config';
```

Create `vitest.integration.config.mts`:
```ts
import { defineConfig } from 'vitest/config';
import baseConfig from './vitest.config.mts';

// Real Airtable credentials from .env.local; workers inherit this process's env.
process.loadEnvFile('.env.local');

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['src/**/*.integration.test.ts'],
    exclude: [],
    testTimeout: 30_000,
    fileParallelism: false,
  },
});
```

In `package.json` scripts, add:
```json
"test:airtable": "vitest run --config vitest.integration.config.mts"
```

- [ ] **Step 5: Write the live integration test**

`src/lib/airtable/airtable.integration.test.ts`:
```ts
import { beforeAll, describe, expect, it } from 'vitest';
import { getAirtableClient } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import { fetchInvitations } from '@/lib/airtable/invitations';
import { buildRsvpUpdates, respondedOnDate, writeRsvp } from '@/lib/airtable/rsvp';
import { searchInvitations } from '@/lib/search';
import type { Invitation } from '@/types/domain';

// Runs against the real base configured in .env.local, using the seeded sample households (DESIGN §15).
// If the sample data has been edited, update the names below.
const client = getAirtableClient();
let invitations: Invitation[];

beforeAll(async () => {
  invitations = await fetchInvitations(client);
});

describe('reading the real base', () => {
  it('loads households with their rosters and answers', () => {
    expect(invitations.length).toBeGreaterThan(0);
    const biggs = invitations.find((invitation) => invitation.household === 'The Biggs Family');
    expect(biggs?.guests.map((guest) => guest.name)).toEqual(expect.arrayContaining(['Grant Biggs', 'Truman Biggs']));
    expect(biggs?.guests.find((guest) => guest.name === 'Grant Biggs')).toMatchObject({
      hasPlusOne: true,
      attending: 'yes',
      plusOneName: 'Priya Raman',
    });
  });

  it('finds an accented name typed without the accent', () => {
    expect(searchInvitations(invitations, 'Sofia Reyes').map((invitation) => invitation.household)).toContain(
      'Daniel & Sofía Reyes',
    );
  });
});

describe('writing to the real base', () => {
  it('round-trips an RSVP and restores the original values', async () => {
    const musgroves = invitations.find((invitation) => invitation.household === 'The Musgroves');
    const noah = musgroves?.guests.find((guest) => guest.name === 'Noah Musgrove');
    if (!musgroves || !noah) throw new Error('Sample guest Noah Musgrove not found in The Musgroves');
    const G = AIRTABLE.guests.fields;

    try {
      await writeRsvp(client, buildRsvpUpdates(musgroves, [{ guestId: noah.id, attending: 'yes' }], respondedOnDate()));
      const reread = (await fetchInvitations(client))
        .find((invitation) => invitation.id === musgroves.id)
        ?.guests.find((guest) => guest.id === noah.id);
      expect(reread).toMatchObject({ attending: 'yes', respondedAt: respondedOnDate() });
    } finally {
      const originalAttending = noah.attending === 'yes' ? 'Yes' : noah.attending === 'no' ? 'No' : null;
      await client.updateRecords(AIRTABLE.guests.tableId, [
        { id: noah.id, fields: { [G.attending]: originalAttending, [G.respondedAt]: noah.respondedAt ?? null } },
      ]);
    }
  });
});
```

- [ ] **Step 6: Run both suites**

Run: `npm test`
Expected: PASS, and the output does **not** list `airtable.integration.test.ts`.

Run: `npm run test:airtable`
Expected: PASS (3 tests). If it fails with 401/403, the token lacks `data.records:read` / `data.records:write` scopes or access to the base: stop and report, do not change code. Afterwards confirm in Airtable (or via a re-read) that Noah Musgrove's Attending and Responded At are empty again.

- [ ] **Step 7: Update DESIGN.md**

1. §4 Domain types code block: add `respondedAt?: string;  // YYYY-MM-DD, set by the site on submit` to `Guest` after `plusOneName`.
2. §4, after "The Airtable mappers in `lib/airtable` translate records…" paragraph, add: `The app addresses Airtable by table and field IDs (\`lib/airtable/fields.ts\`), so renaming a column in the Airtable UI does not break the site. Adding or removing a field the site reads requires updating that file.`
3. §6 "Name matching": append: `A query needs at least a first and last name (two words). Each query word must be the start of some word in the guest's name or alt names ("Dan Reyes" finds "Daniel Reyes"); apostrophes and periods are ignored and hyphens split words. The household label is not searched. At most 10 households are returned. There is no typo tolerance, so alt names matter.`
4. §10 tree under `lib/airtable/`: add `fields.ts  # table + field IDs`, and change the `rsvp.ts` comment to `# write mapper + ownership validation`.
5. §11 first bullet: replace `in a \`'use cache'\` function` with `in a \`'use cache: remote'\` function (shared across Vercel instances)`, and add a bullet: `The cache profile \`guestList\` (next.config.ts) is stale 60s / revalidate 300s / expire 3600s.`
6. §15 add: `Run \`npm run test:airtable\` to check reads, search, and a restoring write round-trip against the real base.`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: cached guest list and live Airtable integration check"
```

---

## Phase 2 Done When

- `npm test`, `npm run lint`, `npm run build` pass; `npm run test:airtable` passes against the real base and leaves sample data unchanged.
- DESIGN.md reflects field-ID addressing, search rules, `respondedAt`, and the remote cache.

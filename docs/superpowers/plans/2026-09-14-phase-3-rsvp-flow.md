# Phase 3: RSVP Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guests on `/rsvp` search their name, pick their household, mark each member Yes/No (with a conditional plus-one), see a live headcount, submit, and see a confirmation. Returning guests see their previous answers and can change them.

**Architecture:** One route, client-driven (DESIGN §6). `app/rsvp/page.tsx` is a thin server shell rendering the client `RsvpFlow`, which holds the step (search → results → roster → done) in local state. Two server actions do all I/O: `searchGuests` (session check → cached list → ranked search → roster projection) and `submitRsvp` (session check → parse untrusted input → look up invitation → ownership-validated Airtable write → `updateTag('guests')`). The browser only ever receives a `RosterHousehold` projection (no email, alt names, or response dates). Roster interaction rules (hydration, plus-one reveal/clear, headcount, completeness) live in a pure reducer so they are unit-tested without a browser.

**Tech Stack:** Next.js 16.3 (App Router, Cache Components, server actions, `updateTag`), React 19 (`useReducer`, `useTransition`), Tailwind v4 tokens, shadcn/base-ui `Button`/`Input`/`Label`, Vitest.

**Spec:** `DESIGN.md` §3, §6 (whole section), §10, §15. Covers §14 step 4.

## Global Constraints

- Every server action except `unlockSite` calls `await requireSiteSession()` as its first statement, outside any `try`.
- Server actions return status objects, never raw error messages; unexpected errors are logged with `console.error` and returned as `{ status: 'error' }`. User-facing copy lives in the client components.
- The browser never receives the full guest list, contact emails, alt names, or `respondedAt`. Server actions return `RosterHousehold` values only.
- `submitRsvp` treats its input as untrusted `unknown`: parse shape and sizes, require the invitation to exist, require exactly one answer per guest on that invitation (ownership enforced by `buildRsvpUpdates`), and only then write and `updateTag('guests')`.
- Plus-one rule (one implementation, `storedPlusOneName`): a plus-one name is kept only when the guest has `hasPlusOne`, is attending, and the trimmed name is non-empty. Headcount = attending guests + attending eligible guests who are bringing a guest with a non-empty name.
- Pure logic (`lib/plus-one.ts`, `lib/roster-view.ts`, `lib/roster-state.ts`, `lib/rsvp-input.ts`, `lib/dates.ts`) has no I/O and no `server-only` import, so client components can use it.
- One component, one job, ~150 lines max. Pages compose only. Colors via tokens only (`bg-success`, `text-destructive`, `text-link`, …). Event facts from `src/config/site.ts`.
- Accessibility for guests of every age: tap targets at least 48px tall (`h-12`), text-base or larger, native radio inputs for Yes/No, visible focus rings, errors in `role="alert"`, focus moves to each new step's heading.
- No backslash escape sequences in regexes or strings (a tooling bug corrupted them before); the plan's code avoids them.
- Do not modify `src/components/ui/*`. Commit with `git add -A -- . ':!.claude'`. Never open `.env.local`.

## Existing interfaces this phase uses

- `@/lib/auth`: `requireSiteSession(): Promise<void>` (redirects to `/unlock` when locked).
- `@/lib/guest-list`: `getInvitations(): Promise<Invitation[]>`, `GUEST_LIST_TAG = 'guests'`.
- `@/lib/search`: `isSearchableQuery(query)`, `searchInvitations(invitations, query): { matches: Invitation[]; truncated: boolean }`.
- `@/lib/airtable/rsvp`: `buildRsvpUpdates(invitation, answers, respondedOn)`, `respondedOnDate()`, `writeRsvp(client, updates)`, `RsvpValidationError`, `MAX_PLUS_ONE_NAME_LENGTH`, `RsvpAnswer`.
- `@/lib/airtable/client`: `getAirtableClient()`.
- `@/types/domain`: `Attendance`, `Guest`, `Invitation`.
- `@/components/ui/button`: `Button`, `buttonVariants`; `@/components/ui/input`: `Input`; `@/components/ui/label`: `Label`; `@/lib/utils`: `cn`.
- `@/config/site`: `siteConfig.name`, `siteConfig.rsvpDeadline` (`YYYY-MM-DD` or `null`).

## File Map

| File | Responsibility |
|---|---|
| `src/types/rsvp.ts` | Client-safe types: `RosterGuest`, `RosterHousehold`, `RsvpAnswer`, `SubmitRsvpInput`, action result types |
| `src/lib/plus-one.ts` | `MAX_PLUS_ONE_NAME_LENGTH`, `storedPlusOneName` |
| `src/lib/roster-view.ts` | `toRosterHousehold` (projection), `withAnswers` (confirmation view) |
| `src/lib/dates.ts` | `formatEventDate` |
| `src/lib/roster-state.ts` | Pure roster reducer, hydration, headcount, issues, answers |
| `src/lib/rsvp-input.ts` | `parseSubmitRsvpInput` for untrusted action input |
| `src/lib/airtable/rsvp.ts` | Modified: use shared plus-one rule and `RsvpAnswer` type |
| `src/server/actions/search-guests.ts` | `'use server'` search |
| `src/server/actions/submit-rsvp.ts` | `'use server'` submit |
| `src/components/rsvp/use-focus-on-mount.ts` | Focus a step heading on mount |
| `src/components/rsvp/yes-no-toggle.tsx` | Segmented Yes/No radio group |
| `src/components/rsvp/plus-one-field.tsx` | "Bringing a guest?" + name input |
| `src/components/rsvp/guest-row.tsx` | One guest: name, toggle, plus-one |
| `src/components/rsvp/party-tally.tsx` | Live headcount |
| `src/components/rsvp/guest-roster.tsx` | Roster form: reducer, validation, submit |
| `src/components/rsvp/name-search-form.tsx` | Name input + search |
| `src/components/rsvp/result-card.tsx` | One household choice |
| `src/components/rsvp/search-results.tsx` | Household list |
| `src/components/rsvp/rsvp-confirmation.tsx` | Summary after submit |
| `src/components/rsvp/rsvp-flow.tsx` | Step state machine |
| `src/app/rsvp/page.tsx` | Thin server shell |
| `src/app/page.tsx` | Modified: RSVP button links to `/rsvp` |

Test helper used by several test files (define locally in each file; 17-character Airtable-style IDs):
```ts
const id = (label: string) => `rec${label}`.padEnd(17, '0');
```

---

### Task 1: Shared RSVP types, plus-one rule, roster projection, date formatting

**Files:**
- Create: `src/types/rsvp.ts`, `src/lib/plus-one.ts`, `src/lib/roster-view.ts`, `src/lib/dates.ts`
- Modify: `src/lib/airtable/rsvp.ts`
- Test: `src/lib/plus-one.test.ts`, `src/lib/roster-view.test.ts`, `src/lib/dates.test.ts`

**Interfaces:**
- Produces:
  - Types in `@/types/rsvp` (exact code below)
  - `MAX_PLUS_ONE_NAME_LENGTH = 100`, `storedPlusOneName(hasPlusOne: boolean, attending: 'yes' | 'no', plusOneName: string | undefined): string | null` from `@/lib/plus-one`
  - `toRosterHousehold(invitation: Invitation): RosterHousehold`, `withAnswers(household: RosterHousehold, answers: readonly RsvpAnswer[]): RosterHousehold` from `@/lib/roster-view`
  - `formatEventDate(isoDate: string | null): string | null` from `@/lib/dates`
  - `@/lib/airtable/rsvp` keeps exporting `RsvpAnswer` (type) and `MAX_PLUS_ONE_NAME_LENGTH`; all existing rsvp tests pass unchanged.

- [ ] **Step 1: Create the shared types**

`src/types/rsvp.ts`:
```ts
import type { Attendance } from '@/types/domain';

/** The only guest data the browser receives: no email, alt names, or response dates. */
export interface RosterGuest {
  id: string;
  name: string;
  hasPlusOne: boolean;
  attending: Attendance;
  plusOneName?: string;
}

export interface RosterHousehold {
  id: string;
  household: string;
  guests: RosterGuest[];
}

export interface RsvpAnswer {
  guestId: string;
  attending: 'yes' | 'no';
  plusOneName?: string;
}

export interface SubmitRsvpInput {
  invitationId: string;
  answers: RsvpAnswer[];
}

export type SearchGuestsResult =
  | { status: 'ok'; households: RosterHousehold[]; truncated: boolean }
  | { status: 'invalid-query' }
  | { status: 'error' };

export type SubmitRsvpResult =
  | { status: 'ok'; household: RosterHousehold }
  | { status: 'invalid' }
  | { status: 'error' };
```

- [ ] **Step 2: Write the failing tests**

`src/lib/plus-one.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { storedPlusOneName } from '@/lib/plus-one';

describe('storedPlusOneName', () => {
  it('keeps a trimmed name for an eligible guest who is attending', () => {
    expect(storedPlusOneName(true, 'yes', '  Priya Raman ')).toBe('Priya Raman');
  });

  it('clears the name when the guest is not attending', () => {
    expect(storedPlusOneName(true, 'no', 'Priya Raman')).toBeNull();
  });

  it('clears a blank or missing name', () => {
    expect(storedPlusOneName(true, 'yes', '   ')).toBeNull();
    expect(storedPlusOneName(true, 'yes', undefined)).toBeNull();
  });

  it('never keeps a name for a guest without plus-one eligibility', () => {
    expect(storedPlusOneName(false, 'yes', 'Sneaky Guest')).toBeNull();
  });
});
```

`src/lib/roster-view.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

const invitation: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  email: 'biggs@example.com',
  guests: [
    {
      id: id('Grant'),
      name: 'Grant Biggs',
      altNames: ['G-Man'],
      hasPlusOne: true,
      attending: 'yes',
      plusOneName: 'Priya Raman',
      respondedAt: '2026-09-10',
    },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

describe('toRosterHousehold', () => {
  it('keeps only what the RSVP page needs', () => {
    const household = toRosterHousehold(invitation);
    expect(household).toEqual({
      id: id('Biggs'),
      household: 'The Biggs Family',
      guests: [
        { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
        { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
      ],
    });
    const serialized = JSON.stringify(household);
    expect(serialized).not.toContain('biggs@example.com');
    expect(serialized).not.toContain('G-Man');
    expect(serialized).not.toContain('2026-09-10');
  });
});

describe('withAnswers', () => {
  const household = toRosterHousehold(invitation);

  it('applies attendance and the plus-one rule', () => {
    const updated = withAnswers(household, [
      { guestId: id('Grant'), attending: 'no', plusOneName: 'Priya Raman' },
      { guestId: id('Mario'), attending: 'yes', plusOneName: 'Ignored' },
    ]);
    expect(updated.guests).toEqual([
      { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'no' },
      { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'yes' },
    ]);
  });

  it('leaves guests without an answer unchanged', () => {
    const updated = withAnswers(household, [{ guestId: id('Mario'), attending: 'no' }]);
    expect(updated.guests[0]).toEqual(household.guests[0]);
  });
});
```

`src/lib/dates.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { formatEventDate } from '@/lib/dates';

describe('formatEventDate', () => {
  it('formats a date-only string as month and day', () => {
    expect(formatEventDate('2026-11-15')).toBe('November 15');
    expect(formatEventDate('2026-12-01')).toBe('December 1');
  });

  it('returns null for a missing or unparseable date', () => {
    expect(formatEventDate(null)).toBeNull();
    expect(formatEventDate('soon')).toBeNull();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/plus-one`, `@/lib/roster-view`, `@/lib/dates`.

- [ ] **Step 4: Implement**

`src/lib/plus-one.ts`:
```ts
export const MAX_PLUS_ONE_NAME_LENGTH = 100;

/** The plus-one name to store for an answer: a trimmed name when an eligible guest attends and names someone, otherwise null. */
export function storedPlusOneName(
  hasPlusOne: boolean,
  attending: 'yes' | 'no',
  plusOneName: string | undefined,
): string | null {
  if (!hasPlusOne || attending !== 'yes') return null;
  const trimmed = plusOneName?.trim() ?? '';
  return trimmed ? trimmed : null;
}
```

`src/lib/roster-view.ts`:
```ts
import { storedPlusOneName } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';
import type { RosterHousehold, RsvpAnswer } from '@/types/rsvp';

/** Projection sent to the browser. Never add email, alt names, or response dates here. */
export function toRosterHousehold(invitation: Invitation): RosterHousehold {
  return {
    id: invitation.id,
    household: invitation.household,
    guests: invitation.guests.map((guest) => ({
      id: guest.id,
      name: guest.name,
      hasPlusOne: guest.hasPlusOne,
      attending: guest.attending,
      plusOneName: guest.plusOneName,
    })),
  };
}

/** The household as it looks after the given answers are saved (used for the confirmation screen). */
export function withAnswers(household: RosterHousehold, answers: readonly RsvpAnswer[]): RosterHousehold {
  const answersByGuest = new Map(answers.map((answer) => [answer.guestId, answer]));
  return {
    ...household,
    guests: household.guests.map((guest) => {
      const answer = answersByGuest.get(guest.id);
      if (!answer) return guest;
      if (!guest.hasPlusOne) return { ...guest, attending: answer.attending };
      const plusOneName = storedPlusOneName(true, answer.attending, answer.plusOneName) ?? undefined;
      return { ...guest, attending: answer.attending, plusOneName };
    }),
  };
}
```

`src/lib/dates.ts`:
```ts
/** Formats a date-only ISO string ("2026-11-15") as "November 15" without shifting across time zones. */
export function formatEventDate(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}
```

- [ ] **Step 5: Point the Airtable write mapper at the shared rule and type**

In `src/lib/airtable/rsvp.ts`:
1. Replace the local `export const MAX_PLUS_ONE_NAME_LENGTH = 100;` and the local `export interface RsvpAnswer { ... }` with:
```ts
import { MAX_PLUS_ONE_NAME_LENGTH, storedPlusOneName } from '@/lib/plus-one';
import type { RsvpAnswer } from '@/types/rsvp';

export { MAX_PLUS_ONE_NAME_LENGTH };
export type { RsvpAnswer };
```
(Place the imports with the other imports at the top; keep the two `export` lines where the removed declarations were.)
2. Replace the body of the `if (guest.hasPlusOne) { ... }` block with:
```ts
    if (guest.hasPlusOne) {
      if ((answer.plusOneName?.trim() ?? '').length > MAX_PLUS_ONE_NAME_LENGTH) {
        throw new RsvpValidationError(`Plus-one name for guest ${guest.id} is too long`);
      }
      fields[G.plusOneName] = storedPlusOneName(true, answer.attending, answer.plusOneName);
    }
```
Nothing else in the file changes.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, including every existing `rsvp.test.ts` test unchanged.

- [ ] **Step 7: Lint, type-check, commit**

Run: `npm run lint` and `npx tsc --noEmit` (both clean), then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: RSVP roster projection, shared plus-one rule, date formatting"
```

---

### Task 2: Roster state (pure reducer)

**Files:**
- Create: `src/lib/roster-state.ts`
- Test: `src/lib/roster-state.test.ts`

**Interfaces:**
- Consumes: `RosterHousehold`, `RsvpAnswer` (`@/types/rsvp`).
- Produces (from `@/lib/roster-state`):
  - `interface GuestAnswerState { hasPlusOne: boolean; attending: 'yes' | 'no' | null; bringingGuest: boolean; plusOneName: string }`
  - `type RosterState = Record<string, GuestAnswerState>`
  - `type RosterAction = { type: 'setAttending'; guestId: string; attending: 'yes' | 'no' } | { type: 'setBringingGuest'; guestId: string; bringingGuest: boolean } | { type: 'setPlusOneName'; guestId: string; plusOneName: string }`
  - `interface RosterIssue { guestId: string; problem: 'unanswered' | 'missing-guest-name' }`
  - `initRosterState(household: RosterHousehold): RosterState`
  - `rosterReducer(state: RosterState, action: RosterAction): RosterState`
  - `partyHeadcount(state: RosterState): number`
  - `rosterIssues(household: RosterHousehold, state: RosterState): RosterIssue[]`
  - `toRsvpAnswers(household: RosterHousehold, state: RosterState): RsvpAnswer[]`

- [ ] **Step 1: Write the failing tests**

`src/lib/roster-state.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  initRosterState,
  partyHeadcount,
  rosterIssues,
  rosterReducer,
  toRsvpAnswers,
  type RosterAction,
  type RosterState,
} from '@/lib/roster-state';
import type { RosterHousehold } from '@/types/rsvp';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const GRANT = id('Grant');
const TRUMAN = id('Truman');
const MARIO = id('Mario');

const household: RosterHousehold = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  guests: [
    { id: GRANT, name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: TRUMAN, name: 'Truman Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
    { id: MARIO, name: 'Mario Biggs', hasPlusOne: false, attending: 'no' },
  ],
};

const apply = (state: RosterState, ...actions: RosterAction[]) => actions.reduce(rosterReducer, state);

describe('initRosterState', () => {
  it('hydrates a returning household with its current answers', () => {
    const state = initRosterState(household);
    expect(state[TRUMAN]).toEqual({ hasPlusOne: true, attending: 'yes', bringingGuest: true, plusOneName: 'Priya Raman' });
    expect(state[MARIO]).toEqual({ hasPlusOne: false, attending: 'no', bringingGuest: false, plusOneName: '' });
  });

  it('starts an unanswered guest empty', () => {
    expect(initRosterState(household)[GRANT]).toEqual({ hasPlusOne: true, attending: null, bringingGuest: false, plusOneName: '' });
  });
});

describe('rosterReducer: plus-one', () => {
  const start = initRosterState(household);

  it('reveals the guest name only after an eligible attending guest says they are bringing someone', () => {
    const attending = apply(start, { type: 'setAttending', guestId: GRANT, attending: 'yes' });
    expect(attending[GRANT].bringingGuest).toBe(false);

    const bringing = apply(attending, { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true });
    expect(bringing[GRANT].bringingGuest).toBe(true);

    const named = apply(bringing, { type: 'setPlusOneName', guestId: GRANT, plusOneName: 'Priya Raman' });
    expect(named[GRANT].plusOneName).toBe('Priya Raman');
  });

  it('clears the plus-one when the guest switches to not attending', () => {
    const state = apply(start, { type: 'setAttending', guestId: TRUMAN, attending: 'no' });
    expect(state[TRUMAN]).toMatchObject({ attending: 'no', bringingGuest: false, plusOneName: '' });
  });

  it('clears the name when the guest answers no to bringing someone', () => {
    const state = apply(start, { type: 'setBringingGuest', guestId: TRUMAN, bringingGuest: false });
    expect(state[TRUMAN]).toMatchObject({ bringingGuest: false, plusOneName: '' });
  });

  it('ignores plus-one changes for an ineligible guest or a guest who is not attending', () => {
    const ineligible = apply(
      start,
      { type: 'setAttending', guestId: MARIO, attending: 'yes' },
      { type: 'setBringingGuest', guestId: MARIO, bringingGuest: true },
    );
    expect(ineligible[MARIO].bringingGuest).toBe(false);

    const notAttending = apply(start, { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true });
    expect(notAttending[GRANT].bringingGuest).toBe(false);

    const noNameWithoutBringing = apply(start, { type: 'setPlusOneName', guestId: GRANT, plusOneName: 'Someone' });
    expect(noNameWithoutBringing[GRANT].plusOneName).toBe('');
  });

  it('ignores actions for unknown guests', () => {
    expect(apply(start, { type: 'setAttending', guestId: id('Stranger'), attending: 'yes' })).toBe(start);
  });
});

describe('partyHeadcount', () => {
  it('counts attending guests plus plus-ones that have a name', () => {
    const start = initRosterState(household);
    expect(partyHeadcount(start)).toBe(2); // Truman + Priya

    const grantBringingUnnamed = apply(
      start,
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true },
    );
    expect(partyHeadcount(grantBringingUnnamed)).toBe(3);

    const grantNamed = apply(grantBringingUnnamed, { type: 'setPlusOneName', guestId: GRANT, plusOneName: '  Ana  ' });
    expect(partyHeadcount(grantNamed)).toBe(4);
  });
});

describe('rosterIssues', () => {
  it('flags unanswered guests and plus-ones missing a name', () => {
    const start = initRosterState(household);
    expect(rosterIssues(household, start)).toEqual([{ guestId: GRANT, problem: 'unanswered' }]);

    const missingName = apply(
      start,
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true },
      { type: 'setPlusOneName', guestId: GRANT, plusOneName: '   ' },
    );
    expect(rosterIssues(household, missingName)).toEqual([{ guestId: GRANT, problem: 'missing-guest-name' }]);
  });
});

describe('toRsvpAnswers', () => {
  it('produces one answer per guest in roster order, with a plus-one name only when bringing someone', () => {
    const state = apply(
      initRosterState(household),
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setAttending', guestId: TRUMAN, attending: 'yes' },
      { type: 'setBringingGuest', guestId: TRUMAN, bringingGuest: false },
    );
    expect(toRsvpAnswers(household, state)).toEqual([
      { guestId: GRANT, attending: 'yes' },
      { guestId: TRUMAN, attending: 'yes' },
      { guestId: MARIO, attending: 'no' },
    ]);
  });

  it('includes the trimmed plus-one name for a guest bringing someone', () => {
    const state = initRosterState(household);
    expect(toRsvpAnswers(household, state)[1]).toEqual({ guestId: TRUMAN, attending: 'yes', plusOneName: 'Priya Raman' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/roster-state`.

- [ ] **Step 3: Implement**

`src/lib/roster-state.ts`:
```ts
import type { RosterHousehold, RsvpAnswer } from '@/types/rsvp';

export interface GuestAnswerState {
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  bringingGuest: boolean;
  plusOneName: string;
}

export type RosterState = Record<string, GuestAnswerState>;

export type RosterAction =
  | { type: 'setAttending'; guestId: string; attending: 'yes' | 'no' }
  | { type: 'setBringingGuest'; guestId: string; bringingGuest: boolean }
  | { type: 'setPlusOneName'; guestId: string; plusOneName: string };

export interface RosterIssue {
  guestId: string;
  problem: 'unanswered' | 'missing-guest-name';
}

/** Hydrates from current answers so returning guests see where they left off (DESIGN §6, editing). */
export function initRosterState(household: RosterHousehold): RosterState {
  return Object.fromEntries(
    household.guests.map((guest) => {
      const plusOneName = guest.hasPlusOne ? (guest.plusOneName ?? '') : '';
      return [
        guest.id,
        {
          hasPlusOne: guest.hasPlusOne,
          attending: guest.attending,
          bringingGuest: guest.hasPlusOne && guest.attending === 'yes' && plusOneName.trim() !== '',
          plusOneName,
        },
      ];
    }),
  );
}

function update(state: RosterState, guestId: string, next: GuestAnswerState): RosterState {
  return { ...state, [guestId]: next };
}

export function rosterReducer(state: RosterState, action: RosterAction): RosterState {
  const current = state[action.guestId];
  if (!current) return state;

  switch (action.type) {
    case 'setAttending':
      return action.attending === 'yes'
        ? update(state, action.guestId, { ...current, attending: 'yes' })
        : update(state, action.guestId, { ...current, attending: 'no', bringingGuest: false, plusOneName: '' });
    case 'setBringingGuest':
      if (!current.hasPlusOne || current.attending !== 'yes') return state;
      return update(state, action.guestId, {
        ...current,
        bringingGuest: action.bringingGuest,
        plusOneName: action.bringingGuest ? current.plusOneName : '',
      });
    case 'setPlusOneName':
      if (!current.bringingGuest) return state;
      return update(state, action.guestId, { ...current, plusOneName: action.plusOneName });
  }
}

function bringsNamedGuest(answer: GuestAnswerState): boolean {
  return answer.attending === 'yes' && answer.bringingGuest && answer.plusOneName.trim() !== '';
}

export function partyHeadcount(state: RosterState): number {
  return Object.values(state).reduce(
    (count, answer) => count + (answer.attending === 'yes' ? 1 : 0) + (bringsNamedGuest(answer) ? 1 : 0),
    0,
  );
}

export function rosterIssues(household: RosterHousehold, state: RosterState): RosterIssue[] {
  return household.guests.flatMap((guest): RosterIssue[] => {
    const answer = state[guest.id];
    if (!answer || answer.attending === null) return [{ guestId: guest.id, problem: 'unanswered' }];
    if (answer.attending === 'yes' && answer.bringingGuest && answer.plusOneName.trim() === '') {
      return [{ guestId: guest.id, problem: 'missing-guest-name' }];
    }
    return [];
  });
}

/** Call only when rosterIssues is empty; unanswered guests are skipped. */
export function toRsvpAnswers(household: RosterHousehold, state: RosterState): RsvpAnswer[] {
  return household.guests.flatMap((guest): RsvpAnswer[] => {
    const answer = state[guest.id];
    if (!answer || answer.attending === null) return [];
    return bringsNamedGuest(answer)
      ? [{ guestId: guest.id, attending: answer.attending, plusOneName: answer.plusOneName.trim() }]
      : [{ guestId: guest.id, attending: answer.attending }];
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Lint, type-check, commit**

Run: `npm run lint`, `npx tsc --noEmit`, then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: pure RSVP roster state with plus-one rules and headcount"
```

---

### Task 3: Server actions (search and submit)

**Files:**
- Create: `src/lib/rsvp-input.ts`, `src/server/actions/search-guests.ts`, `src/server/actions/submit-rsvp.ts`
- Test: `src/lib/rsvp-input.test.ts`, `src/server/actions/search-guests.test.ts`, `src/server/actions/submit-rsvp.test.ts`

**Interfaces:**
- Consumes: see "Existing interfaces"; `toRosterHousehold`, `withAnswers`; `MAX_PLUS_ONE_NAME_LENGTH`; types from `@/types/rsvp`.
- Produces:
  - `MAX_ANSWERS = 20`, `parseSubmitRsvpInput(input: unknown): SubmitRsvpInput | null` from `@/lib/rsvp-input`
  - `searchGuests(query: unknown): Promise<SearchGuestsResult>` from `@/server/actions/search-guests`
  - `submitRsvp(input: unknown): Promise<SubmitRsvpResult>` from `@/server/actions/submit-rsvp`

- [ ] **Step 1: Write the failing input-parsing tests**

`src/lib/rsvp-input.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { MAX_ANSWERS, parseSubmitRsvpInput } from '@/lib/rsvp-input';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const valid = {
  invitationId: id('Biggs'),
  answers: [
    { guestId: id('Grant'), attending: 'yes', plusOneName: 'Priya Raman' },
    { guestId: id('Mario'), attending: 'no' },
  ],
};

describe('parseSubmitRsvpInput', () => {
  it('accepts a well-formed submission', () => {
    expect(parseSubmitRsvpInput(valid)).toEqual(valid);
  });

  it('drops unexpected extra properties', () => {
    const parsed = parseSubmitRsvpInput({
      ...valid,
      extra: true,
      answers: [{ guestId: id('Mario'), attending: 'no', note: 'hi' }],
    });
    expect(parsed).toEqual({ invitationId: id('Biggs'), answers: [{ guestId: id('Mario'), attending: 'no' }] });
  });

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an array', [valid]],
    ['a missing invitation id', { answers: valid.answers }],
    ['a malformed invitation id', { ...valid, invitationId: 'recShort' }],
    ['answers that are not an array', { ...valid, answers: 'yes' }],
    ['no answers', { ...valid, answers: [] }],
    ['too many answers', { ...valid, answers: Array.from({ length: MAX_ANSWERS + 1 }, () => valid.answers[1]) }],
    ['a null answer', { ...valid, answers: [null] }],
    ['a malformed guest id', { ...valid, answers: [{ guestId: 42, attending: 'yes' }] }],
    ['an invalid attendance', { ...valid, answers: [{ guestId: id('Grant'), attending: 'maybe' }] }],
    ['a non-string plus-one name', { ...valid, answers: [{ guestId: id('Grant'), attending: 'yes', plusOneName: 7 }] }],
    ['an overlong plus-one name', { ...valid, answers: [{ guestId: id('Grant'), attending: 'yes', plusOneName: 'x'.repeat(101) }] }],
  ])('rejects %s', (_label, input) => {
    expect(parseSubmitRsvpInput(input)).toBeNull();
  });
});
```

- [ ] **Step 2: Write the failing action tests**

`src/server/actions/search-guests.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  requireSiteSession: vi.fn<() => Promise<void>>(),
  getInvitations: vi.fn<() => Promise<Invitation[]>>(),
}));

vi.mock('@/lib/auth', () => ({ requireSiteSession: mocks.requireSiteSession }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));

import { searchGuests } from '@/server/actions/search-guests';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

const biggs: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  email: 'biggs@example.com',
  guests: [
    { id: id('Grant'), name: 'Grant Biggs', altNames: ['G-Man'], hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman', respondedAt: '2026-09-10' },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSiteSession.mockResolvedValue(undefined);
  mocks.getInvitations.mockResolvedValue([biggs]);
});

describe('searchGuests', () => {
  it('returns matching households as roster projections only', async () => {
    const result = await searchGuests('Grant Biggs');
    expect(result).toEqual({
      status: 'ok',
      truncated: false,
      households: [
        {
          id: id('Biggs'),
          household: 'The Biggs Family',
          guests: [
            { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
            { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
          ],
        },
      ],
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('biggs@example.com');
    expect(serialized).not.toContain('G-Man');
    expect(serialized).not.toContain('2026-09-10');
  });

  it('checks the site session before reading the guest list', async () => {
    mocks.requireSiteSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(searchGuests('Grant Biggs')).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getInvitations).not.toHaveBeenCalled();
  });

  it.each([
    ['a single name', 'Biggs'],
    ['a non-string', 42],
    ['an overlong query', `${'a'.repeat(150)} Biggs`],
  ])('rejects %s without reading the guest list', async (_label, query) => {
    expect(await searchGuests(query)).toEqual({ status: 'invalid-query' });
    expect(mocks.getInvitations).not.toHaveBeenCalled();
  });

  it('passes through the truncated flag', async () => {
    mocks.getInvitations.mockResolvedValue(
      Array.from({ length: 11 }, (_, index) => ({
        id: id(`Lopez${index}`),
        household: `Lopez ${index}`,
        guests: [{ id: id(`Ana${index}`), name: 'Ana Lopez', hasPlusOne: false, attending: null }],
      })),
    );
    const result = await searchGuests('Ana Lopez');
    expect(result).toMatchObject({ status: 'ok', truncated: true });
    expect(result.status === 'ok' && result.households).toHaveLength(10);
  });

  it('reports an error when the guest list cannot be loaded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getInvitations.mockRejectedValue(new Error('Airtable down'));
    expect(await searchGuests('Grant Biggs')).toEqual({ status: 'error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
```

`src/server/actions/submit-rsvp.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordUpdate } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  requireSiteSession: vi.fn<() => Promise<void>>(),
  getInvitations: vi.fn<() => Promise<Invitation[]>>(),
  updateTag: vi.fn<(tag: string) => void>(),
  updateRecords: vi.fn<(tableId: string, updates: readonly RecordUpdate[]) => Promise<void>>(),
}));

vi.mock('@/lib/auth', () => ({ requireSiteSession: mocks.requireSiteSession }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag }));
vi.mock('@/lib/airtable/client', () => ({
  getAirtableClient: () => ({ listAllRecords: vi.fn(), updateRecords: mocks.updateRecords }),
}));

import { submitRsvp } from '@/server/actions/submit-rsvp';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const G = AIRTABLE.guests.fields;
const DATE = expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

const biggs: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  email: 'biggs@example.com',
  guests: [
    { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

const hunter: Invitation = {
  id: id('Hunter'),
  household: 'Bill & Traci Hunter',
  guests: [{ id: id('Bill'), name: 'Bill Hunter', hasPlusOne: false, attending: null }],
};

const validInput = {
  invitationId: biggs.id,
  answers: [
    { guestId: id('Grant'), attending: 'yes', plusOneName: ' Priya Raman ' },
    { guestId: id('Mario'), attending: 'no' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSiteSession.mockResolvedValue(undefined);
  mocks.getInvitations.mockResolvedValue([biggs, hunter]);
  mocks.updateRecords.mockResolvedValue(undefined);
});

function expectNoWrite() {
  expect(mocks.updateRecords).not.toHaveBeenCalled();
  expect(mocks.updateTag).not.toHaveBeenCalled();
}

describe('submitRsvp', () => {
  it('writes every answer, refreshes the guest list, and returns the saved household', async () => {
    const result = await submitRsvp(validInput);

    expect(mocks.updateRecords).toHaveBeenCalledWith(AIRTABLE.guests.tableId, [
      { id: id('Grant'), fields: { [G.attending]: 'Yes', [G.plusOneName]: 'Priya Raman', [G.respondedAt]: DATE } },
      { id: id('Mario'), fields: { [G.attending]: 'No', [G.respondedAt]: DATE } },
    ]);
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(result).toEqual({
      status: 'ok',
      household: {
        id: biggs.id,
        household: 'The Biggs Family',
        guests: [
          { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
          { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'no' },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain('biggs@example.com');
  });

  it('checks the site session before anything else', async () => {
    mocks.requireSiteSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(submitRsvp(validInput)).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getInvitations).not.toHaveBeenCalled();
    expectNoWrite();
  });

  it('rejects malformed input', async () => {
    expect(await submitRsvp({ invitationId: biggs.id, answers: 'yes' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects an invitation that does not exist', async () => {
    expect(await submitRsvp({ ...validInput, invitationId: id('Nobody') })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects answers for a guest from another household', async () => {
    const input = {
      invitationId: biggs.id,
      answers: [
        { guestId: id('Bill'), attending: 'yes' },
        { guestId: id('Mario'), attending: 'no' },
      ],
    };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects a submission that leaves a guest unanswered', async () => {
    const input = { invitationId: biggs.id, answers: [{ guestId: id('Grant'), attending: 'yes' }] };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('reports an error and skips the cache refresh when Airtable fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateRecords.mockRejectedValue(new Error('Airtable 503'));
    expect(await submitRsvp(validInput)).toEqual({ status: 'error' });
    expect(mocks.updateTag).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/rsvp-input`, `@/server/actions/search-guests`, `@/server/actions/submit-rsvp`.

- [ ] **Step 4: Implement input parsing**

`src/lib/rsvp-input.ts`:
```ts
import { MAX_PLUS_ONE_NAME_LENGTH } from '@/lib/plus-one';
import type { RsvpAnswer, SubmitRsvpInput } from '@/types/rsvp';

export const MAX_ANSWERS = 20;
const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAnswer(value: unknown): RsvpAnswer | null {
  if (!isRecord(value)) return null;
  const { guestId, attending, plusOneName } = value;
  if (typeof guestId !== 'string' || !RECORD_ID.test(guestId)) return null;
  if (attending !== 'yes' && attending !== 'no') return null;
  if (plusOneName === undefined) return { guestId, attending };
  if (typeof plusOneName !== 'string' || plusOneName.length > MAX_PLUS_ONE_NAME_LENGTH) return null;
  return { guestId, attending, plusOneName };
}

/** Parses untrusted server-action input. Returns null for anything malformed. */
export function parseSubmitRsvpInput(input: unknown): SubmitRsvpInput | null {
  if (!isRecord(input)) return null;
  const { invitationId, answers } = input;
  if (typeof invitationId !== 'string' || !RECORD_ID.test(invitationId)) return null;
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) return null;
  const parsed = answers.map(parseAnswer);
  if (!parsed.every((answer): answer is RsvpAnswer => answer !== null)) return null;
  return { invitationId, answers: parsed };
}
```

- [ ] **Step 5: Implement the search action**

`src/server/actions/search-guests.ts`:
```ts
'use server';

import { requireSiteSession } from '@/lib/auth';
import { getInvitations } from '@/lib/guest-list';
import { toRosterHousehold } from '@/lib/roster-view';
import { isSearchableQuery, searchInvitations } from '@/lib/search';
import type { SearchGuestsResult } from '@/types/rsvp';

const MAX_QUERY_LENGTH = 120;

export async function searchGuests(query: unknown): Promise<SearchGuestsResult> {
  await requireSiteSession();
  if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH || !isSearchableQuery(query)) {
    return { status: 'invalid-query' };
  }

  try {
    const { matches, truncated } = searchInvitations(await getInvitations(), query);
    return { status: 'ok', households: matches.map(toRosterHousehold), truncated };
  } catch (error) {
    console.error('searchGuests failed', error);
    return { status: 'error' };
  }
}
```

- [ ] **Step 6: Implement the submit action**

`src/server/actions/submit-rsvp.ts`:
```ts
'use server';

import { updateTag } from 'next/cache';
import { getAirtableClient } from '@/lib/airtable/client';
import { buildRsvpUpdates, respondedOnDate, RsvpValidationError, writeRsvp } from '@/lib/airtable/rsvp';
import { requireSiteSession } from '@/lib/auth';
import { getInvitations, GUEST_LIST_TAG } from '@/lib/guest-list';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import { parseSubmitRsvpInput } from '@/lib/rsvp-input';
import type { SubmitRsvpResult } from '@/types/rsvp';

export async function submitRsvp(input: unknown): Promise<SubmitRsvpResult> {
  await requireSiteSession();
  const parsed = parseSubmitRsvpInput(input);
  if (!parsed) return { status: 'invalid' };

  try {
    const invitation = (await getInvitations()).find((candidate) => candidate.id === parsed.invitationId);
    // One answer per guest: buildRsvpUpdates rejects strangers and duplicates, so equal counts mean full coverage.
    if (!invitation || parsed.answers.length !== invitation.guests.length) return { status: 'invalid' };

    const updates = buildRsvpUpdates(invitation, parsed.answers, respondedOnDate());
    await writeRsvp(getAirtableClient(), updates);
    updateTag(GUEST_LIST_TAG);

    return { status: 'ok', household: withAnswers(toRosterHousehold(invitation), parsed.answers) };
  } catch (error) {
    if (error instanceof RsvpValidationError) return { status: 'invalid' };
    console.error('submitRsvp failed', error);
    return { status: 'error' };
  }
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, and no stray console output (error logs in tests are spied and silenced).

- [ ] **Step 8: Lint, type-check, build, commit**

Run: `npm run lint`, `npx tsc --noEmit`, `npm run build` (all clean), then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: searchGuests and submitRsvp server actions with ownership checks"
```

---

### Task 4: Roster UI components

**Files:**
- Create: `src/components/rsvp/use-focus-on-mount.ts`, `src/components/rsvp/yes-no-toggle.tsx`, `src/components/rsvp/plus-one-field.tsx`, `src/components/rsvp/guest-row.tsx`, `src/components/rsvp/party-tally.tsx`, `src/components/rsvp/guest-roster.tsx`

**Interfaces:**
- Consumes: roster-state exports, `submitRsvp`, `MAX_PLUS_ONE_NAME_LENGTH`, `RosterHousehold`, `RosterGuest`, `Button`, `Input`, `Label`, `cn`.
- Produces:
  - `useFocusOnMount<T extends HTMLElement>(): RefObject<T | null>`
  - `YesNoToggle(props: { name: string; legend: string; value: 'yes' | 'no' | null; onChange: (value: 'yes' | 'no') => void; yesLabel?: string; noLabel?: string; legendClassName?: string })`
  - `PartyTally(props: { count: number })`
  - `GuestRoster(props: { household: RosterHousehold; backLabel: string; onBack: () => void; onSubmitted: (household: RosterHousehold) => void })`

No unit tests (logic is covered by Task 2 and 3 tests); verification is type-check, lint, and build.

- [ ] **Step 1: Focus hook**

`src/components/rsvp/use-focus-on-mount.ts`:
```ts
'use client';

import { useEffect, useRef } from 'react';

/** Moves keyboard and screen-reader focus to a step heading when the step appears. */
export function useFocusOnMount<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
```

- [ ] **Step 2: Yes/No toggle**

`src/components/rsvp/yes-no-toggle.tsx`:
```tsx
'use client';

import { cn } from '@/lib/utils';

interface YesNoToggleProps {
  name: string;
  legend: string;
  value: 'yes' | 'no' | null;
  onChange: (value: 'yes' | 'no') => void;
  yesLabel?: string;
  noLabel?: string;
  legendClassName?: string;
}

const OPTIONS = ['yes', 'no'] as const;

export function YesNoToggle({
  name,
  legend,
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
  legendClassName,
}: YesNoToggleProps) {
  return (
    <fieldset>
      <legend className={cn('mb-2 text-base font-medium', legendClassName)}>{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={cn(
                'flex h-12 cursor-pointer items-center justify-center rounded-lg border-2 px-2 text-center text-base font-semibold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                selected && option === 'yes' && 'border-success bg-success text-success-foreground',
                selected && option === 'no' && 'border-foreground bg-foreground text-background',
                !selected && 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option === 'yes' ? yesLabel : noLabel}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 3: Plus-one field**

`src/components/rsvp/plus-one-field.tsx`:
```tsx
'use client';

import { YesNoToggle } from '@/components/rsvp/yes-no-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_PLUS_ONE_NAME_LENGTH } from '@/lib/plus-one';

interface PlusOneFieldProps {
  guestId: string;
  guestName: string;
  bringingGuest: boolean;
  plusOneName: string;
  showNameError: boolean;
  onBringingGuestChange: (bringingGuest: boolean) => void;
  onPlusOneNameChange: (plusOneName: string) => void;
}

export function PlusOneField({
  guestId,
  guestName,
  bringingGuest,
  plusOneName,
  showNameError,
  onBringingGuestChange,
  onPlusOneNameChange,
}: PlusOneFieldProps) {
  const inputId = `plus-one-${guestId}`;
  const errorId = `${inputId}-error`;
  const firstName = guestName.split(' ')[0];

  return (
    <div className="space-y-3 rounded-lg bg-muted p-3">
      <YesNoToggle
        name={`bringing-${guestId}`}
        legend={`Is ${firstName} bringing a guest?`}
        value={bringingGuest ? 'yes' : 'no'}
        onChange={(value) => onBringingGuestChange(value === 'yes')}
      />
      {bringingGuest && (
        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-base">
            Guest&apos;s full name
          </Label>
          <Input
            id={inputId}
            value={plusOneName}
            maxLength={MAX_PLUS_ONE_NAME_LENGTH}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(event) => onPlusOneNameChange(event.target.value)}
            aria-invalid={showNameError || undefined}
            aria-describedby={showNameError ? errorId : undefined}
            className="h-12 bg-card text-lg"
          />
          {showNameError && (
            <p id={errorId} className="text-sm text-destructive">
              Please enter your guest&apos;s name, or choose No.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Guest row and tally**

`src/components/rsvp/guest-row.tsx`:
```tsx
'use client';

import { PlusOneField } from '@/components/rsvp/plus-one-field';
import { YesNoToggle } from '@/components/rsvp/yes-no-toggle';
import type { GuestAnswerState, RosterAction, RosterIssue } from '@/lib/roster-state';
import type { RosterGuest } from '@/types/rsvp';

interface GuestRowProps {
  guest: RosterGuest;
  answer: GuestAnswerState;
  issue?: RosterIssue['problem'];
  dispatch: (action: RosterAction) => void;
}

export function GuestRow({ guest, answer, issue, dispatch }: GuestRowProps) {
  return (
    <li className="space-y-3 rounded-xl border border-border bg-card p-4">
      <YesNoToggle
        name={`attending-${guest.id}`}
        legend={guest.name}
        legendClassName="text-lg font-semibold"
        value={answer.attending}
        yesLabel="Attending"
        noLabel="Can't make it"
        onChange={(attending) => dispatch({ type: 'setAttending', guestId: guest.id, attending })}
      />
      {issue === 'unanswered' && <p className="text-sm text-destructive">Please choose an answer for {guest.name}.</p>}
      {guest.hasPlusOne && answer.attending === 'yes' && (
        <PlusOneField
          guestId={guest.id}
          guestName={guest.name}
          bringingGuest={answer.bringingGuest}
          plusOneName={answer.plusOneName}
          showNameError={issue === 'missing-guest-name'}
          onBringingGuestChange={(bringingGuest) =>
            dispatch({ type: 'setBringingGuest', guestId: guest.id, bringingGuest })
          }
          onPlusOneNameChange={(plusOneName) => dispatch({ type: 'setPlusOneName', guestId: guest.id, plusOneName })}
        />
      )}
    </li>
  );
}
```

`src/components/rsvp/party-tally.tsx`:
```tsx
export function PartyTally({ count }: { count: number }) {
  return (
    <p aria-live="polite" className="text-center text-lg">
      <span className="font-display text-4xl text-primary">{count}</span>{' '}
      {count === 1 ? 'person' : 'people'} from your party attending
    </p>
  );
}
```

- [ ] **Step 5: Guest roster**

`src/components/rsvp/guest-roster.tsx`:
```tsx
'use client';

import { useReducer, useState, useTransition, type FormEvent } from 'react';
import { GuestRow } from '@/components/rsvp/guest-row';
import { PartyTally } from '@/components/rsvp/party-tally';
import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { Button } from '@/components/ui/button';
import { initRosterState, partyHeadcount, rosterIssues, rosterReducer, toRsvpAnswers } from '@/lib/roster-state';
import { submitRsvp } from '@/server/actions/submit-rsvp';
import type { RosterHousehold } from '@/types/rsvp';

interface GuestRosterProps {
  household: RosterHousehold;
  backLabel: string;
  onBack: () => void;
  onSubmitted: (household: RosterHousehold) => void;
}

const SUBMIT_ERRORS = {
  invalid: 'Your RSVP didn’t go through. Please search your name again and resubmit.',
  error: 'We couldn’t save your RSVP just now. Please try again in a moment.',
} as const;

export function GuestRoster({ household, backLabel, onBack, onSubmitted }: GuestRosterProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [state, dispatch] = useReducer(rosterReducer, household, initRosterState);
  const [showIssues, setShowIssues] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const issues = rosterIssues(household, state);
  const issueByGuest = new Map(issues.map((issue) => [issue.guestId, issue.problem]));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    if (issues.length > 0) {
      setShowIssues(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitRsvp({ invitationId: household.id, answers: toRsvpAnswers(household, state) });
        if (result.status === 'ok') onSubmitted(result.household);
        else setSubmitError(SUBMIT_ERRORS[result.status]);
      } catch {
        setSubmitError(SUBMIT_ERRORS.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl outline-none">
          {household.household}
        </h2>
        <p className="text-muted-foreground">Let us know who will be celebrating with us.</p>
      </div>
      <ul className="space-y-4">
        {household.guests.map((guest) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            answer={state[guest.id]}
            issue={showIssues ? issueByGuest.get(guest.id) : undefined}
            dispatch={dispatch}
          />
        ))}
      </ul>
      <PartyTally count={partyHeadcount(state)} />
      {showIssues && issues.length > 0 && (
        <p role="alert" className="text-center text-destructive">
          Please answer for everyone in your party.
        </p>
      )}
      {submitError && (
        <p role="alert" className="text-center text-destructive">
          {submitError}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Button type="submit" disabled={pending} className="h-12 w-full text-base">
          {pending ? 'Sending…' : 'Send RSVP'}
        </Button>
        <Button type="button" variant="ghost" onClick={onBack} className="h-12 w-full text-base">
          {backLabel}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit`, `npm run lint`, `npm run build`, `npm test` (all clean; the components are not yet used by a page, which is expected).
```bash
git add -A -- . ':!.claude'
git commit -m "feat: RSVP roster components with conditional plus-one and live tally"
```

---

### Task 5: Search, results, confirmation, flow, page

**Files:**
- Create: `src/components/rsvp/name-search-form.tsx`, `src/components/rsvp/result-card.tsx`, `src/components/rsvp/search-results.tsx`, `src/components/rsvp/rsvp-confirmation.tsx`, `src/components/rsvp/rsvp-flow.tsx`, `src/app/rsvp/page.tsx`
- Modify: `src/app/page.tsx`, `DESIGN.md`

**Interfaces:**
- Consumes: `searchGuests`, `isSearchableQuery`, `formatEventDate`, `siteConfig`, `GuestRoster`, `useFocusOnMount`, `Button`, `buttonVariants`, `Input`, `Label`, `RosterHousehold`.
- Produces:
  - `interface SearchOutcome { query: string; households: RosterHousehold[]; truncated: boolean }` and `NameSearchForm(props: { initialQuery?: string; onFound: (outcome: SearchOutcome) => void })`
  - `ResultCard`, `SearchResults(props: { outcome: SearchOutcome; onSelect: (household: RosterHousehold) => void; onSearchAgain: () => void })`
  - `RsvpConfirmation(props: { household: RosterHousehold; onDone: () => void })`
  - `RsvpFlow()`; route `/rsvp`

- [ ] **Step 1: Name search form**

`src/components/rsvp/name-search-form.tsx`:
```tsx
'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSearchableQuery } from '@/lib/search';
import { searchGuests } from '@/server/actions/search-guests';
import type { RosterHousehold } from '@/types/rsvp';

export interface SearchOutcome {
  query: string;
  households: RosterHousehold[];
  truncated: boolean;
}

const MESSAGES = {
  'invalid-query': 'Please enter the first and last name of someone in your party.',
  'no-match': 'We couldn’t find that name. Try it the way it appears on your invitation, or check the spelling.',
  error: 'Search isn’t working right now. Please try again in a moment.',
} as const;

export function NameSearchForm({ initialQuery = '', onFound }: { initialQuery?: string; onFound: (outcome: SearchOutcome) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSearchableQuery(query)) {
      setMessage(MESSAGES['invalid-query']);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await searchGuests(query);
        if (result.status !== 'ok') setMessage(MESSAGES[result.status]);
        else if (result.households.length === 0) setMessage(MESSAGES['no-match']);
        else onFound({ query, households: result.households, truncated: result.truncated });
      } catch {
        setMessage(MESSAGES.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest-name" className="text-base">
          Your first and last name
        </Label>
        <Input
          id="guest-name"
          name="guest-name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="search"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? 'guest-name-message' : undefined}
          className="h-12 bg-card text-lg"
        />
      </div>
      {message && (
        <p id="guest-name-message" role="alert" className="text-destructive">
          {message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Searching…' : 'Find my invitation'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Result card and results list**

`src/components/rsvp/result-card.tsx`:
```tsx
'use client';

import type { RosterHousehold } from '@/types/rsvp';

export function ResultCard({ household, onSelect }: { household: RosterHousehold; onSelect: (household: RosterHousehold) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(household)}
        className="w-full rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="block font-display text-xl">{household.household}</span>
        <span className="mt-1 block text-muted-foreground">{household.guests.map((guest) => guest.name).join(', ')}</span>
      </button>
    </li>
  );
}
```

`src/components/rsvp/search-results.tsx`:
```tsx
'use client';

import type { SearchOutcome } from '@/components/rsvp/name-search-form';
import { ResultCard } from '@/components/rsvp/result-card';
import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { Button } from '@/components/ui/button';
import type { RosterHousehold } from '@/types/rsvp';

interface SearchResultsProps {
  outcome: SearchOutcome;
  onSelect: (household: RosterHousehold) => void;
  onSearchAgain: () => void;
}

export function SearchResults({ outcome, onSelect, onSearchAgain }: SearchResultsProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl outline-none">
          Which party is yours?
        </h2>
        <p className="text-muted-foreground">We found more than one invitation for “{outcome.query}”.</p>
      </div>
      {outcome.truncated && (
        <p className="rounded-lg bg-muted p-3">
          Lots of guests share that name, so we’re only showing some. Try adding more of your name, like your full last name.
        </p>
      )}
      <ul className="space-y-3">
        {outcome.households.map((household) => (
          <ResultCard key={household.id} household={household} onSelect={onSelect} />
        ))}
      </ul>
      <Button type="button" variant="ghost" onClick={onSearchAgain} className="h-12 w-full text-base">
        Search a different name
      </Button>
    </div>
  );
}
```

- [ ] **Step 3: Confirmation**

`src/components/rsvp/rsvp-confirmation.tsx`:
```tsx
'use client';

import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { formatEventDate } from '@/lib/dates';
import type { RosterHousehold } from '@/types/rsvp';

export function RsvpConfirmation({ household, onDone }: { household: RosterHousehold; onDone: () => void }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const attending = household.guests.filter((guest) => guest.attending === 'yes');
  const declined = household.guests.filter((guest) => guest.attending === 'no');
  const deadline = formatEventDate(siteConfig.rsvpDeadline);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-5xl text-primary outline-none">
          ¡Gracias!
        </h2>
        <p className="text-lg">Your RSVP for {household.household} is saved.</p>
      </div>
      {attending.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 text-left">
          <h3 className="mb-2 font-semibold text-success">Celebrating with us</h3>
          <ul className="space-y-1 text-lg">
            {attending.map((guest) => (
              <li key={guest.id}>
                {guest.name}
                {guest.plusOneName && <span className="text-muted-foreground"> + {guest.plusOneName}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {declined.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 text-left">
          <h3 className="mb-2 font-semibold text-muted-foreground">Can&apos;t make it</h3>
          <ul className="space-y-1 text-lg">
            {declined.map((guest) => (
              <li key={guest.id}>{guest.name}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-muted-foreground">
        Plans change? Search your name again anytime{deadline ? ` before ${deadline}` : ''} to update your RSVP.
      </p>
      <Button type="button" variant="outline" onClick={onDone} className="h-12 w-full text-base">
        RSVP for another party
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Flow**

`src/components/rsvp/rsvp-flow.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { GuestRoster } from '@/components/rsvp/guest-roster';
import { NameSearchForm, type SearchOutcome } from '@/components/rsvp/name-search-form';
import { RsvpConfirmation } from '@/components/rsvp/rsvp-confirmation';
import { SearchResults } from '@/components/rsvp/search-results';
import type { RosterHousehold } from '@/types/rsvp';

type Step =
  | { name: 'search'; query: string }
  | { name: 'results'; outcome: SearchOutcome }
  | { name: 'roster'; household: RosterHousehold; outcome: SearchOutcome }
  | { name: 'done'; household: RosterHousehold };

export function RsvpFlow() {
  const [step, setStep] = useState<Step>({ name: 'search', query: '' });

  switch (step.name) {
    case 'search':
      return (
        <NameSearchForm
          initialQuery={step.query}
          onFound={(outcome) =>
            setStep(
              outcome.households.length === 1
                ? { name: 'roster', household: outcome.households[0], outcome }
                : { name: 'results', outcome },
            )
          }
        />
      );
    case 'results':
      return (
        <SearchResults
          outcome={step.outcome}
          onSelect={(household) => setStep({ name: 'roster', household, outcome: step.outcome })}
          onSearchAgain={() => setStep({ name: 'search', query: step.outcome.query })}
        />
      );
    case 'roster': {
      const { outcome } = step;
      const fromResults = outcome.households.length > 1;
      return (
        <GuestRoster
          key={step.household.id}
          household={step.household}
          backLabel={fromResults ? 'Back to search results' : 'Search a different name'}
          onBack={() => setStep(fromResults ? { name: 'results', outcome } : { name: 'search', query: outcome.query })}
          onSubmitted={(household) => setStep({ name: 'done', household })}
        />
      );
    }
    case 'done':
      return <RsvpConfirmation household={step.household} onDone={() => setStep({ name: 'search', query: '' })} />;
  }
}
```

- [ ] **Step 5: Page and home link**

`src/app/rsvp/page.tsx`:
```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { RsvpFlow } from '@/components/rsvp/rsvp-flow';
import { siteConfig } from '@/config/site';
import { formatEventDate } from '@/lib/dates';

export const metadata: Metadata = {
  title: `RSVP · ${siteConfig.name}`,
};

export default function RsvpPage() {
  const deadline = formatEventDate(siteConfig.rsvpDeadline);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <Link href="/" className="text-link underline-offset-4 hover:underline">
        ← {siteConfig.name}
      </Link>
      <header className="mt-6 mb-8 space-y-2">
        <h1 className="font-display text-5xl">RSVP</h1>
        <p className="text-lg text-muted-foreground">
          Type the first and last name of anyone in your party to find your invitation.
          {deadline && ` Please respond by ${deadline}.`}
        </p>
      </header>
      <RsvpFlow />
    </main>
  );
}
```

In `src/app/page.tsx`: replace the import `import { Button } from '@/components/ui/button';` with
```tsx
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
```
and replace `<Button size="lg">RSVP opens soon</Button>` with
```tsx
      <Link href="/rsvp" className={buttonVariants({ size: 'lg', className: 'h-12 px-8 text-base' })}>
        RSVP
      </Link>
```

- [ ] **Step 6: Update DESIGN.md**

1. §10 tree, under `lib/`, add entries (matching the tree's alignment style):
   `plus-one.ts  # shared plus-one rule`, `roster-view.ts  # RosterHousehold projection sent to the browser`, `roster-state.ts  # pure roster reducer, headcount, validation`, `rsvp-input.ts  # parses untrusted submit input`, `dates.ts  # date formatting`.
2. §10 tree, under `types/`: add `rsvp.ts  # client-safe RSVP types and action results`.
3. §6 "One route, client-driven": append: `Server actions return a RosterHousehold projection (id, household, and per guest: id, name, hasPlusOne, attending, plusOneName); contact emails, alt names, and response dates never reach the browser. submitRsvp requires exactly one answer per guest on the invitation.`

- [ ] **Step 7: Verify build, tests, lint**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`.
Expected: all pass; the build route table lists `/rsvp`.

- [ ] **Step 8: Verify the page renders behind the gate**

Start `npm run start` in the background (reads `.env.local`). Then:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/rsvp
```
Expected: `307 http://localhost:3000/unlock?next=%2Frsvp`.

Unlock with a no-JS form post the same way Phase 1 did (fetch `/unlock`, re-post its hidden `$ACTION_*` inputs plus `password` from `SITE_PASSWORD` using `curl -F` and a cookie jar in the scratchpad; read the password with a one-off `node -e` that loads `.env.local` via `process.loadEnvFile` and prints nothing else to the report). Then:
```bash
curl -s -b <jar> http://localhost:3000/rsvp | grep -o "Find my invitation"
```
Expected: `Find my invitation`. Stop the server. If the no-JS unlock proves impractical, skip it, note that in the report, and rely on the human browser check.

- [ ] **Step 9: Commit**

```bash
git add -A -- . ':!.claude'
git commit -m "feat: RSVP page with search, household selection, and confirmation"
```

- [ ] **Step 10: Human browser check (controller asks the user)**

On `npm run dev` or a Vercel preview, using the seeded sample data:
1. Search "Sofia Reyes" (no accent) → goes straight to the Daniel & Sofía Reyes roster.
2. Search "Susan Musgrove" → The Musgroves roster; existing answers (Sue Yes, Liam No) are pre-selected.
3. Search "Biggs" alone → "Please enter the first and last name…".
4. In The Biggs Family: Truman shows "Attending" is not yet chosen; choose Attending → "Is Truman bringing a guest?" appears; choose Yes → name box appears; the tally updates as the name is typed; choose "Can't make it" → plus-one area disappears.
5. Submit with someone unanswered → inline errors; answer everyone → "¡Gracias!" summary.
6. Search the same name again → roster shows the new answers; check the Airtable Guests table shows them with today's Responded At.
7. Keyboard only: Tab through the toggles, Space/arrow keys select, focus lands on each step heading.
8. Restore the sample data in Airtable afterwards if desired.

---

## Phase 3 Done When

- All unit tests, lint, tsc, and build pass; `/rsvp` is gated and renders.
- The human browser check passes on sample data.
- DESIGN.md documents the roster projection and new modules.

import Papa from 'papaparse';
import { RESPONSE_STATUS_LABELS } from '@/lib/admin/guest-rows';
import { toCalendarDay } from '@/lib/dates';
import { countedPlusOne } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';

// Both files are the hosts'. They differ in shape and in what is safe to pass on: the headcount
// is just who is coming, with no contact details, so it can be handed to venue staff. The guest
// list is the working copy and carries household emails, so it stays with the hosts.
export const HEADCOUNT_COLUMNS = ['Name', 'Household', 'Type', 'Guest Of', 'Responded'] as const;
export const GUEST_LIST_COLUMNS = [
  'Name',
  'Household',
  'Primary Last Name',
  'Status',
  'Plus One',
  'Responded',
  'Contact Email',
  'Source',
] as const;

/** Byte-order mark so Excel opens UTF-8 names (Sofía) correctly. */
export const UTF8_BOM = String.fromCharCode(0xfeff);

/** One row per person coming; each counted plus-one gets its own row right after their guest. */
export function toHeadcountRows(invitations: readonly Invitation[]): string[][] {
  return invitations.flatMap((invitation) =>
    invitation.guests
      .filter((guest) => guest.attending === 'yes')
      .flatMap((guest) => {
        const responded = toCalendarDay(guest.respondedAt ?? null) ?? '';
        const plusOne = countedPlusOne(guest);
        const rows = [[guest.name, invitation.household, 'Guest', '', responded]];
        if (plusOne) rows.push([plusOne, invitation.household, 'Plus-one', guest.name, responded]);
        return rows;
      }),
  );
}

/**
 * Built from invitations rather than the table's GuestRow, so the household email never has to
 * exist on a type that is also serialized to the browser.
 */
export function toGuestListRows(invitations: readonly Invitation[]): string[][] {
  return invitations.flatMap((invitation) =>
    invitation.guests.map((guest) => [
      guest.name,
      invitation.household,
      invitation.primaryLastName ?? '',
      RESPONSE_STATUS_LABELS[
        guest.attending === 'yes' ? 'attending' : guest.attending === 'no' ? 'declined' : 'awaiting'
      ],
      countedPlusOne(guest) ?? '',
      toCalendarDay(guest.respondedAt ?? null) ?? '',
      invitation.email ?? '',
      invitation.source ?? '',
    ]),
  );
}

const FORMULA_TRIGGER_CODES = [
  '='.charCodeAt(0),
  '+'.charCodeAt(0),
  '-'.charCodeAt(0),
  '@'.charCodeAt(0),
];
const SPACE_CODE = 32;
const TAB_CODE = 9;
const CR_CODE = 13;
const LF_CODE = 10;

/**
 * Prefixes a single quote when a spreadsheet would interpret the cell as a formula.
 * papaparse's own `escapeFormulae` uses a regex whose `.*$` doesn't match across a line
 * break, so a guest-typed value like `=1+1` followed by a newline slips through unescaped.
 * This pure check walks char codes instead, so it works regardless of embedded newlines.
 */
export function neutralizeCell(value: string): string {
  if (value.length === 0) return value;
  const firstCode = value.charCodeAt(0);
  if (firstCode === TAB_CODE || firstCode === CR_CODE || firstCode === LF_CODE) {
    return `'${value}`;
  }

  let index = 0;
  while (index < value.length && value.charCodeAt(index) === SPACE_CODE) {
    index += 1;
  }
  if (index >= value.length) return value;

  const firstNonSpaceCode = value.charCodeAt(index);
  return FORMULA_TRIGGER_CODES.includes(firstNonSpaceCode) ? `'${value}` : value;
}

export function toCsv(columns: readonly string[], rows: readonly (readonly string[])[]): string {
  return Papa.unparse({
    fields: [...columns],
    data: rows.map((row) => row.map((cell) => neutralizeCell(cell))),
  });
}

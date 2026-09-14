import Papa from 'papaparse';
import { RESPONSE_STATUS_LABELS, type GuestRow } from '@/lib/admin/guest-rows';
import { countedPlusOne } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';

export const HEADCOUNT_COLUMNS = ['Name', 'Household', 'Type', 'Guest Of', 'Responded'] as const;
export const GUEST_LIST_COLUMNS = ['Name', 'Household', 'Status', 'Plus One', 'Responded'] as const;

/** Byte-order mark so Excel opens UTF-8 names (Sofía) correctly. */
export const UTF8_BOM = String.fromCharCode(0xfeff);

/** One row per person coming; each counted plus-one gets its own row right after their guest. */
export function toHeadcountRows(invitations: readonly Invitation[]): string[][] {
  return invitations.flatMap((invitation) =>
    invitation.guests
      .filter((guest) => guest.attending === 'yes')
      .flatMap((guest) => {
        const responded = guest.respondedAt ?? '';
        const plusOne = countedPlusOne(guest);
        const rows = [[guest.name, invitation.household, 'Guest', '', responded]];
        if (plusOne) rows.push([plusOne, invitation.household, 'Plus-one', guest.name, responded]);
        return rows;
      }),
  );
}

export function toGuestListRows(rows: readonly GuestRow[]): string[][] {
  return rows.map((row) => [
    row.name,
    row.household,
    RESPONSE_STATUS_LABELS[row.status],
    row.plusOneName ?? '',
    row.respondedAt ?? '',
  ]);
}

export function toCsv(columns: readonly string[], rows: readonly (readonly string[])[]): string {
  return Papa.unparse({ fields: [...columns], data: rows.map((row) => [...row]) }, { escapeFormulae: true });
}

import 'server-only';
import { asc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { guests, invitations } from '@/lib/db/schema';
import type { Guest, Invitation } from '@/types/domain';

/**
 * The whole guest list in one query: one join rather than the paged fetch this replaced.
 *
 * Ordered by family name so the admin table and the CSV export read alphabetically without
 * sorting again, and guests within a household keep the order they were imported in.
 */
export async function getAllInvitations(): Promise<Invitation[]> {
  const sortKey = sql`lower(coalesce(${invitations.primaryLastName}, ${invitations.household}))`;

  const rows = await getDb()
    .select({
      id: invitations.id,
      household: invitations.household,
      primaryLastName: invitations.primaryLastName,
      contactEmail: invitations.contactEmail,
      source: invitations.source,
      guest: {
        id: guests.id,
        name: guests.name,
        altNames: guests.altNames,
        hasPlusOne: guests.hasPlusOne,
        attending: guests.attending,
        plusOneName: guests.plusOneName,
        respondedAt: guests.respondedAt,
      },
    })
    .from(invitations)
    .leftJoin(guests, eq(guests.invitationId, invitations.id))
    .orderBy(sortKey, asc(invitations.household), asc(guests.createdAt), asc(guests.name));

  return groupInvitationRows(rows);
}

export interface InvitationRow {
  id: string;
  household: string;
  primaryLastName: string | null;
  contactEmail: string | null;
  source: string | null;
  guest: GuestRow | null;
}

/**
 * Collapses the joined rows into one object per household, preserving row order. Exported for
 * tests: the LEFT JOIN emits a row with a null guest for a household that has none yet, and that
 * case is easy to get wrong and invisible until a half-created record reaches production.
 */
export function groupInvitationRows(rows: readonly InvitationRow[]): Invitation[] {
  const byId = new Map<string, Invitation>();
  for (const row of rows) {
    let invitation = byId.get(row.id);
    if (!invitation) {
      invitation = {
        id: row.id,
        household: row.household,
        ...(row.primaryLastName ? { primaryLastName: row.primaryLastName } : {}),
        ...(row.contactEmail ? { email: row.contactEmail } : {}),
        ...(row.source ? { source: row.source } : {}),
        guests: [],
      };
      byId.set(row.id, invitation);
    }
    if (row.guest?.id) invitation.guests.push(toGuest(row.guest));
  }
  return [...byId.values()];
}

type GuestRow = {
  id: string;
  name: string;
  altNames: string[];
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  plusOneName: string | null;
  respondedAt: Date | null;
};

function toGuest(row: GuestRow): Guest {
  return {
    id: row.id,
    name: row.name,
    // The column is NOT NULL DEFAULT '{}', so an empty array means "no alt names" and the
    // domain type leaves the field off entirely.
    ...(row.altNames.length > 0 ? { altNames: row.altNames } : {}),
    hasPlusOne: row.hasPlusOne,
    attending: row.attending,
    ...(row.plusOneName ? { plusOneName: row.plusOneName } : {}),
    ...(row.respondedAt ? { respondedAt: row.respondedAt.toISOString() } : {}),
  };
}

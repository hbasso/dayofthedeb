import { countedPlusOne } from '@/lib/plus-one';
import { normalizeName } from '@/lib/search';
import type { Invitation } from '@/types/domain';

export type ResponseStatus = 'attending' | 'declined' | 'awaiting';

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  attending: 'Attending',
  declined: 'Declined',
  awaiting: 'Awaiting',
};

export interface GuestRow {
  guestId: string;
  invitationId: string;
  name: string;
  household: string;
  status: ResponseStatus;
  hasPlusOne: boolean;
  plusOneName?: string;
  respondedAt?: string;
}

export interface HouseholdOption {
  id: string;
  household: string;
}

export interface GuestFilters {
  status: ResponseStatus | 'all';
  /** '' means every household. */
  invitationId: string;
  query: string;
}

export const NO_FILTERS: GuestFilters = { status: 'all', invitationId: '', query: '' };

export function toStatusFilter(value: string): GuestFilters['status'] {
  return value === 'attending' || value === 'declined' || value === 'awaiting' ? value : 'all';
}

export function toGuestRows(invitations: readonly Invitation[]): GuestRow[] {
  return invitations.flatMap((invitation) =>
    invitation.guests.map((guest) => ({
      guestId: guest.id,
      invitationId: invitation.id,
      name: guest.name,
      household: invitation.household,
      status: guest.attending === 'yes' ? 'attending' : guest.attending === 'no' ? 'declined' : 'awaiting',
      hasPlusOne: guest.hasPlusOne,
      plusOneName: countedPlusOne(guest) ?? undefined,
      respondedAt: guest.respondedAt,
    })),
  );
}

export function toHouseholdOptions(invitations: readonly Invitation[]): HouseholdOption[] {
  return invitations.map((invitation) => ({ id: invitation.id, household: invitation.household }));
}

export function filterGuestRows(rows: readonly GuestRow[], filters: GuestFilters): GuestRow[] {
  const query = normalizeName(filters.query);
  return rows.filter(
    (row) =>
      (filters.status === 'all' || row.status === filters.status) &&
      (filters.invitationId === '' || row.invitationId === filters.invitationId) &&
      (query === '' || normalizeName(`${row.name} ${row.plusOneName ?? ''}`).includes(query)),
  );
}

export interface DuplicateName {
  name: string;
  households: string[];
}

/** Guest names (compared like search does) that appear in more than one household. */
export function findDuplicateNames(invitations: readonly Invitation[]): DuplicateName[] {
  const byName = new Map<string, { name: string; households: Map<string, string> }>();
  for (const invitation of invitations) {
    for (const guest of invitation.guests) {
      const key = normalizeName(guest.name);
      const entry = byName.get(key) ?? { name: guest.name, households: new Map<string, string>() };
      entry.households.set(invitation.id, invitation.household);
      byName.set(key, entry);
    }
  }
  return [...byName.values()]
    .filter((entry) => entry.households.size > 1)
    .map((entry) => ({ name: entry.name, households: [...entry.households.values()] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}

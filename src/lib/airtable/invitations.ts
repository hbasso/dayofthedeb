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
    .sort((a, b) => a.household.localeCompare(b.household, 'en'));
}

export async function fetchInvitations(client: AirtableClient): Promise<Invitation[]> {
  // Sequential on purpose: stays well inside Airtable's 5 requests/second per base.
  const invitationRecords = await client.listAllRecords(AIRTABLE.invitations.tableId, Object.values(I));
  const guestRecords = await client.listAllRecords(AIRTABLE.guests.tableId, Object.values(G));
  return toInvitations(invitationRecords, guestRecords);
}

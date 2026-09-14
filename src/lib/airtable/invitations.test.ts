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

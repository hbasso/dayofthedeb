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

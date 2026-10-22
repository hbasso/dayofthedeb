import { describe, expect, it } from 'vitest';
import { groupInvitationRows, type InvitationRow } from '@/lib/db/queries';

const guest = (over: Partial<NonNullable<InvitationRow['guest']>> = {}) => ({
  id: 'g1',
  name: 'Grant Biggs',
  altNames: [] as string[],
  hasPlusOne: false,
  attending: null,
  plusOneName: null,
  respondedAt: null,
  ...over,
});

const row = (over: Partial<InvitationRow> = {}): InvitationRow => ({
  id: 'inv1',
  household: 'The Biggs Family',
  primaryLastName: null,
  contactEmail: null,
  source: null,
  guest: guest(),
  ...over,
});

describe('groupInvitationRows', () => {
  it('collapses the joined rows into one household per invitation, in row order', () => {
    const result = groupInvitationRows([
      row({ guest: guest({ id: 'g1', name: 'Grant Biggs' }) }),
      row({ guest: guest({ id: 'g2', name: 'Mario Biggs' }) }),
      row({ id: 'inv2', household: 'Sue Katzen', guest: guest({ id: 'g3', name: 'Sue Katzen' }) }),
    ]);

    expect(result.map((invitation) => invitation.household)).toEqual(['The Biggs Family', 'Sue Katzen']);
    expect(result[0].guests.map((g) => g.name)).toEqual(['Grant Biggs', 'Mario Biggs']);
  });

  it('keeps a household whose LEFT JOIN produced a null guest, with an empty roster', () => {
    const result = groupInvitationRows([row({ id: 'empty', household: 'Half-created row', guest: null })]);
    expect(result).toEqual([{ id: 'empty', household: 'Half-created row', guests: [] }]);
  });

  it('omits optional household fields rather than carrying nulls into the domain type', () => {
    expect(groupInvitationRows([row()])[0]).toEqual({
      id: 'inv1',
      household: 'The Biggs Family',
      guests: [{ id: 'g1', name: 'Grant Biggs', hasPlusOne: false, attending: null }],
    });
  });

  it('maps the host-owned household fields when they are set', () => {
    const [invitation] = groupInvitationRows([
      row({ primaryLastName: 'Biggs', contactEmail: 'biggs@example.com', source: 'Basso' }),
    ]);
    expect(invitation).toMatchObject({ primaryLastName: 'Biggs', email: 'biggs@example.com', source: 'Basso' });
  });

  it('treats an empty alt-names array as no alt names', () => {
    const [withNone] = groupInvitationRows([row({ guest: guest({ altNames: [] }) })]);
    const [withSome] = groupInvitationRows([row({ guest: guest({ altNames: ['Susan'] }) })]);
    expect(withNone.guests[0].altNames).toBeUndefined();
    expect(withSome.guests[0].altNames).toEqual(['Susan']);
  });

  it('renders responded_at as an ISO timestamp the date helpers can read', () => {
    const [invitation] = groupInvitationRows([
      row({ guest: guest({ attending: 'yes', plusOneName: 'Priya', respondedAt: new Date('2026-12-01T18:30:00Z') }) }),
    ]);
    expect(invitation.guests[0]).toMatchObject({
      attending: 'yes',
      plusOneName: 'Priya',
      respondedAt: '2026-12-01T18:30:00.000Z',
    });
  });
});

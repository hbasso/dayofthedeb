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
import type { RsvpAnswer } from '@/lib/airtable/rsvp';
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

  it('rejects a non-array answers value', () => {
    expect(() => buildRsvpUpdates(invitation, { guestId: 'recGrant' } as unknown as RsvpAnswer[], DAY)).toThrow(
      RsvpValidationError,
    );
  });

  it('rejects a null answer', () => {
    expect(() => buildRsvpUpdates(invitation, [null] as unknown as RsvpAnswer[], DAY)).toThrow(RsvpValidationError);
  });

  it('rejects a non-object answer', () => {
    expect(() => buildRsvpUpdates(invitation, ['nope'] as unknown as RsvpAnswer[], DAY)).toThrow(RsvpValidationError);
  });

  it('rejects a non-string guestId', () => {
    expect(() => buildRsvpUpdates(invitation, [{ guestId: 123, attending: 'yes' }] as unknown as RsvpAnswer[], DAY)).toThrow(
      RsvpValidationError,
    );
  });

  it('rejects a non-string plusOneName', () => {
    const answers = [{ guestId: 'recGrant', attending: 'yes', plusOneName: 42 }] as unknown as RsvpAnswer[];
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

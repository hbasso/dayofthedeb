import { describe, expect, it } from 'vitest';
import { assertStorableEmail, buildRsvpUpdates, RsvpValidationError } from '@/lib/db/rsvp';
import type { Invitation } from '@/types/domain';

const invitation: Invitation = {
  id: 'inv1',
  household: 'The Biggs Family',
  guests: [
    { id: 'grant', name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: 'mario', name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

const rejects = (answers: unknown) =>
  expect(() => buildRsvpUpdates(invitation, answers as never)).toThrow(RsvpValidationError);

describe('buildRsvpUpdates', () => {
  it('maps answers to one update per guest', () => {
    expect(
      buildRsvpUpdates(invitation, [
        { guestId: 'grant', attending: 'yes', plusOneName: ' Priya Raman ' },
        { guestId: 'mario', attending: 'no' },
      ]),
    ).toEqual([
      { id: 'grant', attending: 'yes', plusOneName: 'Priya Raman' },
      { id: 'mario', attending: 'no' },
    ]);
  });

  it('clears the plus-one when the guest who was offered one declines', () => {
    expect(buildRsvpUpdates(invitation, [{ guestId: 'grant', attending: 'no', plusOneName: 'Priya' }])).toEqual([
      { id: 'grant', attending: 'no', plusOneName: null },
    ]);
  });

  it('clears the plus-one when the name is blank', () => {
    expect(buildRsvpUpdates(invitation, [{ guestId: 'grant', attending: 'yes', plusOneName: '   ' }])).toEqual([
      { id: 'grant', attending: 'yes', plusOneName: null },
    ]);
  });

  it('never writes a plus-one for a guest who was not offered one', () => {
    const [update] = buildRsvpUpdates(invitation, [{ guestId: 'mario', attending: 'yes', plusOneName: 'Gatecrasher' }]);
    expect(update).toEqual({ id: 'mario', attending: 'yes' });
    expect('plusOneName' in update).toBe(false);
  });

  it('rejects a guest from another household', () => {
    rejects([{ guestId: 'someone-else', attending: 'yes' }]);
  });

  it('rejects a duplicate answer for the same guest', () => {
    rejects([
      { guestId: 'grant', attending: 'yes' },
      { guestId: 'grant', attending: 'no' },
    ]);
  });

  it('rejects an unanswered or malformed attendance', () => {
    rejects([{ guestId: 'grant', attending: null }]);
    rejects([{ guestId: 'grant', attending: 'maybe' }]);
    rejects([{ guestId: 'grant' }]);
  });

  it('rejects malformed answers', () => {
    rejects('nope');
    rejects([null]);
    rejects([{ guestId: 42, attending: 'yes' }]);
    rejects([{ guestId: 'grant', attending: 'yes', plusOneName: 7 }]);
  });

  it('rejects an overlong plus-one name', () => {
    rejects([{ guestId: 'grant', attending: 'yes', plusOneName: 'a'.repeat(200) }]);
  });
});

describe('assertStorableEmail', () => {
  it('accepts a plausible address', () => {
    expect(() => assertStorableEmail(invitation, 'host@example.com')).not.toThrow();
  });

  it('refuses anything else, even though the action already checked', () => {
    expect(() => assertStorableEmail(invitation, 'not-an-email')).toThrow(RsvpValidationError);
  });
});

import { describe, expect, it } from 'vitest';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

const invitation: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  email: 'biggs@example.com',
  guests: [
    {
      id: id('Grant'),
      name: 'Grant Biggs',
      altNames: ['G-Man'],
      hasPlusOne: true,
      attending: 'yes',
      plusOneName: 'Priya Raman',
      respondedAt: '2026-09-10',
    },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

describe('toRosterHousehold', () => {
  it('keeps only what the RSVP page needs', () => {
    const household = toRosterHousehold(invitation);
    expect(household).toEqual({
      id: id('Biggs'),
      household: 'The Biggs Family',
      guests: [
        { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
        { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
      ],
    });
    const serialized = JSON.stringify(household);
    expect(serialized).not.toContain('biggs@example.com');
    expect(serialized).not.toContain('G-Man');
    expect(serialized).not.toContain('2026-09-10');
  });
});

describe('withAnswers', () => {
  const household = toRosterHousehold(invitation);

  it('applies attendance and the plus-one rule', () => {
    const updated = withAnswers(household, [
      { guestId: id('Grant'), attending: 'no', plusOneName: 'Priya Raman' },
      { guestId: id('Mario'), attending: 'yes', plusOneName: 'Ignored' },
    ]);
    expect(updated.guests).toEqual([
      { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'no' },
      { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'yes' },
    ]);
  });

  it('leaves guests without an answer unchanged', () => {
    const updated = withAnswers(household, [{ guestId: id('Mario'), attending: 'no' }]);
    expect(updated.guests[0]).toEqual(household.guests[0]);
  });
});

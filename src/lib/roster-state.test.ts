import { describe, expect, it } from 'vitest';
import {
  initRosterState,
  partyHeadcount,
  rosterIssues,
  rosterReducer,
  toRsvpAnswers,
  type RosterAction,
  type RosterState,
} from '@/lib/roster-state';
import type { RosterHousehold } from '@/types/rsvp';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const GRANT = id('Grant');
const TRUMAN = id('Truman');
const MARIO = id('Mario');

const household: RosterHousehold = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  guests: [
    { id: GRANT, name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: TRUMAN, name: 'Truman Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
    { id: MARIO, name: 'Mario Biggs', hasPlusOne: false, attending: 'no' },
  ],
};

const apply = (state: RosterState, ...actions: RosterAction[]) => actions.reduce(rosterReducer, state);

describe('initRosterState', () => {
  it('hydrates a returning household with its current answers', () => {
    const state = initRosterState(household);
    expect(state[TRUMAN]).toEqual({ hasPlusOne: true, attending: 'yes', bringingGuest: true, plusOneName: 'Priya Raman' });
    expect(state[MARIO]).toEqual({ hasPlusOne: false, attending: 'no', bringingGuest: false, plusOneName: '' });
  });

  it('starts an unanswered guest empty', () => {
    expect(initRosterState(household)[GRANT]).toEqual({ hasPlusOne: true, attending: null, bringingGuest: false, plusOneName: '' });
  });
});

describe('rosterReducer: plus-one', () => {
  const start = initRosterState(household);

  it('reveals the guest name only after an eligible attending guest says they are bringing someone', () => {
    const attending = apply(start, { type: 'setAttending', guestId: GRANT, attending: 'yes' });
    expect(attending[GRANT].bringingGuest).toBe(false);

    const bringing = apply(attending, { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true });
    expect(bringing[GRANT].bringingGuest).toBe(true);

    const named = apply(bringing, { type: 'setPlusOneName', guestId: GRANT, plusOneName: 'Priya Raman' });
    expect(named[GRANT].plusOneName).toBe('Priya Raman');
  });

  it('clears the plus-one when the guest switches to not attending', () => {
    const state = apply(start, { type: 'setAttending', guestId: TRUMAN, attending: 'no' });
    expect(state[TRUMAN]).toMatchObject({ attending: 'no', bringingGuest: false, plusOneName: '' });
  });

  it('clears the name when the guest answers no to bringing someone', () => {
    const state = apply(start, { type: 'setBringingGuest', guestId: TRUMAN, bringingGuest: false });
    expect(state[TRUMAN]).toMatchObject({ bringingGuest: false, plusOneName: '' });
  });

  it('ignores plus-one changes for an ineligible guest or a guest who is not attending', () => {
    const ineligible = apply(
      start,
      { type: 'setAttending', guestId: MARIO, attending: 'yes' },
      { type: 'setBringingGuest', guestId: MARIO, bringingGuest: true },
    );
    expect(ineligible[MARIO].bringingGuest).toBe(false);

    const notAttending = apply(start, { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true });
    expect(notAttending[GRANT].bringingGuest).toBe(false);

    const noNameWithoutBringing = apply(start, { type: 'setPlusOneName', guestId: GRANT, plusOneName: 'Someone' });
    expect(noNameWithoutBringing[GRANT].plusOneName).toBe('');
  });

  it('ignores actions for unknown guests', () => {
    expect(apply(start, { type: 'setAttending', guestId: id('Stranger'), attending: 'yes' })).toBe(start);
  });
});

describe('partyHeadcount', () => {
  it('counts attending guests plus plus-ones that have a name', () => {
    const start = initRosterState(household);
    expect(partyHeadcount(start)).toBe(2); // Truman + Priya

    const grantBringingUnnamed = apply(
      start,
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true },
    );
    expect(partyHeadcount(grantBringingUnnamed)).toBe(3);

    const grantNamed = apply(grantBringingUnnamed, { type: 'setPlusOneName', guestId: GRANT, plusOneName: '  Ana  ' });
    expect(partyHeadcount(grantNamed)).toBe(4);
  });
});

describe('rosterIssues', () => {
  it('flags unanswered guests and plus-ones missing a name', () => {
    const start = initRosterState(household);
    expect(rosterIssues(household, start)).toEqual([{ guestId: GRANT, problem: 'unanswered' }]);

    const missingName = apply(
      start,
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setBringingGuest', guestId: GRANT, bringingGuest: true },
      { type: 'setPlusOneName', guestId: GRANT, plusOneName: '   ' },
    );
    expect(rosterIssues(household, missingName)).toEqual([{ guestId: GRANT, problem: 'missing-guest-name' }]);
  });
});

describe('toRsvpAnswers', () => {
  it('produces one answer per guest in roster order, with a plus-one name only when bringing someone', () => {
    const state = apply(
      initRosterState(household),
      { type: 'setAttending', guestId: GRANT, attending: 'yes' },
      { type: 'setAttending', guestId: TRUMAN, attending: 'yes' },
      { type: 'setBringingGuest', guestId: TRUMAN, bringingGuest: false },
    );
    expect(toRsvpAnswers(household, state)).toEqual([
      { guestId: GRANT, attending: 'yes' },
      { guestId: TRUMAN, attending: 'yes' },
      { guestId: MARIO, attending: 'no' },
    ]);
  });

  it('includes the trimmed plus-one name for a guest bringing someone', () => {
    const state = initRosterState(household);
    expect(toRsvpAnswers(household, state)[1]).toEqual({ guestId: TRUMAN, attending: 'yes', plusOneName: 'Priya Raman' });
  });
});

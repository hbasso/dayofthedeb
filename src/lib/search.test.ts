import { describe, expect, it } from 'vitest';
import { isSearchableQuery, MAX_SEARCH_RESULTS, normalizeName, searchInvitations } from '@/lib/search';
import type { Guest, Invitation } from '@/types/domain';

const guest = (id: string, name: string, altNames?: string[]): Guest => ({
  id,
  name,
  altNames,
  hasPlusOne: false,
  attending: null,
});

const invitations: Invitation[] = [
  { id: 'inv1', household: 'Daniel & Sofía Reyes', guests: [guest('g1', 'Daniel Reyes'), guest('g2', 'Sofía Reyes')] },
  { id: 'inv2', household: 'The Reyes Family', guests: [guest('g3', 'Sofia Reyes'), guest('g4', 'Mateo Reyes')] },
  { id: 'inv3', household: 'The Musgroves', guests: [guest('g5', 'Sue Musgrove', ['Susan']), guest('g6', 'Emma Musgrove')] },
  {
    id: 'inv4',
    household: "The O'Brien-Garzas",
    guests: [guest('g7', "Liam O'Brien-Garza"), guest('g8', 'María de la Garza')],
  },
  { id: 'inv5', household: 'Héctor Salinas', guests: [guest('g9', 'Héctor Salinas')] },
];

const households = (query: string) => searchInvitations(invitations, query).map((invitation) => invitation.id);

describe('normalizeName', () => {
  it('lowercases, strips accents, and collapses spacing', () => {
    expect(normalizeName('  MARÍA  de   la Garza ')).toBe('maria de la garza');
    expect(normalizeName('Héctor')).toBe('hector');
  });

  it('drops apostrophes and periods and splits on hyphens', () => {
    expect(normalizeName("Liam O'Brien-Garza")).toBe('liam obrien garza');
    expect(normalizeName('Liam O’Brien Jr.')).toBe('liam obrien jr');
  });
});

describe('searchInvitations', () => {
  it('finds a household by one member’s full name', () => {
    expect(households('Emma Musgrove')).toEqual(['inv3']);
  });

  it('ignores case and extra spaces', () => {
    expect(households('  emma   MUSGROVE ')).toEqual(['inv3']);
  });

  it('matches accented names with or without the accent', () => {
    expect(households('Hector Salinas')).toEqual(['inv5']);
    expect(households('Héctor Salinas')).toEqual(['inv5']);
  });

  it('matches nicknames from alt names', () => {
    expect(households('Susan Musgrove')).toEqual(['inv3']);
  });

  it('matches partial names by prefix', () => {
    expect(households('Dan Reyes')).toEqual(['inv1']);
  });

  it('returns every household with a match when surnames collide', () => {
    expect(households('Sofia Reyes')).toEqual(['inv1', 'inv2']);
  });

  it('lists a household once even when several members match', () => {
    expect(households('Reyes Reyes')).toEqual(['inv1', 'inv2']);
  });

  it('handles punctuation and multi-part surnames', () => {
    expect(households('Liam OBrien')).toEqual(['inv4']);
    expect(households('Maria Garza')).toEqual(['inv4']);
  });

  it('never matches on the household label', () => {
    expect(households('The Musgroves')).toEqual([]);
  });

  it('requires at least a first and last name', () => {
    expect(isSearchableQuery('Musgrove')).toBe(false);
    expect(isSearchableQuery('Emma Musgrove')).toBe(true);
    expect(households('Musgrove')).toEqual([]);
    expect(households('   ')).toEqual([]);
  });

  it('returns nothing when no guest matches', () => {
    expect(households('Nobody Here')).toEqual([]);
  });

  it('returns the full roster of a matched household', () => {
    expect(searchInvitations(invitations, 'Emma Musgrove')[0].guests).toHaveLength(2);
  });

  it('caps the number of results', () => {
    const many = Array.from({ length: 15 }, (_, index) => ({
      id: `many${index}`,
      household: `Lopez ${index}`,
      guests: [guest(`m${index}`, 'Ana Lopez')],
    }));
    expect(MAX_SEARCH_RESULTS).toBe(10);
    expect(searchInvitations(many, 'Ana Lopez')).toHaveLength(10);
  });
});

import { describe, expect, it } from 'vitest';
import {
  isSearchableQuery,
  MAX_QUERY_TOKENS,
  MAX_SEARCH_RESULTS,
  MIN_TOKEN_LENGTH,
  normalizeName,
  searchInvitations,
} from '@/lib/search';
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

const households = (query: string) => searchInvitations(invitations, query).matches.map((invitation) => invitation.id);

describe('normalizeName', () => {
  it('lowercases, strips accents, and collapses spacing', () => {
    expect(normalizeName('  MARÍA  de   la Garza ')).toBe('maria de la garza');
    expect(normalizeName('Héctor')).toBe('hector');
  });

  it('folds Latin letters that NFD leaves whole, so they are not blanked out', () => {
    expect(normalizeName('Bjørn Dahl')).toBe('bjorn dahl');
    expect(normalizeName('Ædan')).toBe('aedan');
    expect(normalizeName('Straße')).toBe('strasse');
    expect(normalizeName('Łukasz')).toBe('lukasz');
  });

  it('drops apostrophes and periods and splits on hyphens', () => {
    expect(normalizeName("Liam O'Brien-Garza")).toBe('liam obrien garza');
    expect(normalizeName('Liam O’Brien Jr.')).toBe('liam obrien jr');
  });
});

describe('isSearchableQuery', () => {
  it('accepts a single name, so a last name on its own can be searched', () => {
    expect(isSearchableQuery('Musgrove')).toBe(true);
    expect(isSearchableQuery('Emma Musgrove')).toBe(true);
    expect(isSearchableQuery('')).toBe(false);
    expect(isSearchableQuery('   ')).toBe(false);
  });

  it('ignores words shorter than MIN_TOKEN_LENGTH instead of refusing the query', () => {
    expect(MIN_TOKEN_LENGTH).toBe(2);
    expect(isSearchableQuery('Dan Reyes')).toBe(true);
    expect(isSearchableQuery('Ng')).toBe(true);
    expect(isSearchableQuery('Grant E Biggs')).toBe(true);
    expect(isSearchableQuery('Maria J. Garcia')).toBe(true);
    expect(isSearchableQuery('D Reyes')).toBe(true);
  });

  it('still refuses a query with no word long enough to match on', () => {
    expect(isSearchableQuery('d')).toBe(false);
    expect(isSearchableQuery('d r')).toBe(false);
    expect(isSearchableQuery('a a')).toBe(false);
  });

  it('caps the number of usable query tokens at MAX_QUERY_TOKENS', () => {
    expect(MAX_QUERY_TOKENS).toBe(8);
    expect(isSearchableQuery('Maria de los Angeles Garcia Hernandez Lopez')).toBe(true);
    expect(isSearchableQuery('ab cd ef gh ij kl mn op')).toBe(true);
    expect(isSearchableQuery('ab cd ef gh ij kl mn op qr')).toBe(false);
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
    const dual: Invitation[] = [
      { id: 'dual', household: 'Sofia Squared', guests: [guest('gx', 'Sofia Reyes'), guest('gy', 'Sofia Reyes')] },
    ];
    expect(searchInvitations(dual, 'Sofia Reyes').matches.map((invitation) => invitation.id)).toEqual(['dual']);
  });

  it('requires each query token to match a different candidate token', () => {
    expect(households('Reyes Reyes')).toEqual([]);
  });

  it('does not match by reusing the same surname token twice', () => {
    expect(households('Garza Garza')).toEqual([]);
  });

  it('handles punctuation and multi-part surnames', () => {
    expect(households('Liam OBrien')).toEqual(['inv4']);
    expect(households('Maria Garza')).toEqual(['inv4']);
  });

  it('finds a household when the query carries a middle initial', () => {
    expect(households('Emma J Musgrove')).toEqual(['inv3']);
    expect(households('Emma J. Musgrove')).toEqual(['inv3']);
  });

  it('never matches on the household label', () => {
    expect(households('The Musgroves')).toEqual([]);
  });

  it('finds every household sharing a last name searched on its own', () => {
    expect(households('Reyes')).toEqual(['inv1', 'inv2']);
    expect(households('Musgrove')).toEqual(['inv3']);
  });

  it('matches a first name on its own too', () => {
    expect(households('Mateo')).toEqual(['inv2']);
  });

  it('matches a last name by prefix and through accents', () => {
    expect(households('Salin')).toEqual(['inv5']);
    expect(households('Musgroves')).toEqual([]);
  });

  it('ranks an exact last-name match above a prefix match', () => {
    const ranked: Invitation[] = [
      { id: 'prefix', household: 'The Reyeses', guests: [guest('ga', 'Ana Reyeson')] },
      { id: 'exact', household: 'The Reyes Family', guests: [guest('gb', 'Ana Reyes')] },
    ];
    expect(searchInvitations(ranked, 'Reyes').matches.map((invitation) => invitation.id)).toEqual(['exact', 'prefix']);
  });

  it('requires a name of some kind', () => {
    expect(households('   ')).toEqual([]);
  });

  it('returns nothing when no guest matches', () => {
    expect(households('Nobody Here')).toEqual([]);
  });

  it('returns the full roster of a matched household', () => {
    expect(searchInvitations(invitations, 'Emma Musgrove').matches[0].guests).toHaveLength(2);
  });

  it('ranks exact token matches above prefix matches, regardless of input order', () => {
    const ranked: Invitation[] = [
      { id: 'prefix', household: 'Daniel Family', guests: [guest('ga', 'Daniel Reyes')] },
      { id: 'exact', household: 'Dan Family', guests: [guest('gb', 'Dan Reyes')] },
    ];
    expect(searchInvitations(ranked, 'Dan Reyes').matches.map((invitation) => invitation.id)).toEqual([
      'exact',
      'prefix',
    ]);
  });

  it('caps the number of results and flags truncation when more than MAX_SEARCH_RESULTS match', () => {
    const many = Array.from({ length: 15 }, (_, index) => ({
      id: `many${index}`,
      household: `Lopez ${index}`,
      guests: [guest(`m${index}`, 'Ana Lopez')],
    }));
    expect(MAX_SEARCH_RESULTS).toBe(10);
    const result = searchInvitations(many, 'Ana Lopez');
    expect(result.matches).toHaveLength(10);
    expect(result.truncated).toBe(true);
  });

  it('does not flag truncation when exactly MAX_SEARCH_RESULTS match', () => {
    const exactlyTen = Array.from({ length: 10 }, (_, index) => ({
      id: `ten${index}`,
      household: `Lopez ${index}`,
      guests: [guest(`t${index}`, 'Ana Lopez')],
    }));
    const result = searchInvitations(exactlyTen, 'Ana Lopez');
    expect(result.matches).toHaveLength(10);
    expect(result.truncated).toBe(false);
  });

  it('returns an untruncated empty result for an unsearchable query', () => {
    expect(searchInvitations(invitations, 'M')).toEqual({ matches: [], truncated: false });
  });
});

import { describe, expect, it } from 'vitest';
import { INVITATIONS } from '@/lib/admin/fixtures';
import {
  filterGuestRows,
  filterIndexedRows,
  findDuplicateNames,
  NO_FILTERS,
  toGuestRows,
  toHouseholdOptions,
  toStatusFilter,
  withSearchKeys,
} from '@/lib/admin/guest-rows';
import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const rows = toGuestRows(INVITATIONS);
const names = (list: typeof rows) => list.map((row) => row.name);

describe('toGuestRows', () => {
  it('lists every guest in household order with status and counted plus-one', () => {
    expect(rows).toHaveLength(8);
    expect(rows[0]).toEqual({
      guestId: id('Grant'),
      invitationId: id('Biggs'),
      name: 'Grant Biggs',
      household: 'The Biggs Family',
      status: 'attending',
      hasPlusOne: true,
      plusOneName: 'Priya Raman',
      respondedAt: '2026-09-10',
    });
    expect(rows.map((row) => row.status)).toEqual([
      'attending', 'awaiting', 'declined', 'attending', 'attending', 'awaiting', 'awaiting', 'declined',
    ]);
  });

  it('omits plus-one names that do not count', () => {
    expect(rows.find((row) => row.name === 'Emma Musgrove')?.plusOneName).toBeUndefined();
    expect(rows.find((row) => row.name === 'Bill Hunter')?.plusOneName).toBeUndefined();
  });

  it('never includes contact emails', () => {
    expect(JSON.stringify(rows)).not.toContain('biggs@example.com');
  });
});

describe('toHouseholdOptions', () => {
  it('lists households for the filter', () => {
    expect(toHouseholdOptions(INVITATIONS)[0]).toEqual({ id: id('Biggs'), household: 'The Biggs Family' });
  });
});

describe('filterGuestRows', () => {
  it('returns everything with no filters', () => {
    expect(filterGuestRows(rows, NO_FILTERS)).toHaveLength(8);
  });

  it('filters by response status', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, status: 'awaiting' }))).toEqual([
      'Truman Biggs', 'Daniel Reyes', 'Sofía Reyes',
    ]);
  });

  it('filters by household', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, invitationId: id('Musgrove') }))).toEqual([
      'Sue Musgrove', 'Emma Musgrove',
    ]);
  });

  it('searches names and plus-ones ignoring case and accents', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'SOFIA' }))).toEqual(['Sofía Reyes']);
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'priya' }))).toEqual(['Grant Biggs']);
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'hunter' }))).toEqual(['Bill Hunter']);
  });

  it('combines filters', () => {
    expect(names(filterGuestRows(rows, { status: 'attending', invitationId: id('Biggs'), query: '' }))).toEqual(['Grant Biggs']);
  });
});

describe('withSearchKeys / filterIndexedRows', () => {
  it('produces the same results as filterGuestRows for equivalent filters', () => {
    const indexed = withSearchKeys(rows);
    const filters = { ...NO_FILTERS, query: 'priya' };
    expect(names(filterIndexedRows(indexed, filters))).toEqual(names(filterGuestRows(rows, filters)));
  });

  it('matches on the precomputed key ignoring case and accents', () => {
    const indexed = withSearchKeys(rows);
    expect(names(filterIndexedRows(indexed, { ...NO_FILTERS, query: 'SOFIA' }))).toEqual(['Sofía Reyes']);
  });
});

describe('toStatusFilter', () => {
  it('accepts known statuses and falls back to all', () => {
    expect(toStatusFilter('declined')).toBe('declined');
    expect(toStatusFilter('maybe')).toBe('all');
  });
});

describe('findDuplicateNames', () => {
  it('reports names that appear in more than one household', () => {
    const invitations: Invitation[] = [
      ...INVITATIONS,
      {
        id: id('Biggs2'),
        household: 'The Biggs Household',
        guests: [{ id: id('Grant2'), name: 'grant  BIGGS', hasPlusOne: false, attending: null }],
      },
    ];
    expect(findDuplicateNames(invitations)).toEqual([
      { name: 'Grant Biggs', households: ['The Biggs Family', 'The Biggs Household'] },
    ]);
  });

  it('reports nothing when every name is unique across households', () => {
    expect(findDuplicateNames(INVITATIONS)).toEqual([]);
  });
});

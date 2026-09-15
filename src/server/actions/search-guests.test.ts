import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  requireSiteSession: vi.fn<() => Promise<void>>(),
  getInvitations: vi.fn<() => Promise<Invitation[]>>(),
}));

vi.mock('@/lib/auth', () => ({ requireSiteSession: mocks.requireSiteSession }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));

import { searchGuests } from '@/server/actions/search-guests';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

const biggs: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  email: 'biggs@example.com',
  guests: [
    { id: id('Grant'), name: 'Grant Biggs', altNames: ['G-Man'], hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman', respondedAt: '2026-09-10' },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSiteSession.mockResolvedValue(undefined);
  mocks.getInvitations.mockResolvedValue([biggs]);
});

describe('searchGuests', () => {
  it('returns matching households as roster projections only', async () => {
    const result = await searchGuests('Grant Biggs');
    expect(result).toEqual({
      status: 'ok',
      truncated: false,
      households: [
        {
          id: id('Biggs'),
          household: 'The Biggs Family',
          hasEmailOnFile: true,
          guests: [
            { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
            { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
          ],
        },
      ],
    });
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('biggs@example.com');
    expect(serialized).not.toContain('G-Man');
    expect(serialized).not.toContain('2026-09-10');
  });

  it('checks the site session before reading the guest list', async () => {
    mocks.requireSiteSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(searchGuests('Grant Biggs')).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getInvitations).not.toHaveBeenCalled();
  });

  it.each([
    ['a single name', 'Biggs'],
    ['a non-string', 42],
    ['an overlong query', `${'a'.repeat(150)} Biggs`],
  ])('rejects %s without reading the guest list', async (_label, query) => {
    expect(await searchGuests(query)).toEqual({ status: 'invalid-query' });
    expect(mocks.getInvitations).not.toHaveBeenCalled();
  });

  it('passes through the truncated flag', async () => {
    mocks.getInvitations.mockResolvedValue(
      Array.from({ length: 11 }, (_, index) => ({
        id: id(`Lopez${index}`),
        household: `Lopez ${index}`,
        guests: [{ id: id(`Ana${index}`), name: 'Ana Lopez', hasPlusOne: false, attending: null }],
      })),
    );
    const result = await searchGuests('Ana Lopez');
    expect(result).toMatchObject({ status: 'ok', truncated: true });
    expect(result.status === 'ok' && result.households).toHaveLength(10);
  });

  it('reports an error when the guest list cannot be loaded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getInvitations.mockRejectedValue(new Error('Airtable down'));
    expect(await searchGuests('Grant Biggs')).toEqual({ status: 'error' });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecordUpdate } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  requireSiteSession: vi.fn<() => Promise<void>>(),
  getInvitations: vi.fn<() => Promise<Invitation[]>>(),
  updateTag: vi.fn<(tag: string) => void>(),
  updateRecords: vi.fn<(tableId: string, updates: readonly RecordUpdate[]) => Promise<void>>(),
}));

vi.mock('@/lib/auth', () => ({ requireSiteSession: mocks.requireSiteSession }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag }));
vi.mock('@/lib/airtable/client', () => ({
  getAirtableClient: () => ({ listAllRecords: vi.fn(), updateRecords: mocks.updateRecords }),
}));

import { submitRsvp } from '@/server/actions/submit-rsvp';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const G = AIRTABLE.guests.fields;
const DATE = expect.stringMatching(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/);

const biggs: Invitation = {
  id: id('Biggs'),
  household: 'The Biggs Family',
  guests: [
    { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

const hunter: Invitation = {
  id: id('Hunter'),
  household: 'Bill & Traci Hunter',
  guests: [{ id: id('Bill'), name: 'Bill Hunter', hasPlusOne: false, attending: null }],
};

const validInput = {
  invitationId: biggs.id,
  answers: [
    { guestId: id('Grant'), attending: 'yes', plusOneName: ' Priya Raman ' },
    { guestId: id('Mario'), attending: 'no' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSiteSession.mockResolvedValue(undefined);
  mocks.getInvitations.mockResolvedValue([biggs, hunter]);
  mocks.updateRecords.mockResolvedValue(undefined);
});

function expectNoWrite() {
  expect(mocks.updateRecords).not.toHaveBeenCalled();
  expect(mocks.updateTag).not.toHaveBeenCalled();
}

describe('submitRsvp', () => {
  it('writes every answer, refreshes the guest list, and returns the saved household', async () => {
    const result = await submitRsvp(validInput);

    expect(mocks.updateRecords).toHaveBeenCalledWith(AIRTABLE.guests.tableId, [
      { id: id('Grant'), fields: { [G.attending]: 'Yes', [G.plusOneName]: 'Priya Raman', [G.respondedAt]: DATE } },
      { id: id('Mario'), fields: { [G.attending]: 'No', [G.respondedAt]: DATE } },
    ]);
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(mocks.updateRecords).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: 'ok',
      household: {
        id: biggs.id,
        household: 'The Biggs Family',
        hasEmailOnFile: false,
        guests: [
          { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
          { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'no' },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toContain('biggs@example.com');
  });

  it('writes the household email in addition to the guest answers when provided', async () => {
    const result = await submitRsvp({ ...validInput, email: ' Hudson.Basso@Example.COM ' });

    expect(mocks.updateRecords).toHaveBeenCalledTimes(2);
    expect(mocks.updateRecords).toHaveBeenNthCalledWith(1, AIRTABLE.guests.tableId, expect.any(Array));
    expect(mocks.updateRecords).toHaveBeenNthCalledWith(2, AIRTABLE.invitations.tableId, [
      { id: biggs.id, fields: { [AIRTABLE.invitations.fields.email]: 'hudson.basso@example.com' } },
    ]);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.household.hasEmailOnFile).toBe(true);
  });

  it('rejects a submission with an invalid email without writing anything', async () => {
    expect(await submitRsvp({ ...validInput, email: 'not-an-email' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('still returns ok when the household email write fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateRecords.mockImplementation(async (tableId: string) => {
      if (tableId === AIRTABLE.invitations.tableId) throw new Error('Airtable 503');
    });

    const result = await submitRsvp({ ...validInput, email: 'hudson.basso@example.com' });

    expect(result.status).toBe('ok');
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(consoleError).toHaveBeenCalledWith('household email write failed', expect.any(Error));
    consoleError.mockRestore();
  });

  it('checks the site session before anything else', async () => {
    mocks.requireSiteSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(submitRsvp(validInput)).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getInvitations).not.toHaveBeenCalled();
    expectNoWrite();
  });

  it('rejects malformed input', async () => {
    expect(await submitRsvp({ invitationId: biggs.id, answers: 'yes' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects an invitation that does not exist', async () => {
    expect(await submitRsvp({ ...validInput, invitationId: id('Nobody') })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects answers for a guest from another household', async () => {
    const input = {
      invitationId: biggs.id,
      answers: [
        { guestId: id('Bill'), attending: 'yes' },
        { guestId: id('Mario'), attending: 'no' },
      ],
    };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects a submission that leaves a guest unanswered', async () => {
    const input = { invitationId: biggs.id, answers: [{ guestId: id('Grant'), attending: 'yes' }] };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('reports an error but still refreshes the cache when Airtable fails partway through', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.updateRecords.mockRejectedValue(new Error('Airtable 503'));
    expect(await submitRsvp(validInput)).toEqual({ status: 'error' });
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

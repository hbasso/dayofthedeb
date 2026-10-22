import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GuestUpdate } from '@/lib/db/rsvp';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({
  requireSiteSession: vi.fn<() => Promise<void>>(),
  getInvitations: vi.fn<() => Promise<Invitation[]>>(),
  updateTag: vi.fn<(tag: string) => void>(),
  writeRsvp: vi.fn<(id: string, updates: readonly GuestUpdate[], email: string | null) => Promise<void>>(),
}));

vi.mock('@/lib/auth', () => ({ requireSiteSession: mocks.requireSiteSession }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag }));
// Only the write is stubbed. buildRsvpUpdates stays real, because the ownership and plus-one
// rules it enforces are the part of this action worth testing.
vi.mock('@/lib/db/rsvp', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/db/rsvp')>()),
  writeRsvp: mocks.writeRsvp,
}));

import { submitRsvp } from '@/server/actions/submit-rsvp';

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const BIGGS = id(1);
const GRANT = id(2);
const MARIO = id(3);
const HUNTER = id(4);
const BILL = id(5);
const NOBODY = id(9);

const biggs: Invitation = {
  id: BIGGS,
  household: 'The Biggs Family',
  guests: [
    { id: GRANT, name: 'Grant Biggs', hasPlusOne: true, attending: null },
    { id: MARIO, name: 'Mario Biggs', hasPlusOne: false, attending: null },
  ],
};

const hunter: Invitation = {
  id: HUNTER,
  household: 'Bill & Traci Hunter',
  guests: [{ id: BILL, name: 'Bill Hunter', hasPlusOne: false, attending: null }],
};

const validInput = {
  invitationId: BIGGS,
  answers: [
    { guestId: GRANT, attending: 'yes', plusOneName: ' Priya Raman ' },
    { guestId: MARIO, attending: 'no' },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireSiteSession.mockResolvedValue(undefined);
  mocks.getInvitations.mockResolvedValue([biggs, hunter]);
  mocks.writeRsvp.mockResolvedValue(undefined);
});

function expectNoWrite() {
  expect(mocks.writeRsvp).not.toHaveBeenCalled();
  expect(mocks.updateTag).not.toHaveBeenCalled();
}

describe('submitRsvp', () => {
  it('writes every answer in one call, refreshes the guest list, and returns the saved household', async () => {
    const result = await submitRsvp(validInput);

    expect(mocks.writeRsvp).toHaveBeenCalledTimes(1);
    expect(mocks.writeRsvp).toHaveBeenCalledWith(
      BIGGS,
      [
        { id: GRANT, attending: 'yes', plusOneName: 'Priya Raman' },
        { id: MARIO, attending: 'no' },
      ],
      null,
    );
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(result).toEqual({
      status: 'ok',
      household: {
        id: BIGGS,
        household: 'The Biggs Family',
        hasEmailOnFile: false,
        guests: [
          { id: GRANT, name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman' },
          { id: MARIO, name: 'Mario Biggs', hasPlusOne: false, attending: 'no' },
        ],
      },
    });
  });

  it('sends the normalized household email with the same write', async () => {
    const result = await submitRsvp({ ...validInput, email: ' Hudson.Basso@Example.COM ' });

    expect(mocks.writeRsvp).toHaveBeenCalledTimes(1);
    expect(mocks.writeRsvp).toHaveBeenCalledWith(BIGGS, expect.any(Array), 'hudson.basso@example.com');
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.household.hasEmailOnFile).toBe(true);
  });

  it('leaves an existing household email untouched when the guest submits none', async () => {
    mocks.getInvitations.mockResolvedValue([{ ...biggs, email: 'already@example.com' }, hunter]);

    const result = await submitRsvp(validInput);

    expect(mocks.writeRsvp).toHaveBeenCalledWith(BIGGS, expect.any(Array), null);
    expect(result.status).toBe('ok');
    if (result.status === 'ok') expect(result.household.hasEmailOnFile).toBe(true);
  });

  it('never leaks the stored email back to the browser', async () => {
    mocks.getInvitations.mockResolvedValue([{ ...biggs, email: 'biggs@example.com' }, hunter]);
    expect(JSON.stringify(await submitRsvp(validInput))).not.toContain('biggs@example.com');
  });

  it('rejects a submission with an invalid email without writing anything', async () => {
    expect(await submitRsvp({ ...validInput, email: 'not-an-email' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('checks the site session before anything else', async () => {
    mocks.requireSiteSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(submitRsvp(validInput)).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.getInvitations).not.toHaveBeenCalled();
    expectNoWrite();
  });

  it('rejects malformed input', async () => {
    expect(await submitRsvp({ invitationId: BIGGS, answers: 'yes' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects an id that is not a uuid', async () => {
    expect(await submitRsvp({ ...validInput, invitationId: 'recBiggs000000000' })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects an invitation that does not exist', async () => {
    expect(await submitRsvp({ ...validInput, invitationId: NOBODY })).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects answers for a guest from another household', async () => {
    const input = {
      invitationId: BIGGS,
      answers: [
        { guestId: BILL, attending: 'yes' },
        { guestId: MARIO, attending: 'no' },
      ],
    };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('rejects a submission that leaves a guest unanswered', async () => {
    const input = { invitationId: BIGGS, answers: [{ guestId: GRANT, attending: 'yes' }] };
    expect(await submitRsvp(input)).toEqual({ status: 'invalid' });
    expectNoWrite();
  });

  it('reports an error but still refreshes the cache when the write fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.writeRsvp.mockRejectedValue(new Error('connection reset'));

    expect(await submitRsvp(validInput)).toEqual({ status: 'error' });
    // The transaction is all-or-nothing, but a lost response leaves the outcome unknown: a write
    // that actually committed must not sit behind the week-long cache looking unsaved.
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('does not refresh the cache when it rejected the submission before writing', async () => {
    expect(await submitRsvp({ ...validInput, invitationId: NOBODY })).toEqual({ status: 'invalid' });
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});

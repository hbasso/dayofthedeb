import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn<() => Promise<void>>(),
  updateTag: vi.fn<(tag: string) => void>(),
}));

vi.mock('@/lib/auth', () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests' }));

import { refreshGuestList } from '@/server/actions/refresh-guest-list';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdminSession.mockResolvedValue(undefined);
});

describe('refreshGuestList', () => {
  it('expires the cached guest list for an admin', async () => {
    await refreshGuestList();
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
  });

  it('does nothing without an admin session', async () => {
    mocks.requireAdminSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(refreshGuestList()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});

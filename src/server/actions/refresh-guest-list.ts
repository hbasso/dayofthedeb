'use server';

import { updateTag } from 'next/cache';
import { requireAdminSession } from '@/lib/auth';
import { GUEST_LIST_TAG } from '@/lib/guest-list';

/** Pull edits made directly in Airtable into the site now instead of waiting for the cache to refresh. */
export async function refreshGuestList(): Promise<void> {
  await requireAdminSession();
  updateTag(GUEST_LIST_TAG);
}

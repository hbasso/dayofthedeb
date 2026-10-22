import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { getAllInvitations } from '@/lib/db/queries';
import type { Invitation } from '@/types/domain';

export const GUEST_LIST_TAG = 'guests';

/**
 * The whole guest list. Search, roster, admin, and export all read this; the database is never in the page-view hot path.
 * 'use cache: remote' shares one entry across Vercel instances, so updateTag after an RSVP is seen everywhere.
 */
export async function getInvitations(): Promise<Invitation[]> {
  'use cache: remote';
  cacheTag(GUEST_LIST_TAG);
  cacheLife('guestList');
  return getAllInvitations();
}

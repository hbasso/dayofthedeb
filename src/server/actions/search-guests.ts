'use server';

import { requireSiteSession } from '@/lib/auth';
import { getInvitations } from '@/lib/guest-list';
import { toRosterHousehold } from '@/lib/roster-view';
import { isSearchableQuery, searchInvitations } from '@/lib/search';
import type { SearchGuestsResult } from '@/types/rsvp';

const MAX_QUERY_LENGTH = 120;

export async function searchGuests(query: unknown): Promise<SearchGuestsResult> {
  await requireSiteSession();
  if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH || !isSearchableQuery(query)) {
    return { status: 'invalid-query' };
  }

  try {
    const { matches, truncated } = searchInvitations(await getInvitations(), query);
    return { status: 'ok', households: matches.map(toRosterHousehold), truncated };
  } catch (error) {
    console.error('searchGuests failed', error);
    return { status: 'error' };
  }
}

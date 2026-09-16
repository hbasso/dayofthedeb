import { connection } from 'next/server';
import { getInvitations } from '@/lib/guest-list';

/**
 * Renders nothing. It exists to pull the guest list into the shared cache while the guest is
 * still reading the page and typing their name, so the first search of a cold cache doesn't
 * make them wait on Airtable's paged fetch (about ten sequential round trips).
 *
 * connection() holds this back to request time. Without it the warm happens once at build and
 * the whole page turns static, which would put a cold fetch in front of the page itself rather
 * than behind the form. Paired with Suspense, the shell still streams immediately.
 *
 * A failure here is not a page failure: the search action fetches the list itself and reports
 * its own errors.
 */
export async function WarmGuestList() {
  try {
    await connection();
    await getInvitations();
  } catch (error) {
    console.error('WarmGuestList failed to prefetch the guest list', error);
  }
  return null;
}

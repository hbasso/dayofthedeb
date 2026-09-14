import type { NextRequest } from 'next/server';
import {
  GUEST_LIST_COLUMNS,
  HEADCOUNT_COLUMNS,
  toCsv,
  toGuestListRows,
  toHeadcountRows,
  UTF8_BOM,
} from '@/lib/admin/export-csv';
import { toGuestRows } from '@/lib/admin/guest-rows';
import { respondedOnDate } from '@/lib/airtable/rsvp';
import { getInvitations } from '@/lib/guest-list';
import { ADMIN_SESSION_COOKIE, isAdminSealValid } from '@/lib/session';

export async function GET(request: NextRequest): Promise<Response> {
  // The proxy also guards this route; checking here means the API never relies on it.
  if (!(await isAdminSealValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'guest-list' : 'headcount';

  try {
    const invitations = await getInvitations();
    const csv =
      scope === 'guest-list'
        ? toCsv(GUEST_LIST_COLUMNS, toGuestListRows(toGuestRows(invitations)))
        : toCsv(HEADCOUNT_COLUMNS, toHeadcountRows(invitations));

    return new Response(UTF8_BOM + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="day-of-the-deb-${scope}-${respondedOnDate()}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('export failed', error);
    return new Response('Could not load the guest list. Please try again.', { status: 503 });
  }
}

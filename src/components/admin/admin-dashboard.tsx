import { AdminHeader } from '@/components/admin/admin-header';
import { DuplicateNames } from '@/components/admin/duplicate-names';
import { ExportButtons } from '@/components/admin/export-buttons';
import { GuestTable } from '@/components/admin/guest-table';
import { StatsSummary } from '@/components/admin/stats-summary';
import { findDuplicateNames, toGuestRows, toHouseholdOptions } from '@/lib/admin/guest-rows';
import { computeStats } from '@/lib/admin/stats';
import { respondedOnDate } from '@/lib/airtable/rsvp';
import { requireAdminSession } from '@/lib/auth';
import { readRequiredEnv } from '@/lib/env';
import { getInvitations } from '@/lib/guest-list';

export async function AdminDashboard() {
  await requireAdminSession();
  const invitations = await getInvitations();
  const duplicates = findDuplicateNames(invitations);
  const airtableUrl = `https://airtable.com/${readRequiredEnv('AIRTABLE_BASE_ID')}`;

  return (
    <div className="space-y-10">
      <AdminHeader />
      <StatsSummary stats={computeStats(invitations, respondedOnDate())} />
      <ExportButtons />
      {duplicates.length > 0 && <DuplicateNames duplicates={duplicates} />}
      <GuestTable rows={toGuestRows(invitations)} households={toHouseholdOptions(invitations)} />
      <p>
        <a href={airtableUrl} target="_blank" rel="noopener noreferrer" className="text-link underline-offset-4 hover:underline">
          Edit guests in Airtable
        </a>{' '}
        <span className="text-muted-foreground">
          (changes show here after &ldquo;Refresh from Airtable&rdquo;, or within a few minutes)
        </span>
      </p>
    </div>
  );
}

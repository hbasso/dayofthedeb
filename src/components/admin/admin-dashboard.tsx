import { AdminHeader } from '@/components/admin/admin-header';
import { DuplicateNames } from '@/components/admin/duplicate-names';
import { ExportButtons } from '@/components/admin/export-buttons';
import { GuestTable } from '@/components/admin/guest-table';
import { StatsSummary } from '@/components/admin/stats-summary';
import { findDuplicateNames, toGuestRows, toHouseholdOptions } from '@/lib/admin/guest-rows';
import { computeStats } from '@/lib/admin/stats';
import { requireAdminSession } from '@/lib/auth';
import { todayInEventTimeZone } from '@/lib/dates';
import { getInvitations } from '@/lib/guest-list';

export async function AdminDashboard() {
  await requireAdminSession();
  const invitations = await getInvitations();
  const duplicates = findDuplicateNames(invitations);

  return (
    <div className="space-y-10">
      <AdminHeader />
      <StatsSummary stats={computeStats(invitations, todayInEventTimeZone())} />
      <ExportButtons />
      {duplicates.length > 0 && <DuplicateNames duplicates={duplicates} />}
      <GuestTable rows={toGuestRows(invitations)} households={toHouseholdOptions(invitations)} />
    </div>
  );
}

'use client';

import { useDeferredValue, useMemo, useState } from 'react';
import { GuestTableFilters } from '@/components/admin/guest-table-filters';
import { StatusBadge } from '@/components/admin/status-badge';
import {
  filterIndexedRows,
  NO_FILTERS,
  withSearchKeys,
  type GuestFilters,
  type GuestRow,
  type HouseholdOption,
} from '@/lib/admin/guest-rows';
import { formatEventDate } from '@/lib/dates';

const COLUMNS = ['Name', 'Household', 'Status', 'Plus-one', 'Responded'] as const;

export function GuestTable({ rows, households }: { rows: GuestRow[]; households: HouseholdOption[] }) {
  const [filters, setFilters] = useState<GuestFilters>(NO_FILTERS);
  const deferredFilters = useDeferredValue(filters);
  const indexed = useMemo(() => withSearchKeys(rows), [rows]);
  const visible = useMemo(() => filterIndexedRows(indexed, deferredFilters), [indexed, deferredFilters]);

  return (
    <section aria-labelledby="guests-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="guests-heading" className="font-display text-3xl">
          Guest list
        </h2>
        <p aria-live="polite" className="text-muted-foreground">
          Showing {visible.length} of {rows.length} guests
        </p>
      </div>
      <GuestTableFilters filters={filters} households={households} onChange={setFilters} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[40rem] text-left">
          <thead className="border-b border-border bg-muted text-sm">
            <tr>
              {COLUMNS.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={
                    index === 0
                      ? 'sticky left-0 border-r border-border bg-muted px-4 py-3 font-semibold'
                      : 'px-4 py-3 font-semibold'
                  }
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.guestId} className="border-b border-border last:border-0">
                <td className="sticky left-0 border-r border-border bg-card px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.household}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  {row.plusOneName ?? (row.hasPlusOne ? <span className="text-muted-foreground">Offered</span> : null)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatEventDate(row.respondedAt ?? null)}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-muted-foreground">
                  No guests match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toStatusFilter, type GuestFilters, type HouseholdOption } from '@/lib/admin/guest-rows';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-base focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';

const STATUS_OPTIONS: { value: GuestFilters['status']; label: string }[] = [
  { value: 'all', label: 'All responses' },
  { value: 'attending', label: 'Attending' },
  { value: 'declined', label: 'Declined' },
  { value: 'awaiting', label: 'Awaiting response' },
];

interface GuestTableFiltersProps {
  filters: GuestFilters;
  households: HouseholdOption[];
  onChange: (filters: GuestFilters) => void;
}

export function GuestTableFilters({ filters, households, onChange }: GuestTableFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="guest-filter-query">Search</Label>
        <Input
          id="guest-filter-query"
          type="search"
          value={filters.query}
          placeholder="Name or plus-one"
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          className="h-10 bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-filter-status">Response</Label>
        <select
          id="guest-filter-status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: toStatusFilter(event.target.value) })}
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-filter-household">Household</Label>
        <select
          id="guest-filter-household"
          value={filters.invitationId}
          onChange={(event) => onChange({ ...filters, invitationId: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All households</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.household}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

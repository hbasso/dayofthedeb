'use client';

import type { RosterHousehold } from '@/types/rsvp';

export function ResultCard({ household, onSelect }: { household: RosterHousehold; onSelect: (household: RosterHousehold) => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(household)}
        className="w-full rounded-xl border-2 border-border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-hidden"
      >
        <span className="block font-display text-xl">{household.household}</span>
        <span className="mt-1 block text-muted-foreground">{household.guests.map((guest) => guest.name).join(', ')}</span>
      </button>
    </li>
  );
}

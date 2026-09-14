'use client';

import { useMemo } from 'react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import { normalizeName } from '@/lib/search';
import type { HouseholdOption } from '@/lib/admin/guest-rows';

interface HouseholdComboboxProps {
  id: string;
  households: HouseholdOption[];
  /** Selected invitation id, or '' for every household. */
  value: string;
  onChange: (invitationId: string) => void;
}

function filterHousehold(item: HouseholdOption, query: string): boolean {
  return normalizeName(item.household).includes(normalizeName(query));
}

function isSameHousehold(a: HouseholdOption, b: HouseholdOption): boolean {
  return a.id === b.id;
}

/** Searchable, accent-insensitive replacement for a native `<select>` of ~250 households. */
export function HouseholdCombobox({ id, households, value, onChange }: HouseholdComboboxProps) {
  const selected = useMemo(() => households.find((household) => household.id === value) ?? null, [households, value]);

  return (
    <Combobox
      items={households}
      value={selected}
      onValueChange={(household) => onChange(household?.id ?? '')}
      itemToStringLabel={(household) => household.household}
      isItemEqualToValue={isSameHousehold}
      filter={filterHousehold}
    >
      <ComboboxInput
        id={id}
        placeholder="All households"
        showClear={selected !== null}
        className="h-10 w-full bg-card text-base"
      />
      <ComboboxContent>
        <ComboboxEmpty>No households match</ComboboxEmpty>
        <ComboboxList>
          {(household: HouseholdOption) => (
            <ComboboxItem key={household.id} value={household}>
              {household.household}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

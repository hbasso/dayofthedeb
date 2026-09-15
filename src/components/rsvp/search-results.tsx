'use client';

import { ResultCard } from '@/components/rsvp/result-card';
import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { Button } from '@/components/ui/button';
import type { RosterHousehold, SearchOutcome } from '@/types/rsvp';

interface SearchResultsProps {
  outcome: SearchOutcome;
  onSelect: (household: RosterHousehold) => void;
  onSearchAgain: () => void;
}

export function SearchResults({ outcome, onSelect, onSearchAgain }: SearchResultsProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl outline-none">
          Which party is yours?
        </h2>
        <p className="text-muted-foreground">We found more than one invitation for “{outcome.query}”.</p>
      </div>
      {outcome.truncated && (
        <p className="rounded-lg bg-muted p-3">
          Lots of guests share that name, so we’re only showing some. Search again with a first and last name to
          narrow it down.
        </p>
      )}
      <ul className="space-y-3">
        {outcome.households.map((household) => (
          <ResultCard key={household.id} household={household} onSelect={onSelect} />
        ))}
      </ul>
      <Button type="button" variant="ghost" onClick={onSearchAgain} className="h-12 w-full text-base">
        Search a different name
      </Button>
    </div>
  );
}

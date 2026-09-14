'use client';

import { useState } from 'react';
import { GuestRoster } from '@/components/rsvp/guest-roster';
import { NameSearchForm, type SearchOutcome } from '@/components/rsvp/name-search-form';
import { RsvpConfirmation } from '@/components/rsvp/rsvp-confirmation';
import { SearchResults } from '@/components/rsvp/search-results';
import type { RosterHousehold } from '@/types/rsvp';

type Step =
  | { name: 'search'; query: string }
  | { name: 'results'; outcome: SearchOutcome }
  | { name: 'roster'; household: RosterHousehold; outcome: SearchOutcome }
  | { name: 'done'; household: RosterHousehold };

export function RsvpFlow() {
  const [step, setStep] = useState<Step>({ name: 'search', query: '' });

  switch (step.name) {
    case 'search':
      return (
        <NameSearchForm
          initialQuery={step.query}
          onFound={(outcome) =>
            setStep(
              outcome.households.length === 1
                ? { name: 'roster', household: outcome.households[0], outcome }
                : { name: 'results', outcome },
            )
          }
        />
      );
    case 'results':
      return (
        <SearchResults
          outcome={step.outcome}
          onSelect={(household) => setStep({ name: 'roster', household, outcome: step.outcome })}
          onSearchAgain={() => setStep({ name: 'search', query: step.outcome.query })}
        />
      );
    case 'roster': {
      const { outcome } = step;
      const fromResults = outcome.households.length > 1;
      return (
        <GuestRoster
          key={step.household.id}
          household={step.household}
          backLabel={fromResults ? 'Back to search results' : 'Search a different name'}
          onBack={() => setStep(fromResults ? { name: 'results', outcome } : { name: 'search', query: outcome.query })}
          onSubmitted={(household) => setStep({ name: 'done', household })}
        />
      );
    }
    case 'done':
      return <RsvpConfirmation household={step.household} onDone={() => setStep({ name: 'search', query: '' })} />;
  }
}

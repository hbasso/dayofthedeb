'use client';

import { useState } from 'react';
import { GuestRoster } from '@/components/rsvp/guest-roster';
import { NameSearchForm } from '@/components/rsvp/name-search-form';
import { RsvpConfirmation } from '@/components/rsvp/rsvp-confirmation';
import { SearchResults } from '@/components/rsvp/search-results';
import { useFlowHistory } from '@/components/rsvp/use-flow-history';
import type { EntryStep } from '@/lib/flow-history';
import type { RosterHousehold, SearchOutcome } from '@/types/rsvp';

type Step =
  | { name: 'search'; query: string; initial: boolean }
  | { name: 'results'; outcome: SearchOutcome }
  | { name: 'roster'; household: RosterHousehold; outcome: SearchOutcome }
  | { name: 'done'; household: RosterHousehold };

function freshSearch(query = ''): Step {
  return { name: 'search', query, initial: false };
}

export function RsvpFlow() {
  const [step, setStep] = useState<Step>({ name: 'search', query: '', initial: true });

  // History entries mirror the forward steps, so Back (gesture or in-page button) walks
  // back through them; see @/lib/flow-history for how each popstate is resolved.
  const history = useFlowHistory({
    step: step.name,
    onBack: (target: EntryStep) => {
      if (target === step.name) return;
      const outcome = step.name === 'results' || step.name === 'roster' ? step.outcome : null;
      if (target === 'results' && outcome) setStep({ name: 'results', outcome });
      else setStep(freshSearch(outcome?.query));
    },
    onReset: (query) => setStep(freshSearch(query)),
  });

  function goToRoster(household: RosterHousehold, outcome: SearchOutcome) {
    history.pushStep('roster');
    setStep({ name: 'roster', household, outcome });
  }

  function handleFound(outcome: SearchOutcome) {
    if (outcome.households.length === 1) {
      goToRoster(outcome.households[0], outcome);
    } else {
      history.pushStep('results');
      setStep({ name: 'results', outcome });
    }
  }

  switch (step.name) {
    case 'search':
      return <NameSearchForm initialQuery={step.query} autoFocus={!step.initial} onFound={handleFound} />;
    case 'results':
      return (
        <SearchResults
          outcome={step.outcome}
          onSelect={(household) => goToRoster(household, step.outcome)}
          onSearchAgain={history.back}
        />
      );
    case 'roster': {
      const { outcome } = step;
      return (
        <GuestRoster
          key={step.household.id}
          household={step.household}
          backLabel={outcome.households.length > 1 ? 'Back to search results' : 'Search a different name'}
          onBack={history.back}
          onRestart={() => history.resetToSearch(outcome.query)}
          // No history entry for 'done': Back from it rewinds to a fresh search instead.
          onSubmitted={(household) => setStep({ name: 'done', household })}
        />
      );
    }
    case 'done':
      return <RsvpConfirmation household={step.household} onDone={() => history.resetToSearch('')} />;
  }
}

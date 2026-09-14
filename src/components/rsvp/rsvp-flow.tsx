'use client';

import { useEffect, useRef, useState } from 'react';
import { GuestRoster } from '@/components/rsvp/guest-roster';
import { NameSearchForm } from '@/components/rsvp/name-search-form';
import { RsvpConfirmation } from '@/components/rsvp/rsvp-confirmation';
import { SearchResults } from '@/components/rsvp/search-results';
import { pushFlowStep, replaceFlowStep, useFlowHistory } from '@/components/rsvp/use-flow-history';
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
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });

  // A Back gesture moves the flow back one step, based on whatever step it's currently on.
  // 'search' does nothing here so the browser leaves /rsvp normally; 'done' resets to a
  // fresh search rather than reopening the roster/results that were just submitted.
  useFlowHistory(() => {
    const current = stepRef.current;
    if (current.name === 'roster') {
      const { outcome } = current;
      setStep(outcome.households.length > 1 ? { name: 'results', outcome } : freshSearch(outcome.query));
    } else if (current.name === 'results') {
      setStep(freshSearch(current.outcome.query));
    } else if (current.name === 'done') {
      setStep(freshSearch());
    }
  });

  function goToRoster(household: RosterHousehold, outcome: SearchOutcome) {
    pushFlowStep('roster');
    setStep({ name: 'roster', household, outcome });
  }

  function handleFound(outcome: SearchOutcome) {
    if (outcome.households.length === 1) {
      goToRoster(outcome.households[0], outcome);
    } else {
      pushFlowStep('results');
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
          onSearchAgain={() => window.history.back()}
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
          onBack={() => window.history.back()}
          onRestart={() => setStep(freshSearch(outcome.query))}
          onSubmitted={(household) => {
            replaceFlowStep('done');
            setStep({ name: 'done', household });
          }}
        />
      );
    }
    case 'done':
      return <RsvpConfirmation household={step.household} onDone={() => setStep(freshSearch())} />;
  }
}

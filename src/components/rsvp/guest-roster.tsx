'use client';

import { useEffect, useReducer, useRef, useState, useTransition, type FormEvent } from 'react';
import { GuestRow } from '@/components/rsvp/guest-row';
import { PartyTally } from '@/components/rsvp/party-tally';
import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { Button } from '@/components/ui/button';
import { initRosterState, partyHeadcount, rosterIssues, rosterReducer, toRsvpAnswers } from '@/lib/roster-state';
import { submitRsvp } from '@/server/actions/submit-rsvp';
import type { RosterHousehold } from '@/types/rsvp';

interface GuestRosterProps {
  household: RosterHousehold;
  backLabel: string;
  onBack: () => void;
  onRestart: () => void;
  onSubmitted: (household: RosterHousehold) => void;
}

const SUBMIT_ERRORS = {
  invalid: 'Your RSVP didn’t go through. Please search your name again and resubmit.',
  error: 'We couldn’t save your RSVP just now. Please try again in a moment.',
} as const;

export function GuestRoster({ household, backLabel, onBack, onRestart, onSubmitted }: GuestRosterProps) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const [state, dispatch] = useReducer(rosterReducer, household, initRosterState);
  const [showIssues, setShowIssues] = useState(false);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const [submitStatus, setSubmitStatus] = useState<'invalid' | 'error' | null>(null);
  const [pending, startTransition] = useTransition();

  const issues = rosterIssues(household, state);
  const issueByGuest = new Map(issues.map((issue) => [issue.guestId, issue.problem]));
  const issuesRef = useRef(issues);
  useEffect(() => {
    issuesRef.current = issues;
  });

  // Move focus to the first flagged control so the page scrolls there and its error is
  // read aloud. Runs on every blocked attempt (not just the first) via the attempt counter.
  useEffect(() => {
    if (submitAttempt === 0) return;
    const first = issuesRef.current[0];
    if (!first) return;
    const selector =
      first.problem === 'unanswered' ? `input[name="attending-${first.guestId}"]` : `#plus-one-${first.guestId}`;
    document.querySelector<HTMLElement>(selector)?.focus();
  }, [submitAttempt]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitStatus(null);
    if (issues.length > 0) {
      setShowIssues(true);
      setSubmitAttempt((attempt) => attempt + 1);
      return;
    }
    startTransition(async () => {
      try {
        const result = await submitRsvp({ invitationId: household.id, answers: toRsvpAnswers(household, state) });
        if (result.status === 'ok') onSubmitted(result.household);
        else setSubmitStatus(result.status);
      } catch {
        setSubmitStatus('error');
      }
    });
  }

  const blockedByIssues = showIssues && issues.length > 0;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl outline-none">
          {household.household}
        </h2>
        <p className="text-muted-foreground">Let us know who will be celebrating with us.</p>
      </div>
      <ul className="space-y-4">
        {household.guests.map((guest) => (
          <GuestRow
            key={guest.id}
            guest={guest}
            answer={state[guest.id]}
            issue={showIssues ? issueByGuest.get(guest.id) : undefined}
            dispatch={dispatch}
          />
        ))}
      </ul>
      <PartyTally count={partyHeadcount(state)} />
      <p key={submitAttempt} role="status" aria-live="assertive" hidden={!blockedByIssues} className="text-center text-destructive">
        Please answer for everyone in your party.
      </p>
      {submitStatus && (
        <p role="alert" className="text-center text-destructive">
          {SUBMIT_ERRORS[submitStatus]}
        </p>
      )}
      <div className="flex flex-col gap-3">
        {submitStatus === 'invalid' ? (
          <Button type="button" onClick={onRestart} className="h-12 w-full text-base">
            Search again
          </Button>
        ) : (
          <>
            <Button type="submit" disabled={pending} className="h-12 w-full text-base">
              {pending ? 'Sending…' : 'Send RSVP'}
            </Button>
            <Button type="button" variant="ghost" onClick={onBack} className="h-12 w-full text-base">
              {backLabel}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}

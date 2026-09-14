'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSearchableQuery } from '@/lib/search';
import { searchGuests } from '@/server/actions/search-guests';
import type { RosterHousehold } from '@/types/rsvp';

export interface SearchOutcome {
  query: string;
  households: RosterHousehold[];
  truncated: boolean;
}

const MESSAGES = {
  'invalid-query': 'Please enter the first and last name of someone in your party.',
  'no-match': 'We couldn’t find that name. Try it the way it appears on your invitation, or check the spelling.',
  error: 'Search isn’t working right now. Please try again in a moment.',
} as const;

export function NameSearchForm({ initialQuery = '', onFound }: { initialQuery?: string; onFound: (outcome: SearchOutcome) => void }) {
  const [query, setQuery] = useState(initialQuery);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSearchableQuery(query)) {
      setMessage(MESSAGES['invalid-query']);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await searchGuests(query);
        if (result.status !== 'ok') setMessage(MESSAGES[result.status]);
        else if (result.households.length === 0) setMessage(MESSAGES['no-match']);
        else onFound({ query, households: result.households, truncated: result.truncated });
      } catch {
        setMessage(MESSAGES.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="guest-name" className="text-base">
          Your first and last name
        </Label>
        <Input
          id="guest-name"
          name="guest-name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="search"
          aria-invalid={message ? true : undefined}
          aria-describedby={message ? 'guest-name-message' : undefined}
          className="h-12 bg-card text-lg"
        />
      </div>
      {message && (
        <p id="guest-name-message" role="alert" className="text-destructive">
          {message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Searching…' : 'Find my invitation'}
      </Button>
    </form>
  );
}

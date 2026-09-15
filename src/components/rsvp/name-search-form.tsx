'use client';

import { useEffect, useRef, useState, useTransition, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isSearchableQuery } from '@/lib/search';
import { searchGuests } from '@/server/actions/search-guests';
import type { SearchOutcome } from '@/types/rsvp';

const MESSAGES = {
  'invalid-query': 'Please enter a name of at least two letters, like your last name.',
  'no-match': 'We couldn’t find that name. Try it the way it appears on your invitation, or check the spelling.',
  error: 'Search isn’t working right now. Please try again in a moment.',
} as const;

interface NameSearchFormProps {
  initialQuery?: string;
  /** Focus the name field on mount. Leave off on first page load so focus isn't stolen from the guest. */
  autoFocus?: boolean;
  onFound: (outcome: SearchOutcome) => void;
}

export function NameSearchForm({ initialQuery = '', autoFocus = false, onFound }: NameSearchFormProps) {
  const [query, setQuery] = useState(initialQuery);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoFocusRef = useRef(autoFocus);

  useEffect(() => {
    if (autoFocusRef.current) inputRef.current?.focus();
  }, []);

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

  const describedBy = ['guest-name-description', message && 'guest-name-message'].filter(Boolean).join(' ');

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <p id="guest-name-description" className="text-lg text-muted-foreground">
        Search a last name, or a full name, for anyone in your party. You&apos;ll pick your household next.
      </p>
      <div className="space-y-2">
        <Label htmlFor="guest-name" className="text-base">
          Name on your invitation
        </Label>
        <Input
          ref={inputRef}
          id="guest-name"
          name="guest-name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="name"
          autoCapitalize="words"
          enterKeyHint="search"
          aria-invalid={message ? true : undefined}
          aria-describedby={describedBy}
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

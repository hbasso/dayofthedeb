'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_EMAIL_LENGTH } from '@/lib/email';

interface HouseholdEmailFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hasEmailOnFile: boolean;
}

const INPUT_ID = 'household-email';
const HELP_ID = `${INPUT_ID}-help`;
const ERROR_ID = `${INPUT_ID}-error`;

export const HouseholdEmailField = forwardRef<HTMLInputElement, HouseholdEmailFieldProps>(
  function HouseholdEmailField({ value, onChange, error, hasEmailOnFile }, ref) {
    const describedBy = [HELP_ID, error ? ERROR_ID : undefined].filter(Boolean).join(' ');

    return (
      <div className="space-y-2">
        <Label htmlFor={INPUT_ID} className="text-base">
          Email for reminders (optional)
        </Label>
        <Input
          id={INPUT_ID}
          ref={ref}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={MAX_EMAIL_LENGTH}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className="h-12 bg-card text-lg"
        />
        <p id={HELP_ID} className="text-base text-muted-foreground">
          One email per household. We only use it for RSVP reminders and schedule changes.
          {hasEmailOnFile && ' We already have an email for your household. Add one here to replace it.'}
        </p>
        {error && (
          <p id={ERROR_ID} role="alert" className="text-base text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);

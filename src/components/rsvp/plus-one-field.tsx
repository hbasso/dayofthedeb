'use client';

import { YesNoToggle } from '@/components/rsvp/yes-no-toggle';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_PLUS_ONE_NAME_LENGTH } from '@/lib/plus-one';

interface PlusOneFieldProps {
  guestId: string;
  guestName: string;
  bringingGuest: boolean;
  plusOneName: string;
  showNameError: boolean;
  onBringingGuestChange: (bringingGuest: boolean) => void;
  onPlusOneNameChange: (plusOneName: string) => void;
}

export function PlusOneField({
  guestId,
  guestName,
  bringingGuest,
  plusOneName,
  showNameError,
  onBringingGuestChange,
  onPlusOneNameChange,
}: PlusOneFieldProps) {
  const inputId = `plus-one-${guestId}`;
  const errorId = `${inputId}-error`;
  const firstName = guestName.split(' ')[0];

  return (
    <div className="space-y-3 rounded-lg bg-muted p-3">
      <YesNoToggle
        name={`bringing-${guestId}`}
        legend={`Is ${firstName} bringing a guest?`}
        value={bringingGuest ? 'yes' : 'no'}
        onChange={(value) => onBringingGuestChange(value === 'yes')}
      />
      {bringingGuest && (
        <div className="space-y-2">
          <Label htmlFor={inputId} className="text-base">
            Guest&apos;s full name
          </Label>
          <Input
            id={inputId}
            value={plusOneName}
            maxLength={MAX_PLUS_ONE_NAME_LENGTH}
            autoComplete="off"
            autoCapitalize="words"
            onChange={(event) => onPlusOneNameChange(event.target.value)}
            aria-invalid={showNameError || undefined}
            aria-describedby={showNameError ? errorId : undefined}
            className="h-12 bg-card text-lg"
          />
          {showNameError && (
            <p id={errorId} className="text-sm text-destructive">
              Please enter your guest&apos;s name, or choose No.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

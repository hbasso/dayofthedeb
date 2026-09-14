'use client';

import { cn } from '@/lib/utils';

interface YesNoToggleProps {
  name: string;
  legend: string;
  value: 'yes' | 'no' | null;
  onChange: (value: 'yes' | 'no') => void;
  yesLabel?: string;
  noLabel?: string;
  legendClassName?: string;
  error?: string;
}

const OPTIONS = ['yes', 'no'] as const;

export function YesNoToggle({
  name,
  legend,
  value,
  onChange,
  yesLabel = 'Yes',
  noLabel = 'No',
  legendClassName,
  error,
}: YesNoToggleProps) {
  const errorId = `${name}-error`;
  return (
    <fieldset>
      <legend className={cn('mb-2 text-base font-medium', legendClassName)}>{legend}</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={cn(
                'flex h-12 cursor-pointer items-center justify-center rounded-lg border-2 px-2 text-center text-base font-semibold transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
                // A blocked submit focuses the radio by script, which may not count as :focus-visible after a tap.
                error && 'has-focus:ring-3 has-focus:ring-destructive/40',
                selected && option === 'yes' && 'border-success bg-success text-success-foreground',
                selected && option === 'no' && 'border-foreground bg-foreground text-background',
                !selected && 'border-border bg-card text-foreground hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                aria-describedby={error ? errorId : undefined}
                className="sr-only"
              />
              {option === 'yes' ? yesLabel : noLabel}
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="mt-2 text-base text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}

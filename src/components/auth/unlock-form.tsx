'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { unlockSite, type UnlockState } from '@/server/actions/unlock-site';

export function UnlockForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(unlockSite, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="text"
          required
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'password-error' : undefined}
          className="h-12 text-lg"
        />
      </div>
      {state.error && (
        <p id="password-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Checking…' : 'Enter'}
      </Button>
    </form>
  );
}

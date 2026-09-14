'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminLogin, type AdminLoginState } from '@/server/actions/admin-login';

export function AdminLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminLogin, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="admin-password" className="text-base">
          Admin password
        </Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'admin-password-error' : undefined}
          className="h-12 text-lg"
        />
      </div>
      {state.error && (
        <p id="admin-password-error" role="alert" className="text-base text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Checking…' : 'Sign in'}
      </Button>
    </form>
  );
}

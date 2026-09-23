'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { buttonClass } from '@/lib/button-class';
import { ADMIN_LOGIN_PATH } from '@/lib/routes';

/**
 * Covers the dashboard and the sign-in page beneath it, so the copy stays generic: a bad
 * AUTH_SECRET throws on /admin/login too, and telling the host that Airtable is busy would send
 * them to retry a page that can only keep throwing. The sign-in link is the way out of that.
 */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('admin route failed', error.digest ?? '', error);
  }, [error]);

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        Airtable may be busy, or the session may have expired. Try again, or sign in.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button type="button" onClick={reset} className="h-11 text-base">
          Try again
        </Button>
        <Link href={ADMIN_LOGIN_PATH} className={buttonClass({ variant: 'outline', className: 'h-11 px-4 text-base' })}>
          Sign in
        </Link>
      </div>
      {error.digest && <p className="text-sm text-muted-foreground">Reference: {error.digest}</p>}
    </main>
  );
}

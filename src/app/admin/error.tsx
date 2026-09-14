'use client';

import { Button } from '@/components/ui/button';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="font-display text-3xl">Couldn&apos;t load the guest list</h1>
      <p className="text-muted-foreground">Airtable may be busy. Wait a moment and try again.</p>
      <Button type="button" onClick={reset} className="h-11 text-base">
        Try again
      </Button>
    </main>
  );
}

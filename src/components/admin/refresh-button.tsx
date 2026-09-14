'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { refreshGuestList } from '@/server/actions/refresh-guest-list';

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        await refreshGuestList();
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={handleClick} className="h-10 text-base">
        {pending ? 'Refreshing…' : 'Refresh from Airtable'}
      </Button>
      {failed && (
        <span role="alert" className="text-sm text-destructive">
          Refresh failed. Try again.
        </span>
      )}
    </div>
  );
}

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RsvpFlow } from '@/components/rsvp/rsvp-flow';
import { WarmGuestList } from '@/components/rsvp/warm-guest-list';
import { siteConfig } from '@/config/site';
import { formatEventDate } from '@/lib/dates';

export const metadata: Metadata = {
  title: `RSVP · ${siteConfig.name}`,
};

export default function RsvpPage() {
  const deadline = formatEventDate(siteConfig.rsvpDeadline);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <header className="mb-8 space-y-2">
        <h1 className="font-display text-5xl">RSVP</h1>
        {deadline && <p className="text-lg text-muted-foreground">Please respond by {deadline}.</p>}
      </header>
      <RsvpFlow />
      {/* Warms the guest-list cache alongside the page; renders nothing either way. */}
      <Suspense fallback={null}>
        <WarmGuestList />
      </Suspense>
    </main>
  );
}

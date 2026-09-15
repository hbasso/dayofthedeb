'use client';

import Link from 'next/link';
import { useFocusOnMount } from '@/components/rsvp/use-focus-on-mount';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { formatEventDate } from '@/lib/dates';
import type { RosterHousehold } from '@/types/rsvp';

export function RsvpConfirmation({ household }: { household: RosterHousehold }) {
  const headingRef = useFocusOnMount<HTMLHeadingElement>();
  const attending = household.guests.filter((guest) => guest.attending === 'yes');
  const declined = household.guests.filter((guest) => guest.attending === 'no');
  const deadline = formatEventDate(siteConfig.rsvpDeadline);

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-5xl text-primary outline-none">
          ¡Gracias!
        </h2>
        <p className="text-lg">Your RSVP for {household.household} is saved.</p>
      </div>
      {attending.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 text-left">
          <h3 className="mb-2 font-semibold text-success">Celebrating with us</h3>
          <ul className="space-y-1 text-lg">
            {attending.map((guest) => (
              <li key={guest.id}>
                {guest.name}
                {guest.plusOneName && <span className="text-muted-foreground"> + {guest.plusOneName}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {declined.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 text-left">
          <h3 className="mb-2 font-semibold text-muted-foreground">Can&apos;t make it</h3>
          <ul className="space-y-1 text-lg">
            {declined.map((guest) => (
              <li key={guest.id}>{guest.name}</li>
            ))}
          </ul>
        </section>
      )}
      <p className="text-muted-foreground">
        Plans change? Search your name again anytime{deadline ? ` before ${deadline}` : ''} to update your RSVP.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/"
          className={buttonVariants({ variant: 'outline', className: 'h-auto min-h-12 w-full py-2 text-center text-base whitespace-normal' })}
        >
          Back to home
        </Link>
        <Link href="/venue" className={buttonVariants({ className: 'h-auto min-h-12 w-full py-2 text-center text-base whitespace-normal' })}>
          Venue &amp; directions
        </Link>
      </div>
    </div>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { formatEventDate, formatLongDate, formatTimeRange } from '@/lib/dates';
import { venueAddressLines } from '@/lib/venue';

interface Detail {
  label: string;
  value: ReactNode;
  /** When set, the whole card becomes a link to this page and picks up the link styling. */
  link?: { href: string; label: string; icon?: ReactNode };
}

export function EventDetails() {
  const { event, venue } = siteConfig;
  const details: Detail[] = [
    { label: 'Date', value: <Tbd value={formatLongDate(event.date)} /> },
    { label: 'Time', value: <Tbd value={formatTimeRange(event.startTime, event.endTime)} /> },
    {
      label: 'Place',
      value: (
        <>
          <span className="block font-semibold">{venue.name}</span>
          {venueAddressLines(venue).map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </>
      ),
    },
    {
      label: 'Dress code',
      value: <Tbd value={event.dressCode} />,
      link: { href: '/dress-code', label: 'Click to see the look' },
    },
    { label: 'Please RSVP by', value: <Tbd value={formatEventDate(siteConfig.rsvpDeadline)} /> },
  ];

  return (
    <section aria-labelledby="details-heading" className="space-y-4">
      <h2 id="details-heading" className="font-display text-3xl">
        The details
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map((detail) => (
          <div
            key={detail.label}
            className={
              detail.link
                ? // Marigold rather than Pinterest red: the tint has to sit next to the pink hero.
                  'relative rounded-xl border-2 border-accent/50 bg-accent/10 p-4 transition-colors hover:border-accent hover:bg-accent/20 has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-ring'
                : 'rounded-xl border border-border bg-card p-4'
            }
          >
            <dt className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{detail.label}</dt>
            <dd className="mt-1 text-lg">
              {detail.value}
              {detail.link && (
                // after:inset-0 stretches the hit area over the whole card. The anchor stays inside
                // the <dd> so the <dl> keeps its content model: only dt, dd, and div belong in a dl.
                <Link
                  href={detail.link.href}
                  className="mt-2 flex items-center gap-2 text-base font-semibold after:absolute after:inset-0 focus-visible:outline-hidden"
                >
                  {detail.link.icon}
                  <span className="underline underline-offset-4">{detail.link.label}</span>
                </Link>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

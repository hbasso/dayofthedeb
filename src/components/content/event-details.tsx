import Link from 'next/link';
import type { ReactNode } from 'react';
import { ClickArrow, clickArrowGap } from '@/components/content/click-arrow';
import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { formatEventDate, formatLongDate, formatTimeRange } from '@/lib/dates';

interface Detail {
  label: string;
  value: ReactNode;
  /** When set, the whole card becomes a link to this page and picks up the link styling. */
  link?: { href: string; label: string };
}

export function EventDetails() {
  const { event, venue } = siteConfig;
  const details: Detail[] = [
    { label: 'Date', value: <Tbd value={formatLongDate(event.date)} /> },
    { label: 'Time', value: <Tbd value={formatTimeRange(event.startTime, event.endTime)} /> },
    {
      label: 'Place',
      // Just the name here; the full address lives on the venue page, one tap away.
      value: <span className="block font-semibold">{venue.homeLabel}</span>,
      link: { href: '/venue', label: 'Click to see directions' },
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
            // Fiesta pink with light type, matching the rideshare card on the venue page. The
            // clickable ones carry a visible edge, because on one flat colour the tint that used to
            // mark them is no longer available to do it. Both keep a 2px border so the two kinds of
            // card are exactly the same size.
            className={
              detail.link
                ? `relative rounded-xl border-2 border-primary-foreground/40 bg-primary p-4 ${clickArrowGap} text-primary-foreground transition-colors hover:border-primary-foreground has-[a:focus-visible]:ring-3 has-[a:focus-visible]:ring-primary-foreground has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background`
                : 'rounded-xl border-2 border-transparent bg-primary p-4 text-primary-foreground'
            }
          >
            <dt className="text-sm font-semibold tracking-wide uppercase opacity-90">{detail.label}</dt>
            <dd className="mt-1 text-lg">
              {detail.value}
              {detail.link && (
                // after:inset-0 stretches the hit area over the whole card. The anchor stays inside
                // the <dd> so the <dl> keeps its content model: only dt, dd, and div belong in a dl.
                <Link
                  href={detail.link.href}
                  className="mt-2 flex items-center gap-2 text-base font-semibold after:absolute after:inset-0 focus-visible:outline-hidden"
                >
                  <span className="underline underline-offset-4">{detail.link.label}</span>
                </Link>
              )}
              {/* Inside the <dd> rather than beside it: a <dl>'s grouping <div> may only contain
                  dt and dd, and the card is the nearest positioned ancestor either way. */}
              {detail.link && <ClickArrow />}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

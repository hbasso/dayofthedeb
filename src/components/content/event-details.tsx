import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { formatEventDate, formatLongDate, formatTimeRange } from '@/lib/dates';
import { venueAddressLines } from '@/lib/venue';

export function EventDetails() {
  const { event, venue } = siteConfig;
  const details = [
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
    { label: 'Dress code', value: <Tbd value={event.dressCode} /> },
    { label: 'Please RSVP by', value: <Tbd value={formatEventDate(siteConfig.rsvpDeadline)} /> },
  ];

  return (
    <section aria-labelledby="details-heading" className="space-y-4">
      <h2 id="details-heading" className="font-display text-3xl">
        The details
      </h2>
      <dl className="grid gap-3 sm:grid-cols-2">
        {details.map((detail) => (
          <div key={detail.label} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{detail.label}</dt>
            <dd className="mt-1 text-lg">{detail.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

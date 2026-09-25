import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';
import { venueAddressLines, venueTelHref } from '@/lib/venue';

export function VenueOverview() {
  const { venue } = siteConfig;

  return (
    <section aria-labelledby="venue-heading" className="space-y-4">
      <h1 id="venue-heading" className="font-display text-5xl">
        {venue.name}
      </h1>
      <address className="text-lg not-italic">
        {venueAddressLines(venue).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
        {venue.landmark && <span className="block text-muted-foreground">{venue.landmark}</span>}
      </address>
      <p className="text-lg">
        <Tbd value={venue.description} placeholder="More about the venue coming soon." />
      </p>
      <p className="text-lg">
        <span className="font-semibold">Entrance: </span>
        <Tbd value={venue.entranceNote} />
      </p>
      {venue.phone && (
        <p className="text-lg">
          <span className="font-semibold">Venue phone: </span>
          <a href={venueTelHref(venue.phone)} className="text-link underline underline-offset-4">
            {venue.phone}
          </a>
        </p>
      )}
    </section>
  );
}

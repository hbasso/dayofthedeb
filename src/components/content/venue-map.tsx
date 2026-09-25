import { siteConfig } from '@/config/site';
import { googleMapsEmbedUrl, pointQuery } from '@/lib/maps';
import { venueMapQuery } from '@/lib/venue';

export function VenueMap() {
  const { venue } = siteConfig;
  // The pin when we have it: a name-and-address query can land the embed on a list of results.
  const query = venue.coordinates ? pointQuery(venue.coordinates) : venueMapQuery(venue);

  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-video">
      <iframe
        title={`Map showing ${venue.name}`}
        src={googleMapsEmbedUrl(query)}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

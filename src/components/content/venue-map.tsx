import { siteConfig } from '@/config/site';
import { googleMapsEmbedUrl } from '@/lib/maps';
import { venueMapQuery } from '@/lib/venue';

export function VenueMap() {
  return (
    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-muted sm:aspect-video">
      <iframe
        title={`Map showing ${siteConfig.venue.name}`}
        src={googleMapsEmbedUrl(venueMapQuery(siteConfig.venue))}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

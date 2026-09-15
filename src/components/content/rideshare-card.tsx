import { OpenInMapsButton } from '@/components/content/open-in-maps-button';
import { Tbd } from '@/components/content/tbd';
import { buttonVariants } from '@/components/ui/button';
import { directionsConfig } from '@/config/directions';
import { siteConfig } from '@/config/site';
import { lyftDropoffUrl, uberDropoffUrl } from '@/lib/maps';
import { venueMapQuery, venueSingleLine } from '@/lib/venue';

export function RideshareCard() {
  const { rideshare } = directionsConfig;
  const { venue } = siteConfig;
  const dropoff = rideshare.dropoffCoordinates;

  return (
    <section aria-labelledby="rideshare-heading" className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
      <div className="space-y-1">
        <p className="text-base font-semibold">Getting here</p>
        <h2 id="rideshare-heading" className="font-display text-4xl">
          Take a rideshare
        </h2>
      </div>
      <p className="text-lg">{directionsConfig.parking.summary}</p>
      <div className="rounded-xl bg-card p-4 text-card-foreground">
        <p className="text-base">
          <span className="font-semibold">Drop-off: </span>
          <Tbd value={rideshare.dropoffDescription} placeholder="Exact drop-off point coming soon." />
        </p>
        {rideshare.pickupNote && (
          <p className="mt-2 text-base">
            <span className="font-semibold">Ride home: </span>
            {rideshare.pickupNote}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {dropoff ? (
          <>
            <a
              href={uberDropoffUrl(dropoff, venue.name, venueSingleLine(venue))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'h-12 w-full text-base' })}
            >
              Request an Uber
            </a>
            <a
              href={lyftDropoffUrl(dropoff)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'h-12 w-full text-base' })}
            >
              Request a Lyft
            </a>
          </>
        ) : (
          <div className="sm:col-span-2">
            <OpenInMapsButton query={venueMapQuery(venue)} label="Open the venue in Maps" variant="outline" />
          </div>
        )}
      </div>
    </section>
  );
}

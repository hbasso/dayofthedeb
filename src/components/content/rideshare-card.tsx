import Image from 'next/image';
import { OpenInMapsButton } from '@/components/content/open-in-maps-button';
import { Tbd } from '@/components/content/tbd';
import { WayfindingSteps } from '@/components/content/wayfinding-steps';
import { directionsConfig } from '@/config/directions';
import { siteConfig } from '@/config/site';
import { buttonClass } from '@/lib/button-class';
import { lyftDropoffUrl, uberDropoffUrl } from '@/lib/maps';
import { venueMapQuery } from '@/lib/venue';

// The outline face is cream, and the section's light-on-pink text would otherwise cascade onto it.
//
// Hidden wherever the primary pointer is a mouse. These open the Uber and Lyft apps, which only
// exist on the phone in someone's hand, and a width breakpoint would be the wrong test: a phone
// held sideways is wider than most desktop breakpoints, so `sm:hidden` would take the buttons
// away from the very guest standing outside trying to get home.
const rideButton = buttonClass({
  variant: 'outline',
  className:
    'h-auto min-h-12 w-full py-2 text-center text-base whitespace-normal text-foreground [@media(pointer:fine)]:hidden',
});

export function RideshareCard() {
  const { rideshare } = directionsConfig;
  const { venue } = siteConfig;
  const { dropoff } = rideshare;

  return (
    <section
      aria-labelledby="rideshare-heading"
      className="space-y-4 rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6"
    >
      <div className="space-y-1">
        <p className="text-base font-semibold">Getting here</p>
        <h2 id="rideshare-heading" className="font-display text-4xl">
          Take a rideshare
        </h2>
      </div>
      <p className="text-lg">{rideshare.summary}</p>
      <div className="space-y-4 rounded-xl bg-card p-4 text-card-foreground">
        <div className="flex items-center gap-4">
          <Image src={rideshare.badge.src} alt="" sizes="72px" className="size-16 shrink-0 rounded-lg sm:size-18" />
          <p className="text-base">
            <span className="font-semibold">Drop-off: </span>
            <Tbd value={dropoff.description} placeholder="Exact drop-off point coming soon." />
          </p>
        </div>
        <WayfindingSteps steps={rideshare.steps} />
        {rideshare.pickupNote && (
          <p className="text-base">
            <span className="font-semibold">Ride home: </span>
            {rideshare.pickupNote}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {/* The ride apps need a drop-off pin to deep-link to; Maps only needs the address, so it
            shows either way and spans the row on its own when the pin isn't set yet. */}
        {dropoff.coordinates && (
          <>
            <a
              href={uberDropoffUrl(dropoff.coordinates, dropoff.name, dropoff.address)}
              target="_blank"
              rel="noopener noreferrer"
              className={rideButton}
            >
              Request an Uber
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            <a href={lyftDropoffUrl(dropoff.coordinates)} target="_blank" rel="noopener noreferrer" className={rideButton}>
              Request a Lyft
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </>
        )}
        <div className="sm:col-span-2">
          <OpenInMapsButton
            query={venueMapQuery(venue)}
            coordinates={venue.coordinates}
            pinLabel={venue.name}
            label="Open the venue in Maps"
            variant="outline"
          />
        </div>
      </div>
    </section>
  );
}

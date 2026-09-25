import Image from 'next/image';
import { OpenInMapsButton } from '@/components/content/open-in-maps-button';
import { WayfindingSteps } from '@/components/content/wayfinding-steps';
import { directionsConfig } from '@/config/directions';
import { siteConfig } from '@/config/site';

export function ParkingOptions() {
  const { parking } = directionsConfig;
  if (parking.garages.length === 0) return null;
  const { city, region, postalCode } = siteConfig.venue;

  return (
    <section aria-labelledby="parking-heading" className="space-y-4">
      <h2 id="parking-heading" className="font-display text-3xl">
        If you drive
      </h2>
      <p className="text-lg">{parking.summary}</p>
      {parking.details && <p className="text-lg">{parking.details}</p>}
      <div className="space-y-4">
        {parking.garages.map((garage) => (
          <article key={garage.id} className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex items-center gap-4">
              {/* The badge carries the color here, so the card itself stays quiet: three tinted
                  cards competing with the pink rideshare panel would be a lot of shouting. */}
              <Image
                src={garage.badge.src}
                alt={garage.badge.alt}
                sizes="72px"
                className="size-16 shrink-0 rounded-lg sm:size-18"
              />
              <div>
                <h3 className="font-display text-2xl leading-tight">{garage.name}</h3>
                <p className="text-muted-foreground">{garage.address}</p>
              </div>
            </div>
            <WayfindingSteps steps={garage.steps} />
            <OpenInMapsButton
              query={`${garage.name}, ${garage.address}, ${city}, ${region} ${postalCode}`}
              coordinates={garage.coordinates}
              pinLabel={garage.name}
              label="Open this garage in Maps"
              variant="outline"
            />
          </article>
        ))}
      </div>
    </section>
  );
}

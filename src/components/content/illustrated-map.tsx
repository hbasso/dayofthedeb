import Image from 'next/image';
import { venueMap } from '@/config/venue-map';

export function IllustratedMap() {
  return (
    <section aria-labelledby="illustrated-map-heading" className="space-y-3">
      <h2 id="illustrated-map-heading" className="font-display text-3xl">
        Finding us
      </h2>
      <p className="text-lg text-muted-foreground">
        The same map as your invitation. The gold star is Mexico Ceaty, on the river level inside The Shops at
        Rivercenter.
      </p>
      <figure className="space-y-2">
        <Image
          src={venueMap.src}
          alt={venueMap.alt}
          sizes="(min-width: 768px) 768px, 100vw"
          placeholder="blur"
          className="w-full rounded-xl border border-border"
        />
        <figcaption className="text-base text-muted-foreground">
          {/* The map is dense and the labels are small on a phone. Opening the file itself hands the
              guest their browser's own pinch-zoom, which beats anything we would build here. */}
          <a
            href={venueMap.src.src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link underline underline-offset-4"
          >
            Open the map full size
          </a>{' '}
          to zoom in on a phone.
        </figcaption>
      </figure>
    </section>
  );
}

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
        {/* The map is dense and the labels are small on a phone, so the whole thing opens the image
            file itself, which hands the guest their browser's own pinch-zoom. A plain anchor is
            what makes this safe to scroll past: a touch that drifts past the browser's slop
            threshold becomes a scroll and never fires a click, and the tap that stops a fling is
            swallowed too, so only a deliberate tap opens it. */}
        <a
          href={venueMap.src.src}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl ring-offset-2 ring-offset-background focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-hidden"
        >
          <Image
            src={venueMap.src}
            alt={venueMap.alt}
            sizes="(min-width: 768px) 768px, 100vw"
            placeholder="blur"
            className="w-full rounded-xl border border-border transition-colors hover:border-primary"
          />
          <span className="sr-only"> — open full size (opens in a new tab)</span>
        </a>
        <figcaption className="text-base text-muted-foreground">
          {/* Said in the guest's own terms: a phone is a tap and a laptop is a click, and the page
              already knows which one it is being read on. */}
          <span className="[@media(pointer:fine)]:hidden">Tap</span>
          <span className="hidden [@media(pointer:fine)]:inline">Click</span> the map to zoom in.
        </figcaption>
      </figure>
    </section>
  );
}

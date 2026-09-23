import Image from 'next/image';
import Link from 'next/link';
import { EventDetails } from '@/components/content/event-details';
import { GalleryGrid } from '@/components/content/gallery-grid';
import { Honorees } from '@/components/content/honorees';
import { buttonClass } from '@/lib/button-class';
import { heroImage } from '@/config/hero';
import { siteConfig } from '@/config/site';
import { formatLongDate } from '@/lib/dates';

export default function HomePage() {
  const date = formatLongDate(siteConfig.event.date);

  return (
    <main>
      <section className="relative isolate flex items-center overflow-hidden lg:min-h-[85svh]">
        <Image
          src={heroImage.src}
          alt={heroImage.alt}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        {/* The photo is bright and busy, so a neutral darkening keeps white text legible on it. */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-14 text-center text-background sm:py-20 lg:space-y-14 lg:py-24">
          <div className="space-y-5 lg:space-y-7">
            <p className="text-xl font-bold tracking-widest uppercase sm:text-2xl">You&apos;re invited</p>
            <h1 className="hero-title-print font-display text-6xl leading-tight sm:text-8xl lg:text-9xl">
              {siteConfig.name}
            </h1>
            <p className="mx-auto max-w-2xl text-xl sm:text-2xl">
              {date ? `${date} · ` : ''}
              {siteConfig.venue.name}, {siteConfig.venue.city}
            </p>
          </div>
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:max-w-xl sm:flex-row">
            <Link
              href="/rsvp"
              className={buttonClass({
                className: 'h-auto min-h-12 flex-1 py-2 text-center text-base whitespace-normal sm:min-h-14 sm:text-lg',
              })}
            >
              RSVP
            </Link>
            <Link
              href="/venue"
              className={buttonClass({
                variant: 'outline',
                // The hero's cream text would otherwise cascade onto the cream button face.
                className:
                  'h-auto min-h-12 flex-1 py-2 text-center text-base whitespace-normal text-foreground sm:min-h-14 sm:text-lg',
              })}
            >
              Venue &amp; directions
            </Link>
          </div>
          <Honorees />
        </div>
      </section>
      <div className="mx-auto w-full max-w-5xl space-y-16 px-4 py-14 sm:py-20">
        <EventDetails />
        <GalleryGrid />
      </div>
    </main>
  );
}

import Link from 'next/link';
import { EventDetails } from '@/components/content/event-details';
import { GalleryGrid } from '@/components/content/gallery-grid';
import { Honorees } from '@/components/content/honorees';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { formatLongDate } from '@/lib/dates';

export default function HomePage() {
  const date = formatLongDate(siteConfig.event.date);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-16 px-4 py-10 sm:py-16">
      <section className="space-y-6 text-center">
        {/* 20px bold counts as large text, where pink on cream (~3.9:1) meets WCAG AA. */}
        <p className="text-xl font-bold tracking-widest text-primary uppercase">You&apos;re invited</p>
        <h1 className="font-display text-6xl leading-tight sm:text-7xl">{siteConfig.name}</h1>
        <p className="mx-auto max-w-xl text-xl text-muted-foreground">
          {date ? `${date} · ` : ''}
          {siteConfig.venue.name}, {siteConfig.venue.city}
        </p>
        <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
          <Link
            href="/rsvp"
            className={buttonVariants({ className: 'h-auto min-h-12 flex-1 py-2 text-center text-base whitespace-normal' })}
          >
            RSVP
          </Link>
          <Link
            href="/venue"
            className={buttonVariants({
              variant: 'outline',
              className: 'h-auto min-h-12 flex-1 py-2 text-center text-base whitespace-normal',
            })}
          >
            Venue &amp; directions
          </Link>
        </div>
      </section>
      <Honorees />
      <EventDetails />
      <GalleryGrid />
    </main>
  );
}

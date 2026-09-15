import type { Metadata } from 'next';
import { ArrivalOptions } from '@/components/content/arrival-options';
import { EventNotices } from '@/components/content/event-notices';
import { RideshareCard } from '@/components/content/rideshare-card';
import { VenueMap } from '@/components/content/venue-map';
import { VenueOverview } from '@/components/content/venue-overview';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Venue & directions · ${siteConfig.name}`,
};

export default function VenuePage() {
  return (
    <main className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10 sm:py-16">
      <VenueOverview />
      <RideshareCard />
      <EventNotices />
      <VenueMap />
      <ArrivalOptions />
    </main>
  );
}

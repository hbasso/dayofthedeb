import type { Metadata } from 'next';
import Link from 'next/link';
import { RsvpFlow } from '@/components/rsvp/rsvp-flow';
import { siteConfig } from '@/config/site';
import { formatEventDate } from '@/lib/dates';

export const metadata: Metadata = {
  title: `RSVP · ${siteConfig.name}`,
};

export default function RsvpPage() {
  const deadline = formatEventDate(siteConfig.rsvpDeadline);

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-10 sm:py-16">
      <Link href="/" className="text-link underline-offset-4 hover:underline">
        ← {siteConfig.name}
      </Link>
      <header className="mt-6 mb-8 space-y-2">
        <h1 className="font-display text-5xl">RSVP</h1>
        <p className="text-lg text-muted-foreground">
          Type the first and last name of anyone in your party to find your invitation.
          {deadline && ` Please respond by ${deadline}.`}
        </p>
      </header>
      <RsvpFlow />
    </main>
  );
}

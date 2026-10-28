import type { Metadata } from 'next';
import { InspirationBoard } from '@/components/content/inspiration-board';
import { Tbd } from '@/components/content/tbd';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Dress code · ${siteConfig.name}`,
};

export default function DressCodePage() {
  const { dressCode } = siteConfig.event;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-4 py-10 sm:py-16">
      <header className="max-w-prose space-y-3">
        {/* The dress code itself is the headline: it is the one thing a guest came to find out,
            and the board below is the long answer to it. */}
        <h1 className="font-display text-5xl sm:text-6xl">
          <Tbd value={dressCode} placeholder="Dress code coming soon" />
        </h1>
        <p className="text-lg text-muted-foreground">
          Placeholder for Vaquera Chiq dress code description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </p>
      </header>
      <InspirationBoard />
    </main>
  );
}

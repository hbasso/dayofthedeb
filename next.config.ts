import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Next 16 only honours qualities listed here, and silently falls back to 75 otherwise, so
    // the hero's quality={65} needs 65 present to take effect. No remotePatterns: every image
    // on the site is a local static import now.
    qualities: [65, 75],
  },
  cacheLife: {
    /**
     * Guest list. `revalidate` is what keeps it fresh: whenever anyone is on the site, the entry
     * refreshes in the background every five minutes and nobody waits.
     *
     * `expire` is deliberately long because of how this event actually gets used. Replies trickle
     * in over a month, so days pass with no traffic at all, and Neon's free-tier compute suspends
     * after five idle minutes. With a one-hour expiry the first guest back after a quiet spell
     * paid for the database waking up; with a week, they are served the cached list instantly and
     * the wake-up happens in the background behind them.
     *
     * The cost is that this first guest can see a list as old as the last visit. RSVP submits call
     * updateTag('guests'), so a guest's own answers are never stale to them; the exposure is host
     * edits, which is what the admin "Refresh guest list" button is for.
     */
    guestList: {
      stale: 60,
      revalidate: 300,
      expire: 604_800,
    },
  },
};

export default nextConfig;

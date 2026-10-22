import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
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
  images: {
    // Placeholder gallery photos (src/config/gallery.ts). One entry per photo actually
    // used there; add a new pathname here whenever a photo is added to that config.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1570423024093-1896ade6736b' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1616357921792-a6ea1d53e13b' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1692428572326-66edcffafca8' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1656525867077-ca7511adc7ab' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1691171347017-d3d3d7b45a95' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-1674491414642-ce5816479852' },
    ],
  },
};

export default nextConfig;

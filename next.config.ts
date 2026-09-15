import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    // Guest list: host edits in Airtable show up within ~5 minutes; RSVP submits call updateTag('guests').
    guestList: {
      stale: 60,
      revalidate: 300,
      expire: 3600,
    },
  },
  images: {
    // Placeholder gallery photos (src/config/gallery.ts).
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com', pathname: '/photo-**' }],
  },
};

export default nextConfig;

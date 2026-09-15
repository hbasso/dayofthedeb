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

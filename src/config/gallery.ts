export interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  photographer: string;
  photoUrl: string;
}

/** Placeholder River Walk photos (free Unsplash license) until the host's own photos arrive. */
export const GALLERY_IS_PLACEHOLDER = true;

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=70`;
}

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: 'river-bridge',
    src: unsplash('1570423024093-1896ade6736b'),
    alt: 'A stone bridge over the San Antonio River Walk',
    photographer: 'Robin LeeAnn',
    photoUrl: 'https://unsplash.com/photos/60eJMAe4LFw',
  },
  {
    id: 'river-footbridge',
    src: unsplash('1616357921792-a6ea1d53e13b'),
    alt: 'People crossing a footbridge on the River Walk on a sunny day',
    photographer: 'Carl Hunley Jr',
    photoUrl: 'https://unsplash.com/photos/lQ02HboejMQ',
  },
  {
    id: 'river-downtown',
    src: unsplash('1692428572326-66edcffafca8'),
    alt: 'The river winding past a tall downtown building',
    photographer: 'Prathibha Murdough',
    photoUrl: 'https://unsplash.com/photos/e3GwZkyIL-0',
  },
  {
    id: 'river-promenade',
    src: unsplash('1656525867077-ca7511adc7ab'),
    alt: 'River Walk promenade lined with buildings and visitors',
    photographer: 'Lesli Whitecotton',
    photoUrl: 'https://unsplash.com/photos/0t2dO-YWkuI',
  },
  {
    id: 'river-skyline',
    src: unsplash('1691171347017-d3d3d7b45a95'),
    alt: 'The river running between downtown San Antonio buildings',
    photographer: 'Thomas Stephan',
    photoUrl: 'https://unsplash.com/photos/QiKzLPX5X2c',
  },
  {
    id: 'river-waterfront',
    src: unsplash('1674491414642-ce5816479852'),
    alt: 'A large building beside the water on the River Walk',
    photographer: 'Valerie Cervantes',
    photoUrl: 'https://unsplash.com/photos/Ek5rjcPxHFo',
  },
];

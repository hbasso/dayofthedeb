import Image from 'next/image';
import { GALLERY_IS_PLACEHOLDER, galleryPhotos } from '@/config/gallery';

export function GalleryGrid() {
  return (
    <section aria-labelledby="gallery-heading" className="space-y-4">
      <h2 id="gallery-heading" className="font-display text-3xl">
        On the River Walk
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {galleryPhotos.map((photo) => (
          <li key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <Image src={photo.src} alt={photo.alt} fill sizes="(min-width: 640px) 33vw, 50vw" className="object-cover" />
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">
        {GALLERY_IS_PLACEHOLDER && 'Placeholder photos. '}
        Photos by{' '}
        {galleryPhotos.map((photo, index) => (
          <span key={photo.id}>
            {index > 0 && ', '}
            <a href={photo.photoUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
              {photo.photographer}
            </a>
          </span>
        ))}{' '}
        on Unsplash.
      </p>
    </section>
  );
}

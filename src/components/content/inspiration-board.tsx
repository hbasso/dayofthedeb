import Image from 'next/image';
import { dressCodePhotos } from '@/config/dress-code-photos';

/** Enough to fill a phone screen; the rest load as they are scrolled towards. */
const EAGER_COUNT = 4;

export function InspirationBoard() {
  return (
    // CSS columns rather than a grid: the photos run from tall portrait to landscape, and a grid
    // would have to crop them. Cropping an outfit is exactly the information a guest came for.
    <div
      aria-hidden
      className="columns-2 gap-2 sm:columns-3 sm:gap-3 lg:columns-4 [column-fill:_balance]"
    >
      {dressCodePhotos.map((photo, index) => (
        <Image
          key={photo.src}
          src={photo}
          alt=""
          placeholder="blur"
          priority={index < EAGER_COUNT}
          // Everything after the first screenful keeps next/image's default lazy loading.
          sizes="(min-width: 1024px) 288px, (min-width: 640px) 33vw, 50vw"
          className="mb-2 w-full rounded-lg bg-muted sm:mb-3"
        />
      ))}
    </div>
  );
}

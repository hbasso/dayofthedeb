import Image from 'next/image';
import { dressCodePhotos } from '@/config/dress-code-photos';
import { masonryColumns } from '@/lib/masonry';

/** Enough to fill a phone screen; the rest load as they are scrolled towards. */
const EAGER_COUNT = 4;

/** Same for every layout, so each picks the same file and the phone layout's preloads are reused. */
const SIZES = '(min-width: 1024px) 288px, (min-width: 640px) 33vw, 50vw';

/**
 * One layout per breakpoint, only one of them displayed. Each is laid out ahead of time so the
 * list order in dress-code-photos.ts is the order a guest reads: the first photos form the top row
 * at every screen size. CSS columns could not promise that, because they fill one column top to
 * bottom before the next begins.
 */
const LAYOUTS = [
  { columns: 2, className: 'flex gap-2 sm:hidden', gap: 'gap-2' },
  { columns: 3, className: 'hidden gap-3 sm:flex lg:hidden', gap: 'gap-3' },
  { columns: 4, className: 'hidden gap-3 lg:flex', gap: 'gap-3' },
] as const;

const entries = dressCodePhotos.map((photo, index) => ({
  photo,
  index,
  width: photo.width,
  height: photo.height,
}));

export function InspirationBoard() {
  return (
    // A masonry board rather than a grid: the photos run from tall portrait to landscape, and a
    // grid would have to crop them. Cropping an outfit is exactly the information a guest came for.
    <div aria-hidden>
      {LAYOUTS.map((layout) => (
        <div key={layout.columns} className={layout.className}>
          {masonryColumns(entries, layout.columns).map((column, c) => (
            <div key={c} className={`flex min-w-0 flex-1 flex-col ${layout.gap}`}>
              {column.map(({ photo, index }) => (
                <Image
                  key={photo.src}
                  src={photo}
                  alt=""
                  placeholder="blur"
                  // Preload only from the phone layout, so a hidden layout never adds requests.
                  // Wider layouts show the same first photos in their top row and find them cached;
                  // their images stay lazy, which still loads them at once when on screen.
                  priority={layout.columns === 2 && index < EAGER_COUNT}
                  sizes={SIZES}
                  className="w-full rounded-lg bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

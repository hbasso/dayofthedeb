import { getImageProps } from 'next/image';
import { preload } from 'react-dom';
import { Suspense } from 'react';
import { UnlockForm } from '@/components/auth/unlock-form';
import { heroImage } from '@/config/hero';
import { siteConfig } from '@/config/site';
import { safeNextPath } from '@/lib/routes';

export default function UnlockPage({ searchParams }: PageProps<'/unlock'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="font-display text-4xl">{siteConfig.name}</h1>
        <p className="text-lg text-muted-foreground">Enter the password printed on your invitation.</p>
        <Suspense fallback={null}>
          <UnlockFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

/**
 * Fetches the home page's hero while the guest is still typing.
 *
 * Entering a password takes several seconds and this page asks almost nothing of the network,
 * so the banner can be in the browser cache before the redirect even happens. getImageProps
 * builds the same srcset the home page will render, which is the whole trick: a preload that
 * names a different variant is just wasted bytes.
 *
 * Low priority on purpose. The fonts on this page are what the guest is reading right now, and
 * a speculative image must not get in front of them.
 */
function preloadHero() {
  const { props } = getImageProps({
    src: heroImage.src,
    alt: heroImage.alt,
    fill: true,
    sizes: heroImage.sizes,
    quality: heroImage.quality,
  });
  preload(props.src, {
    as: 'image',
    imageSrcSet: props.srcSet,
    imageSizes: props.sizes,
    fetchPriority: 'low',
  });
}

async function UnlockFormWithNext({ searchParams }: Pick<PageProps<'/unlock'>, 'searchParams'>) {
  const { next } = await searchParams;
  const destination = typeof next === 'string' ? next : '/';
  // Only when they are actually headed home. A guest who deep-linked to /venue lands there
  // instead, and the hero would be bytes they never see.
  if (safeNextPath(destination) === '/') preloadHero();
  return <UnlockForm next={destination} />;
}

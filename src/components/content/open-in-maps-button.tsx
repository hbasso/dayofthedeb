'use client';

import { useSyncExternalStore } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { appleMapsSearchUrl, googleMapsSearchUrl } from '@/lib/maps';
import { isApplePlatform } from '@/lib/platform';

const subscribe = () => () => {};

interface OpenInMapsButtonProps {
  query: string;
  label: string;
  variant?: 'default' | 'outline';
}

/** Google Maps link on the server and non-Apple devices; Apple Maps on iPhone, iPad, and Mac. */
export function OpenInMapsButton({ query, label, variant = 'default' }: OpenInMapsButtonProps) {
  const apple = useSyncExternalStore(
    subscribe,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );
  const href = apple ? appleMapsSearchUrl(query) : googleMapsSearchUrl(query);

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant, className: 'h-12 w-full text-base' })}>
      {label}
    </a>
  );
}

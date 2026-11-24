'use client';

import { useSyncExternalStore } from 'react';
import { ClickArrow, clickArrowGapCentered } from '@/components/content/click-arrow';
import type { Coordinates } from '@/config/directions';
import { buttonClass } from '@/lib/button-class';
import { appleMapsPointUrl, appleMapsSearchUrl, googleMapsPointUrl, googleMapsSearchUrl } from '@/lib/maps';
import { isApplePlatform } from '@/lib/platform';

const subscribe = () => () => {};

interface OpenInMapsButtonProps {
  /** Text search, used when there is no pin to open directly. */
  query: string;
  /** The exact place, when it is known. A name search can land the guest on a list of results. */
  coordinates?: Coordinates | null;
  /** Name for the pin Apple Maps drops at those coordinates. Defaults to the query. */
  pinLabel?: string;
  label: string;
  /**
   * Names what opens, for screen readers only. The visible label is the same short phrase on
   * every one of these buttons, which is fine on screen -- each sits under the heading it belongs
   * to -- but a links list read out of that context would otherwise be three identical entries.
   */
  target?: string;
  variant?: 'default' | 'outline';
}

/** Google Maps link on the server and non-Apple devices; Apple Maps on iPhone, iPad, and Mac. */
export function OpenInMapsButton({ query, coordinates, pinLabel, label, target, variant = 'default' }: OpenInMapsButtonProps) {
  const apple = useSyncExternalStore(
    subscribe,
    () => isApplePlatform(navigator.userAgent),
    () => false,
  );

  let href: string;
  if (coordinates) {
    href = apple ? appleMapsPointUrl(coordinates, pinLabel ?? query) : googleMapsPointUrl(coordinates);
  } else {
    href = apple ? appleMapsSearchUrl(query) : googleMapsSearchUrl(query);
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass({
        variant,
        // The outline face is cream, and the hero's cream text would otherwise cascade onto it.
        className: `relative h-auto min-h-12 w-full py-2 ${clickArrowGapCentered} text-center text-base whitespace-normal ${variant === 'outline' ? 'text-foreground' : ''}`,
      })}
    >
      {label}
      {target && <span className="sr-only">: {target}</span>}
      <span className="sr-only"> (opens in a new tab)</span>
      <ClickArrow />
    </a>
  );
}

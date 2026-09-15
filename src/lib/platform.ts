const APPLE_MARKERS = ['iPhone', 'iPad', 'iPod', 'Macintosh'] as const;

/** Apple devices get Apple Maps links; everything else gets Google Maps. */
export function isApplePlatform(userAgent: string): boolean {
  return APPLE_MARKERS.some((marker) => userAgent.includes(marker));
}

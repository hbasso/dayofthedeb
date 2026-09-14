const PUBLIC_PATHS = ['/unlock'] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Only same-origin paths survive; anything else (or the unlock page itself) goes home. */
export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/';
  if (/[\t\\]/.test(next)) return '/';
  const pathname = next.split(/[?#]/, 1)[0];
  return isPublicPath(pathname) ? '/' : next;
}

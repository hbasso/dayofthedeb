const PUBLIC_PATHS = ['/unlock'] as const;
const ADMIN_PATHS = ['/admin', '/api/export'] as const;

export const ADMIN_HOME_PATH = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';

function matchesAny(pathname: string, paths: readonly string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isPublicPath(pathname: string): boolean {
  return matchesAny(pathname, PUBLIC_PATHS);
}

export function isAdminPath(pathname: string): boolean {
  return matchesAny(pathname, ADMIN_PATHS);
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH;
}

/** A same-origin path, or null. */
function internalPath(next: unknown): string | null {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return null;
  // Control characters (browsers strip tabs/newlines, turning /<tab>/x into //x) and backslashes (0x5c).
  if ([...next].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x5c)) return null;
  return next;
}

function pathnameOf(path: string): string {
  return path.split(/[?#]/, 1)[0];
}

/** Only same-origin paths survive; anything else (or the unlock page itself) goes home. */
export function safeNextPath(next: unknown): string {
  const path = internalPath(next);
  return path && !isPublicPath(pathnameOf(path)) ? path : '/';
}

/** After admin sign-in: only admin pages (not the login page or the API) survive; anything else goes to /admin. */
export function safeAdminNextPath(next: unknown): string {
  const path = internalPath(next);
  if (!path) return ADMIN_HOME_PATH;
  const pathname = pathnameOf(path);
  const isAdminPage = matchesAny(pathname, [ADMIN_HOME_PATH]) && !isAdminLoginPath(pathname);
  return isAdminPage ? path : ADMIN_HOME_PATH;
}

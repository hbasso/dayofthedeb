import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_LOGIN_PATH } from '@/lib/routes';
import { adminSessionOptions, siteSessionOptions, type AdminSession, type SiteSession } from '@/lib/session';

/** Constant-time comparison. Hashing first gives equal-length buffers regardless of input length. */
export function passwordsMatch(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The site password is printed on paper; forgive stray spaces and capitalization. */
export function normalizeSitePassword(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * The admin password is typed by the host, not printed, so case still counts. Whitespace does
 * not: a value pasted into the Vercel env UI with a trailing space would otherwise never match
 * anything the host could type, locking them out of /admin with only "that isn't right" to go on.
 */
export function normalizeAdminPassword(value: string): string {
  return value.trim();
}

export async function getSiteSession() {
  return getIronSession<SiteSession>(await cookies(), siteSessionOptions());
}

/** First line of every server action except unlockSite. Proxy coverage follows the route, not the action. */
export async function requireSiteSession(): Promise<void> {
  const session = await getSiteSession();
  if (session.unlocked !== true) redirect('/unlock');
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), adminSessionOptions());
}

/** First line of every admin server action and before any admin data read. The proxy guards the routes; this guards the data. */
export async function requireAdminSession(): Promise<void> {
  const session = await getAdminSession();
  if (session.admin !== true) redirect(ADMIN_LOGIN_PATH);
}

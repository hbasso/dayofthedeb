import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { siteSessionOptions, type SiteSession } from '@/lib/session';

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

export async function getSiteSession() {
  return getIronSession<SiteSession>(await cookies(), siteSessionOptions());
}

import { unsealData, type SessionOptions } from 'iron-session';
import { getAuthSecret } from '@/lib/env';

export const SITE_SESSION_COOKIE = 'site_session';
export const SITE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 45;

export interface SiteSession {
  unlocked?: boolean;
}

export function siteSessionOptions(): SessionOptions {
  return {
    password: getAuthSecret(),
    cookieName: SITE_SESSION_COOKIE,
    ttl: SITE_SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

export async function isSiteSealValid(seal: string | undefined): Promise<boolean> {
  const password = getAuthSecret(); // outside the try: misconfiguration should fail loudly
  if (!seal) return false;
  try {
    const data = await unsealData<SiteSession>(seal, { password, ttl: SITE_SESSION_TTL_SECONDS });
    return data.unlocked === true;
  } catch {
    return false;
  }
}

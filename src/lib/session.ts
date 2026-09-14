import { unsealData, type SessionOptions } from 'iron-session';
import { getAuthSecret } from '@/lib/env';

export const SITE_SESSION_COOKIE = 'site_session';
export const SITE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 45;
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SiteSession {
  unlocked?: boolean;
}

export interface AdminSession {
  admin?: boolean;
}

function sessionOptions(cookieName: string, ttl: number): SessionOptions {
  return {
    password: getAuthSecret(),
    cookieName,
    ttl,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

export function siteSessionOptions(): SessionOptions {
  return sessionOptions(SITE_SESSION_COOKIE, SITE_SESSION_TTL_SECONDS);
}

export function adminSessionOptions(): SessionOptions {
  return sessionOptions(ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS);
}

async function isSealValid<T>(seal: string | undefined, ttl: number, isGranted: (data: T) => boolean): Promise<boolean> {
  const password = getAuthSecret(); // outside the try: misconfiguration should fail loudly
  if (!seal) return false;
  try {
    return isGranted(await unsealData<T>(seal, { password, ttl }));
  } catch {
    return false;
  }
}

export function isSiteSealValid(seal: string | undefined): Promise<boolean> {
  return isSealValid<SiteSession>(seal, SITE_SESSION_TTL_SECONDS, (data) => data.unlocked === true);
}

export function isAdminSealValid(seal: string | undefined): Promise<boolean> {
  return isSealValid<AdminSession>(seal, ADMIN_SESSION_TTL_SECONDS, (data) => data.admin === true);
}

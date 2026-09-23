'use server';

import { redirect } from 'next/navigation';
import { getSiteSession, normalizeSitePassword, passwordsMatch } from '@/lib/auth';
import { getSitePassword } from '@/lib/env';
import { safeNextPath } from '@/lib/routes';

export interface UnlockState {
  error?: string;
}

export async function unlockSite(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  let sitePassword: string;
  try {
    sitePassword = getSitePassword();
  } catch (error) {
    // Without this the throw reaches guests as Next's raw error screen: /unlock has no error
    // boundary, and it is the first page every guest sees.
    console.error('site unlock misconfigured', error);
    return { error: "The site isn't ready just yet. Please try again in a little while." };
  }

  const input = formData.get('password');
  const valid =
    typeof input === 'string' && passwordsMatch(normalizeSitePassword(input), normalizeSitePassword(sitePassword));

  if (!valid) {
    return { error: "That password doesn't match the one on your invitation. Please try again." };
  }

  const session = await getSiteSession();
  session.unlocked = true;
  await session.save();

  redirect(safeNextPath(formData.get('next')));
}

'use server';

import { redirect } from 'next/navigation';
import { getSiteSession, normalizeSitePassword, passwordsMatch } from '@/lib/auth';
import { getSitePassword } from '@/lib/env';
import { safeNextPath } from '@/lib/routes';

export interface UnlockState {
  error?: string;
}

export async function unlockSite(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const input = formData.get('password');
  const valid =
    typeof input === 'string' &&
    passwordsMatch(normalizeSitePassword(input), normalizeSitePassword(getSitePassword()));

  if (!valid) {
    return { error: "That password doesn't match the one on your invitation. Please try again." };
  }

  const session = await getSiteSession();
  session.unlocked = true;
  await session.save();

  redirect(safeNextPath(formData.get('next')));
}

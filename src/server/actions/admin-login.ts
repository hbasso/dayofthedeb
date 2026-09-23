'use server';

import { redirect } from 'next/navigation';
import { getAdminSession, normalizeAdminPassword, passwordsMatch } from '@/lib/auth';
import { getAdminPassword } from '@/lib/env';
import { ADMIN_LOGIN_PATH, safeAdminNextPath } from '@/lib/routes';

export interface AdminLoginState {
  error?: string;
}

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  let adminPassword: string;
  try {
    adminPassword = getAdminPassword();
  } catch (error) {
    console.error('admin sign-in misconfigured', error);
    return { error: 'Admin sign-in is not set up yet. Check ADMIN_PASSWORD.' };
  }

  const input = formData.get('password');
  if (
    typeof input !== 'string' ||
    !passwordsMatch(normalizeAdminPassword(input), normalizeAdminPassword(adminPassword))
  ) {
    return { error: "That admin password isn't right." };
  }

  const session = await getAdminSession();
  session.admin = true;
  await session.save();

  redirect(safeAdminNextPath(formData.get('next')));
}

export async function adminLogout(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
  redirect(ADMIN_LOGIN_PATH);
}

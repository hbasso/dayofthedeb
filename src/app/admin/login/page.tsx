import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { siteConfig } from '@/config/site';
import { getAdminSession } from '@/lib/auth';
import { safeAdminNextPath } from '@/lib/routes';

export const metadata: Metadata = {
  title: `Admin sign in · ${siteConfig.name}`,
};

export default function AdminLoginPage({ searchParams }: PageProps<'/admin/login'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">{siteConfig.name}</p>
          <h1 className="font-display text-4xl">Guest list admin</h1>
        </div>
        <Suspense fallback={null}>
          <AdminLoginFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function AdminLoginFormWithNext({ searchParams }: Pick<PageProps<'/admin/login'>, 'searchParams'>) {
  const session = await getAdminSession();
  const { next } = await searchParams;
  if (session.admin === true) redirect(safeAdminNextPath(next));
  return <AdminLoginForm next={typeof next === 'string' ? next : '/admin'} />;
}

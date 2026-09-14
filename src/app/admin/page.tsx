import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: `Admin · ${siteConfig.name}`,
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <Suspense fallback={<p className="text-lg text-muted-foreground">Loading the guest list…</p>}>
        <AdminDashboard />
      </Suspense>
    </main>
  );
}

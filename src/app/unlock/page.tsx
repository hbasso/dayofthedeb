import { Suspense } from 'react';
import { UnlockForm } from '@/components/auth/unlock-form';
import { siteConfig } from '@/config/site';

export default function UnlockPage({ searchParams }: PageProps<'/unlock'>) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="font-display text-4xl">{siteConfig.name}</h1>
        <p className="text-lg text-muted-foreground">Enter the password printed on your invitation.</p>
        <Suspense fallback={null}>
          <UnlockFormWithNext searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function UnlockFormWithNext({ searchParams }: Pick<PageProps<'/unlock'>, 'searchParams'>) {
  const { next } = await searchParams;
  return <UnlockForm next={typeof next === 'string' ? next : '/'} />;
}

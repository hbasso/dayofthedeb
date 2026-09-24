'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const pathname = usePathname();
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'inline-flex h-11 items-center rounded-lg px-3 text-base font-semibold transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-hidden',
        // Underlined, not just recoloured: primary against foreground is 2.27:1, which a
        // colour-vision-deficient reader cannot rely on to tell the current page apart.
        active ? 'text-primary underline decoration-2 underline-offset-8' : 'text-foreground',
      )}
    >
      {children}
    </Link>
  );
}

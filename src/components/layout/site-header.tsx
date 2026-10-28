import Link from 'next/link';
import { NavLink } from '@/components/layout/nav-link';
import { siteConfig } from '@/config/site';

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
        <Link href="/" className="font-display text-2xl text-foreground">
          {siteConfig.name}
        </Link>
        <nav aria-label="Main">
          {/* Wraps rather than overflows: four links plus the wordmark are wider than a 360px
              phone, so on the narrowest screens the nav takes a second line instead of clipping. */}
          <ul className="flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5">
            <li>
              <NavLink href="/">Home</NavLink>
            </li>
            <li>
              <NavLink href="/rsvp">RSVP</NavLink>
            </li>
            <li>
              <NavLink href="/venue">Venue</NavLink>
            </li>
            <li>
              <NavLink href="/dress-code">Dress code</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

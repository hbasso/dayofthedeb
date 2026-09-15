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
          <ul className="flex items-center gap-1">
            <li>
              <NavLink href="/">Home</NavLink>
            </li>
            <li>
              <NavLink href="/rsvp">RSVP</NavLink>
            </li>
            <li>
              <NavLink href="/venue">Venue</NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

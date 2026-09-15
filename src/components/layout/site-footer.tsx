import { siteConfig } from '@/config/site';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 text-center text-sm text-muted-foreground">
        {siteConfig.name} · {siteConfig.venue.name}, {siteConfig.venue.city}, {siteConfig.venue.region} · A private celebration
      </div>
    </footer>
  );
}

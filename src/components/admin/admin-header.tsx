import { RefreshButton } from '@/components/admin/refresh-button';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';
import { adminLogout } from '@/server/actions/admin-login';

export function AdminHeader() {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">{siteConfig.name}</p>
        <h1 className="font-display text-4xl">Guest list admin</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <RefreshButton />
        <form action={adminLogout}>
          <Button type="submit" variant="ghost" className="h-10 text-base">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}

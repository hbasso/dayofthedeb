import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { siteConfig } from '@/config/site';
import './globals.css';

const display = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', axes: ['opsz'] });
const text = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans' });

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The site is light-only by decision. globals.css pins Tailwind's `dark:` variant to a .dark
    // class that is never applied, so shadcn's own dark styles stay dormant even on a dark OS.
    <html lang="en" className={`${display.variable} ${text.variable}`}>
      {/* overflow-x-clip, not hidden: full-bleed bands measured in vw overhang by the scrollbar
          width, and clip contains them without creating a scroll container that would break
          the admin table's sticky first column. */}
      <body className="min-h-dvh overflow-x-clip bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}

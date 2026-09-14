# Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed, password-gated Next.js 16 skeleton for the Day of the Deb RSVP site, with the fiesta theme, typed site config, domain types, and a working `/unlock` flow.

**Architecture:** Next.js 16 App Router under `src/`, with `cacheComponents` on from day one so later phases can use `'use cache'` and `cacheTag`. A Node-runtime `src/proxy.ts` (the Next 16 name for middleware) checks an iron-session sealed `site_session` cookie on every route except `/unlock`. The unlock page posts to a `unlockSite` server action that compares passwords in constant time, saves the session, and redirects to a sanitized `next` path. Pure helpers (redirect sanitizing, seal checking, password comparison) are unit-tested with Vitest.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (CLI 4.x), next-themes, iron-session 8, Vitest, GitHub, Vercel.

**Spec:** `DESIGN.md` at the repo root. Phase 1 covers spec §14 steps 1 and 3, plus the repo and deploy setup.

## Global Constraints

- Next.js **16** conventions: `src/proxy.ts` exporting `proxy` (not `middleware.ts`). Proxy runs on Node, not edge.
- `next.config.ts` sets `cacheComponents: true`. Any page reading `searchParams`, `cookies()`, or `headers()` must do so inside a `<Suspense>` boundary.
- TypeScript everywhere. Import alias `@/*` → `src/*`.
- Colors only via semantic Tailwind tokens (`bg-primary`, `text-foreground`, `text-link`, `bg-success`). No hex or oklch literals outside `src/app/globals.css`.
- Do not hand-edit files in `src/components/ui/` (shadcn-generated).
- All event copy (name, venue, dates) comes from `src/config/site.ts`.
- One component, one job; soft ceiling ~150 lines per file. Pages compose only, no business logic.
- Env vars are server-only, never `NEXT_PUBLIC_`: `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `SITE_PASSWORD`, `ADMIN_PASSWORD`, `AUTH_SECRET` (≥32 chars).
- Cookies: httpOnly, `secure` in production, `sameSite=lax`, sealed with `AUTH_SECRET`, ~45-day TTL.
- Password checks are server-side only and constant-time.
- Search engines must not index the site (`robots: noindex, nofollow`).
- Shell: commands below are POSIX (Git Bash). Package manager: npm.

## File Map

| File | Responsibility |
|---|---|
| `next.config.ts` | `cacheComponents: true` |
| `vitest.config.mts` | Test runner config, `@` alias, `server-only` stub |
| `src/test/server-only-stub.ts` | Empty module so `server-only` imports don't throw under Vitest |
| `.env.example` | Documents every env var (committed) |
| `src/app/globals.css` | Tailwind v4 + shadcn tokens; the fiesta palette lives here |
| `src/app/layout.tsx` | Fonts, ThemeProvider, metadata (thin) |
| `src/app/page.tsx` | Temporary landing stub with palette swatches (replaced in Phase 6) |
| `src/app/unlock/page.tsx` | Site password page shell |
| `src/components/theme-provider.tsx` | next-themes client wrapper |
| `src/components/auth/unlock-form.tsx` | Client password form (`useActionState`) |
| `src/config/site.ts` | Event name, venue, dates (one source) |
| `src/types/domain.ts` | `Attendance`, `Guest`, `Invitation` |
| `src/lib/routes.ts` | Pure: `isPublicPath`, `safeNextPath` |
| `src/lib/env.ts` | Lazy, validated env getters |
| `src/lib/session.ts` | iron-session options, `isSiteSealValid` (used by proxy) |
| `src/lib/auth.ts` | server-only: `passwordsMatch`, `normalizeSitePassword`, `getSiteSession` |
| `src/server/actions/unlock-site.ts` | `'use server'` unlock action |
| `src/proxy.ts` | Layer 1 gate |

`src/lib/session.ts` and `src/lib/env.ts` intentionally do **not** import `server-only`, because `src/proxy.ts` imports them. Their values are non-`NEXT_PUBLIC_` env vars, which Next never puts in client bundles. `src/lib/auth.ts` (which uses `next/headers`) does import `server-only`.

---

### Task 1: Scaffold the Next.js project and git repo

**Files:**
- Create: whole scaffold (`package.json`, `next.config.ts`, `tsconfig.json`, `src/app/*`, `.gitignore`, `AGENTS.md`, etc.)
- Modify: `.gitignore`, `next.config.ts`, `package.json` (name)
- Modify: `DESIGN.md` (bring spec in line with Next 16; see Step 7)

**Interfaces:**
- Produces: a buildable Next 16 app under `src/`, git repo on branch `main`.

- [ ] **Step 1: Scaffold into a temporary subfolder**

The repo root already has `DESIGN.md` and `docs/`, so `create-next-app` would refuse to run there. Scaffold into a sibling folder inside the repo, then move it up.

Run (from repo root):
```bash
npx -y create-next-app@16.3.5 scaffold-tmp --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --skip-install --disable-git --agents-md --yes
```
Expected: "Success! Created scaffold-tmp".

- [ ] **Step 2: Move the scaffold to the repo root**

```bash
cp -r scaffold-tmp/. . && rm -rf scaffold-tmp
```
Then in `package.json` change `"name": "scaffold-tmp"` to `"name": "dayofthedeb"`.

- [ ] **Step 3: Install dependencies**

```bash
npm install
npm install iron-session@^8 next-themes@^0.4 server-only
npm install -D vitest
```
Expected: installs without errors.

- [ ] **Step 4: Enable Cache Components**

Replace `next.config.ts` with:
```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

- [ ] **Step 5: Allow `.env.example` through `.gitignore`**

The generated `.gitignore` ignores `.env*`. Directly below that line add:
```
!.env.example
```

- [ ] **Step 6: Verify the build**

Run: `npm run build`
Expected: "Compiled successfully" and a route table listing `/`.

- [ ] **Step 7: Update DESIGN.md for Next 16**

Make these exact edits so the spec stays the source of truth:

1. In §5 Layer 1, replace `` `middleware.ts` checks a signed `site_session` cookie`` with `` `src/proxy.ts` (Next 16's name for middleware; Node runtime) checks a sealed `site_session` cookie``.
2. In §5 "Security requirements", replace the bullet starting `Rate-limit the unlock and admin-login endpoints.` with:
   `- Rate-limit the unlock and admin-login endpoints. In-memory counters do not work on Vercel (each serverless instance has its own memory), so use Upstash Redis if limiting is added.`
3. In §5 "Security requirements", add a bullet:
   `- The submit-rsvp action must verify that every submitted guest ID belongs to the submitted invitation before writing, and every server action re-checks the site session itself rather than relying on the proxy alone.`
4. In §5 "Security requirements", replace `The middleware matcher must exclude` with `The proxy matcher must exclude`.
5. In §6 step 7, replace `then revalidates the cache tag` with `then calls updateTag('guests') (read-your-own-writes)`.
6. In §9 Mechanism, replace `Keep the bare-HSL token format so Tailwind opacity modifiers (\`bg-primary/10\`) work.` with `Tokens use OKLCH (the shadcn v4 default); Tailwind v4 opacity modifiers (\`bg-primary/10\`) work with any color format.`
7. In §10 tree, replace `├─ middleware.ts                    # Layer 1 + Layer 3 cookie gates` with `├─ proxy.ts                         # Layer 1 + Layer 3 cookie gates (Next 16 middleware)`.
8. In §11 first bullet, replace `wraps the Airtable fetch in Next's cache with a tag (e.g. \`guests\`).` with `wraps the Airtable fetch in a \`'use cache'\` function with \`cacheTag('guests')\` and a \`cacheLife\` of a few minutes.`
9. In §11, replace `\`submit-rsvp\` revalidates the \`guests\` tag after writing` with `\`submit-rsvp\` calls \`updateTag('guests')\` after writing`, and replace `Optionally add a manual "refresh" affordance on the admin page that revalidates on demand.` with `Optionally add a manual "refresh" affordance on the admin page that calls \`revalidateTag('guests', 'max')\`.`
10. In §7, replace `The page has three parts:` with `The page has four parts:`.

- [ ] **Step 8: Initialize git and commit**

```bash
git init -b main
git add -A
git commit -m "chore: scaffold Next.js 16 app and align spec with Next 16"
```
Expected: commit created. Confirm `git status` is clean and `node_modules/` and `.next/` are not tracked.

---

### Task 2: Theme, fonts, layout, site config, domain types

**Files:**
- Create: `components.json`, `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`, `src/lib/utils.ts` (all via shadcn CLI)
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/components/theme-provider.tsx`, `src/config/site.ts`, `src/types/domain.ts`

**Interfaces:**
- Produces: `siteConfig: SiteConfig` from `@/config/site`; types `Attendance`, `Guest`, `Invitation` from `@/types/domain`; `Button`, `Input`, `Label` from `@/components/ui/*`; Tailwind utilities `font-display`, `font-sans`, `bg-primary`, `bg-secondary`, `text-link`, `bg-success`, `text-success-foreground`, `bg-turquoise`, `bg-sunny`.

- [ ] **Step 1: Initialize shadcn**

```bash
npx -y shadcn@4.21.0 init -d
```
If it prompts anyway, choose component library **base**, preset **base-nova**, and accept CSS variables. Expected: writes `components.json`, `src/lib/utils.ts`, and rewrites `src/app/globals.css`.

- [ ] **Step 2: Add the Phase 1 primitives**

```bash
npx -y shadcn@4.21.0 add button input label
```
Expected: creates `src/components/ui/button.tsx`, `input.tsx`, `label.tsx`.

- [ ] **Step 3: Replace the token block in `src/app/globals.css`**

Keep every `@import` and `@custom-variant` line shadcn generated at the top of the file. Delete everything below them (the generated `@theme inline`, `:root`, `.dark`, and `@layer base` blocks) and put this in their place:

```css
@theme inline {
  --font-sans: var(--font-source-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-link: var(--link);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-turquoise: var(--turquoise);
  --color-sunny: var(--sunny);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

/* Fiesta palette (DESIGN.md §9). Retune colors here only. */
:root {
  --radius: 0.75rem;

  --background: oklch(0.972 0.016 82.8); /* warm cream #FBF5EA */
  --foreground: oklch(0.33 0.134 26.3); /* deep fiesta red #6A0008 */
  --card: oklch(0.992 0.009 84.6); /* #FFFCF6 */
  --card-foreground: oklch(0.33 0.134 26.3);
  --popover: oklch(0.992 0.009 84.6);
  --popover-foreground: oklch(0.33 0.134 26.3);

  --primary: oklch(0.618 0.241 355.3); /* fiesta hot pink #E91E8C */
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.675 0.151 65.6); /* marigold #D48000 */
  --secondary-foreground: oklch(0.33 0.134 26.3); /* ink, not white: white on marigold is 3.05:1 */
  --accent: oklch(0.675 0.151 65.6);
  --accent-foreground: oklch(0.33 0.134 26.3);

  --muted: oklch(0.94 0.022 80.7); /* #F3EADB */
  --muted-foreground: oklch(0.463 0.067 26.4); /* #7A4A45, 6.7:1 on cream */
  --destructive: oklch(0.539 0.194 26.7); /* #C62828 */
  --border: oklch(0.891 0.035 78.7); /* #E8D9C2 */
  --input: oklch(0.891 0.035 78.7);
  --ring: oklch(0.618 0.241 355.3);

  --link: oklch(0.513 0.16 255.7); /* altar cobalt #1565C0 */
  --success: oklch(0.523 0.152 147.8); /* mexico green #008030 */
  --success-foreground: oklch(1 0 0);
  --turquoise: oklch(0.657 0.112 194.8); /* #00A6A6, decorative only */
  --sunny: oklch(0.84 0.172 90.4); /* #F5C400, decorative only */
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Create the theme provider**

`src/components/theme-provider.tsx`:
```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

- [ ] **Step 5: Create the site config**

`src/config/site.ts`:
```ts
export interface SiteConfig {
  name: string;
  description: string;
  venue: {
    name: string;
    city: string;
  };
  /** ISO 8601 with offset, e.g. "2026-12-05T19:00:00-06:00". null until the host confirms. */
  eventStartsAt: string | null;
  /** ISO 8601 date, e.g. "2026-11-15". null until the host confirms. */
  rsvpDeadline: string | null;
}

export const siteConfig: SiteConfig = {
  name: 'Day of the Deb',
  description: 'A private débutante celebration. Event details and RSVP for invited guests.',
  venue: {
    name: 'Mexico Ceaty',
    city: 'San Antonio, TX',
  },
  eventStartsAt: null,
  rsvpDeadline: null,
};
```

- [ ] **Step 6: Create the domain types**

`src/types/domain.ts` (verbatim from DESIGN.md §4):
```ts
export type Attendance = 'yes' | 'no' | null;

export interface Guest {
  id: string;
  name: string;
  altNames?: string[];
  hasPlusOne: boolean; // host-set: may this guest bring a plus-one
  attending: Attendance;
  plusOneName?: string; // captured at RSVP when they bring one; filled => counts a +1
}

export interface Invitation {
  id: string;
  household: string;
  email?: string;
  guests: Guest[];
}
```

- [ ] **Step 7: Replace the root layout**

`src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Fraunces, Source_Sans_3 } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
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
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${text.variable}`}>
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Replace the home page with a temporary stub**

`src/app/page.tsx` (Phase 6 replaces this with the real landing page):
```tsx
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/config/site';

const swatches = ['bg-primary', 'bg-secondary', 'bg-link', 'bg-success', 'bg-turquoise', 'bg-sunny', 'bg-foreground'];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {siteConfig.venue.name} · {siteConfig.venue.city}
      </p>
      <h1 className="font-display text-5xl sm:text-6xl">{siteConfig.name}</h1>
      <p className="text-lg text-muted-foreground">{siteConfig.description}</p>
      <div className="flex gap-2" aria-hidden>
        {swatches.map((swatch) => (
          <span key={swatch} className={`size-8 rounded-full ${swatch}`} />
        ))}
      </div>
      <Button size="lg">RSVP opens soon</Button>
    </main>
  );
}
```

- [ ] **Step 9: Verify build, lint, and visuals**

Run: `npm run lint` then `npm run build`
Expected: no lint errors; build succeeds.

Run `npm run dev` and open http://localhost:3000. Expected: cream background, deep-red Fraunces heading, Source Sans body text, seven colored swatches (pink, marigold, cobalt, green, turquoise, yellow, deep red), and a hot-pink button with white text. A dev-console warning from next-themes about a `<script>` tag is known and harmless. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: fiesta theme tokens, fonts, site config, domain types"
```

---

### Task 3: Vitest and redirect helpers

**Files:**
- Create: `vitest.config.mts`, `src/test/server-only-stub.ts`
- Create: `src/lib/routes.ts`
- Test: `src/lib/routes.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces:
  - `isPublicPath(pathname: string): boolean`: true only for `/unlock` and `/unlock/...`
  - `safeNextPath(next: unknown): string`: returns `next` if it is a safe same-origin path that is not public, otherwise `'/'`

- [ ] **Step 1: Configure Vitest**

`vitest.config.mts`:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // The real package throws outside React Server Components; tests run in plain Node.
      'server-only': fileURLToPath(new URL('./src/test/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

`src/test/server-only-stub.ts`:
```ts
export {};
```

In `package.json` `"scripts"`, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 2: Write the failing tests**

`src/lib/routes.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { isPublicPath, safeNextPath } from '@/lib/routes';

describe('isPublicPath', () => {
  it('treats the unlock page as public', () => {
    expect(isPublicPath('/unlock')).toBe(true);
  });

  it('gates every other route', () => {
    for (const path of ['/', '/rsvp', '/venue', '/admin', '/admin/login', '/api/export', '/unlocked']) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe('safeNextPath', () => {
  it('returns internal paths unchanged', () => {
    expect(safeNextPath('/rsvp')).toBe('/rsvp');
    expect(safeNextPath('/venue?section=parking')).toBe('/venue?section=parking');
  });

  it('falls back to / for missing or non-string values', () => {
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath(undefined)).toBe('/');
    expect(safeNextPath('')).toBe('/');
  });

  it('rejects absolute and protocol-relative URLs', () => {
    expect(safeNextPath('https://evil.example')).toBe('/');
    expect(safeNextPath('//evil.example')).toBe('/');
    expect(safeNextPath('/\\evil.example')).toBe('/');
    expect(safeNextPath('/\t/evil.example')).toBe('/');
  });

  it('never sends the guest back to the unlock page', () => {
    expect(safeNextPath('/unlock')).toBe('/');
    expect(safeNextPath('/unlock?next=/rsvp')).toBe('/');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/routes`.

- [ ] **Step 4: Implement**

`src/lib/routes.ts`:
```ts
const PUBLIC_PATHS = ['/unlock'] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Only same-origin paths survive; anything else (or the unlock page itself) goes home. */
export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return '/';
  if (/[ -\\]/.test(next)) return '/';
  const pathname = next.split(/[?#]/, 1)[0];
  return isPublicPath(pathname) ? '/' : next;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (6 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: vitest setup and safe redirect helpers"
```

---

### Task 4: Env, session sealing, and password helpers

**Files:**
- Create: `src/lib/env.ts`, `src/lib/session.ts`, `src/lib/auth.ts`, `.env.example`, `.env.local` (not committed)
- Test: `src/lib/session.test.ts`, `src/lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `getSitePassword(): string`, `getAuthSecret(): string` from `@/lib/env` (throw with the variable name if missing; `getAuthSecret` also throws if under 32 chars)
  - `SITE_SESSION_COOKIE = 'site_session'`, `SITE_SESSION_TTL_SECONDS = 3_888_000` (45 days), `interface SiteSession { unlocked?: boolean }`, `siteSessionOptions(): SessionOptions`, `isSiteSealValid(seal: string | undefined): Promise<boolean>` from `@/lib/session`
  - `passwordsMatch(input: string, expected: string): boolean`, `normalizeSitePassword(value: string): string`, `getSiteSession(): Promise<IronSession<SiteSession>>` from `@/lib/auth`

- [ ] **Step 1: Write the failing session tests**

`src/lib/session.test.ts`:
```ts
import { sealData } from 'iron-session';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isSiteSealValid, SITE_SESSION_TTL_SECONDS } from '@/lib/session';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';
const seal = (data: object, password = SECRET) => sealData(data, { password, ttl: SITE_SESSION_TTL_SECONDS });

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe('isSiteSealValid', () => {
  it('accepts an unlocked seal made with AUTH_SECRET', async () => {
    expect(await isSiteSealValid(await seal({ unlocked: true }))).toBe(true);
  });

  it('rejects a missing cookie', async () => {
    expect(await isSiteSealValid(undefined)).toBe(false);
  });

  it('rejects a forged value', async () => {
    expect(await isSiteSealValid('not-a-real-seal')).toBe(false);
  });

  it('rejects a seal made with a different secret', async () => {
    expect(await isSiteSealValid(await seal({ unlocked: true }, 'a-completely-different-secret-of-32-chars'))).toBe(false);
  });

  it('rejects a seal without the unlocked flag', async () => {
    expect(await isSiteSealValid(await seal({}))).toBe(false);
  });

  it('rejects a seal older than 45 days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const oldSeal = await seal({ unlocked: true });
    vi.setSystemTime(new Date('2026-11-20T00:00:00Z'));
    expect(await isSiteSealValid(oldSeal)).toBe(false);
  });

  it('throws a clear error when AUTH_SECRET is missing or too short', async () => {
    vi.stubEnv('AUTH_SECRET', '');
    await expect(isSiteSealValid('anything')).rejects.toThrow(/AUTH_SECRET/);
    vi.stubEnv('AUTH_SECRET', 'short');
    await expect(isSiteSealValid('anything')).rejects.toThrow(/AUTH_SECRET/);
  });
});
```

- [ ] **Step 2: Write the failing auth tests**

`src/lib/auth.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { normalizeSitePassword, passwordsMatch } from '@/lib/auth';

describe('passwordsMatch', () => {
  it('matches identical strings', () => {
    expect(passwordsMatch('fiesta2026', 'fiesta2026')).toBe(true);
  });

  it('rejects a different string of the same length', () => {
    expect(passwordsMatch('fiesta2027', 'fiesta2026')).toBe(false);
  });

  it('rejects a different length without throwing', () => {
    expect(passwordsMatch('fiesta', 'fiesta2026')).toBe(false);
  });
});

describe('normalizeSitePassword', () => {
  it('ignores surrounding whitespace and letter case', () => {
    expect(normalizeSitePassword('  Fiesta2026 ')).toBe('fiesta2026');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, cannot resolve `@/lib/session` and `@/lib/auth`.

- [ ] **Step 4: Implement env**

`src/lib/env.ts`:
```ts
// Read lazily so `next build` works without secrets present.
// Not marked server-only because src/proxy.ts imports it; none of these are NEXT_PUBLIC_, so they never reach a client bundle.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getSitePassword(): string {
  return required('SITE_PASSWORD');
}

export function getAuthSecret(): string {
  const secret = required('AUTH_SECRET');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return secret;
}
```

- [ ] **Step 5: Implement session**

`src/lib/session.ts`:
```ts
import { unsealData, type SessionOptions } from 'iron-session';
import { getAuthSecret } from '@/lib/env';

export const SITE_SESSION_COOKIE = 'site_session';
export const SITE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 45;

export interface SiteSession {
  unlocked?: boolean;
}

export function siteSessionOptions(): SessionOptions {
  return {
    password: getAuthSecret(),
    cookieName: SITE_SESSION_COOKIE,
    ttl: SITE_SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

export async function isSiteSealValid(seal: string | undefined): Promise<boolean> {
  const password = getAuthSecret(); // outside the try: misconfiguration should fail loudly
  if (!seal) return false;
  try {
    const data = await unsealData<SiteSession>(seal, { password, ttl: SITE_SESSION_TTL_SECONDS });
    return data.unlocked === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 6: Implement auth**

`src/lib/auth.ts`:
```ts
import 'server-only';
import { createHash, timingSafeEqual } from 'node:crypto';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { siteSessionOptions, type SiteSession } from '@/lib/session';

/** Constant-time comparison. Hashing first gives equal-length buffers regardless of input length. */
export function passwordsMatch(input: string, expected: string): boolean {
  const a = createHash('sha256').update(input).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

/** The site password is printed on paper; forgive stray spaces and capitalization. */
export function normalizeSitePassword(value: string): string {
  return value.trim().toLowerCase();
}

export async function getSiteSession() {
  return getIronSession<SiteSession>(await cookies(), siteSessionOptions());
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all tests in `routes`, `session`, `auth`).

- [ ] **Step 8: Document env vars**

`.env.example`:
```bash
# Copy to .env.local for local dev. In Vercel: Project → Settings → Environment Variables.
# All are server-only. Never prefix with NEXT_PUBLIC_.

# Airtable (Phase 2)
AIRTABLE_TOKEN=          # personal access token, scoped to the base (read + write records)
AIRTABLE_BASE_ID=        # starts with "app", from the base URL: airtable.com/appXXXXXXXX/...

# Access control
SITE_PASSWORD=           # shared password printed on the invitation (matched case-insensitively)
ADMIN_PASSWORD=          # host + engineer only (Phase 4)
AUTH_SECRET=             # 32+ random chars: node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Create `.env.local` (gitignored) for development:
```bash
cp .env.example .env.local
```
Then set `SITE_PASSWORD=fiesta-dev` and set `AUTH_SECRET` to the output of:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Confirm `git status` does **not** list `.env.local`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: env getters, sealed site session, constant-time password check"
```

---

### Task 5: Proxy gate and unlock flow

**Files:**
- Create: `src/proxy.ts`, `src/server/actions/unlock-site.ts`, `src/components/auth/unlock-form.tsx`, `src/app/unlock/page.tsx`

**Interfaces:**
- Consumes: `isPublicPath`, `safeNextPath` (`@/lib/routes`); `SITE_SESSION_COOKIE`, `isSiteSealValid` (`@/lib/session`); `getSiteSession`, `passwordsMatch`, `normalizeSitePassword` (`@/lib/auth`); `getSitePassword` (`@/lib/env`); `siteConfig` (`@/config/site`); `Button`, `Input`, `Label`.
- Produces:
  - `unlockSite(prev: UnlockState, formData: FormData): Promise<UnlockState>` with `interface UnlockState { error?: string }`. Form fields: `password`, `next`.
  - Later phases add `/admin` and `/api/export` checks to `src/proxy.ts`.

- [ ] **Step 1: Write the proxy**

`src/proxy.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { isPublicPath } from '@/lib/routes';
import { isSiteSealValid, SITE_SESSION_COOKIE } from '@/lib/session';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  if (await isSiteSealValid(request.cookies.get(SITE_SESSION_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = '/unlock';
  unlockUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Write the unlock action**

`src/server/actions/unlock-site.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { getSiteSession, normalizeSitePassword, passwordsMatch } from '@/lib/auth';
import { getSitePassword } from '@/lib/env';
import { safeNextPath } from '@/lib/routes';

export interface UnlockState {
  error?: string;
}

export async function unlockSite(_prev: UnlockState, formData: FormData): Promise<UnlockState> {
  const input = formData.get('password');
  const valid =
    typeof input === 'string' &&
    passwordsMatch(normalizeSitePassword(input), normalizeSitePassword(getSitePassword()));

  if (!valid) {
    return { error: "That password doesn't match the one on your invitation. Please try again." };
  }

  const session = await getSiteSession();
  session.unlocked = true;
  await session.save();

  redirect(safeNextPath(formData.get('next')));
}
```

- [ ] **Step 3: Write the unlock form**

`src/components/auth/unlock-form.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { unlockSite, type UnlockState } from '@/server/actions/unlock-site';

export function UnlockForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<UnlockState, FormData>(unlockSite, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="password" className="text-base">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="text"
          required
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'password-error' : undefined}
          className="h-12 text-lg"
        />
      </div>
      {state.error && (
        <p id="password-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Checking…' : 'Enter'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Write the unlock page**

`src/app/unlock/page.tsx` (`searchParams` is read inside `<Suspense>` as Cache Components requires):
```tsx
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
```

- [ ] **Step 5: Build and lint**

Run: `npm run lint` then `npm run build`
Expected: no errors; the route table lists `/` and `/unlock`, plus a Proxy entry.

- [ ] **Step 6: Verify gate behavior with curl**

Start the production server in the background: `npm run start` (reads `.env.local`). Then run:
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "http://localhost:3000/venue?x=1"
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -H "Cookie: site_session=forged" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/unlock
```
Expected, in order:
```
307 http://localhost:3000/unlock?next=%2F
307 http://localhost:3000/unlock?next=%2Fvenue%3Fx%3D1
307 http://localhost:3000/unlock?next=%2F
200
```

- [ ] **Step 7: Verify the unlock flow in a browser**

With the server still running, open http://localhost:3000/venue?x=1 in a fresh private window.
1. Expected: redirected to `/unlock?next=%2Fvenue%3Fx%3D1`; page shows "Day of the Deb" and the password field.
2. Enter `wrong`. Expected: red "That password doesn't match…" message, still on `/unlock`.
3. Enter ` FIESTA-DEV ` (caps, spaces). Expected: redirected to `/venue?x=1`, which shows a 404 (that page arrives in Phase 6). This shows the redirect kept the path.
4. Visit http://localhost:3000/. Expected: the home stub loads with no redirect.
5. DevTools → Application → Cookies: `site_session` is HttpOnly, SameSite Lax, expires ~45 days out. (Secure is off locally because the server runs on http.)

Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: site password gate via proxy and unlock page"
```

---

### Task 6: GitHub repo and Vercel deployment

**Files:** none (infrastructure). Requires the user for secrets.

**Interfaces:**
- Produces: private GitHub repo `dayofthedeb`; Vercel project `dayofthedeb` building from `main`; production URL that shows the gate.

- [ ] **Step 1: Create the private GitHub repo**

Load `mcp__plugin_github_github__get_me` and `mcp__plugin_github_github__create_repository` via ToolSearch. Call `get_me` to get the login, then `create_repository` with `name: "dayofthedeb"`, `private: true`, `autoInit: false`, description `"Private RSVP site for Day of the Deb"`.

- [ ] **Step 2: Push**

```bash
git remote add origin https://github.com/<login>/dayofthedeb.git
git push -u origin main
```
Expected: branch `main` pushed. If git can't authenticate non-interactively, stop and ask the user to run `git push -u origin main` once in their own terminal (Git Credential Manager will open a browser sign-in), then continue.

- [ ] **Step 3: Create the Vercel project**

Load `mcp__plugin_vercel_vercel__list_teams` and `mcp__plugin_vercel_vercel__create_git_project` via ToolSearch. Use the user's team, project name `dayofthedeb`, linked to the GitHub repo `<login>/dayofthedeb`, framework Next.js, production branch `main`. If the Vercel GitHub app lacks access to the new repo, give the user the link from the error and wait.

- [ ] **Step 4: User sets production env vars**

Ask the user to add these in Vercel → `dayofthedeb` → Settings → Environment Variables (Production and Preview):
- `SITE_PASSWORD`: the real password to print on the invitation
- `AUTH_SECRET`: a fresh value from `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"` (not the local one)

`ADMIN_PASSWORD`, `AIRTABLE_TOKEN`, and `AIRTABLE_BASE_ID` wait for their phases. Secrets are typed into the Vercel dashboard by the user, never into chat.

- [ ] **Step 5: Deploy and verify**

After the env vars are saved, redeploy `main` (push an empty commit, `git commit --allow-empty -m "chore: trigger deploy" && git push`, or use Redeploy in the dashboard). Use `mcp__plugin_vercel_vercel__list_deployments` and `get_deployment_build_logs` to confirm the build is READY.

Then against the **production** domain (preview URLs sit behind Vercel Authentication):
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" https://<production-domain>/
```
Expected: `307 https://<production-domain>/unlock?next=%2F`. Ask the user to open the site on their phone, enter the real password, and confirm the home stub loads.

- [ ] **Step 6: Record the project**

Save a memory (type `reference`) with the GitHub repo URL and Vercel project/production URL.

---

## Phase 1 Done When

- `npm test`, `npm run lint`, `npm run build` all pass.
- The production URL redirects unauthenticated visitors to `/unlock`, and the real password unlocks the site on a phone.
- DESIGN.md reflects Next 16 conventions (proxy, `updateTag`, OKLCH, rate-limit note, RSVP ownership check).

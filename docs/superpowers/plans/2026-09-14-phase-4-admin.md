# Phase 4: Admin, Stats, and Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A password-protected `/admin` page where the host (or caterer) sees the headcount and response stats, filters the full guest list, downloads CSVs, refreshes from Airtable, and spots duplicate guest names.

**Architecture:** A second iron-session cookie (`admin_session`, 7 days) gates `/admin/*` and `/api/export`. Admin routes bypass the invitation-password gate (host decision: the admin password alone grants access), `/admin/login` is public, and `/api/export` answers 401 instead of redirecting. Every admin read and action re-checks the admin session itself. All numbers come from pure functions over the cached `Invitation[]` (`lib/admin/stats.ts`, `lib/admin/guest-rows.ts`, `lib/admin/export-csv.ts`), unit-tested without I/O. The dashboard is a server component inside `<Suspense>` (Cache Components) that passes plain rows to a client table for instant filtering.

**Tech Stack:** Next.js 16.3 (App Router, Cache Components, route handlers, server actions, `updateTag`), iron-session 8, papaparse 5.7, React 19, Tailwind v4 tokens, Vitest.

**Spec:** `DESIGN.md` §5 Layer 3, §7 (whole section), §11 (manual refresh), §12, §15 (stats test). Covers §14 step 5.

## Host decisions (2026-09-14)

- **Admin access:** admin password only. `/admin/login` does not require the invitation password; `/admin/*` and `/api/export` require only the admin cookie.
- **Caterer CSV:** one row per person coming; plus-ones get their own row. Columns `Name, Household, Type, Guest Of, Responded`. Row count equals the headcount. A second "full guest list" CSV has everyone with their status.
- **Duplicate names:** the admin page lists guest names that appear in more than one household (safety net for the RSVP household picker).

## Global Constraints

- `ADMIN_PASSWORD` is server-only, at least 12 characters, compared exactly (case-sensitive, no trimming) in constant time with `passwordsMatch`.
- Admin cookie: name `admin_session`, sealed with `AUTH_SECRET`, TTL 7 days, httpOnly, `secure` in production, `sameSite=lax`, path `/`. A site (`site_session`) seal must never validate as admin and vice versa.
- Proxy: admin paths (`/admin`, `/admin/...`, `/api/export`, `/api/export/...`) are decided before the site gate. `/admin/login` passes. Without a valid admin cookie, `/api/...` admin paths return 401; page paths redirect to `/admin/login?next=<path+search>`. Non-admin paths keep the Phase 1 site gate unchanged.
- `requireAdminSession()` is the first statement of every admin server action (except `adminLogin`) and runs before any guest data is read on the admin page. The export route validates the admin cookie itself.
- Counting rules come from one place: `countedPlusOne(guest)` in `lib/plus-one.ts` (trimmed plus-one name when the guest has `hasPlusOne`, is attending, and the name is non-empty; otherwise `null`). Headcount = attending guests + counted plus-ones. The headcount CSV row count must equal the headcount.
- Response rate denominator is households; a household has responded when any member's `attending` is non-null. Plus-ones never enter any denominator.
- CSV: papaparse `unparse` with `escapeFormulae: true` (guest-typed names can't become spreadsheet formulas), prefixed with a UTF-8 byte-order mark so Excel shows accents, `Cache-Control: no-store`.
- Pure modules under `src/lib/admin/` have no I/O and no `server-only`. Colors via tokens only. Components ≤ ~150 lines. Don't edit `src/components/ui/*`.
- No backslash escape sequences in regexes or strings (tooling once corrupted them); use `String.fromCharCode` where a control or special character is needed.
- Commit with `git add -A -- . ':!.claude'`. Never open `.env.local`. Don't run `npm run test:airtable`.

## Existing interfaces this phase uses

- `@/lib/session`: `SITE_SESSION_COOKIE`, `SITE_SESSION_TTL_SECONDS`, `SiteSession`, `siteSessionOptions()`, `isSiteSealValid(seal)`.
- `@/lib/auth` (server-only): `passwordsMatch(input, expected)`, `normalizeSitePassword`, `getSiteSession()`, `requireSiteSession()`.
- `@/lib/env`: `readRequiredEnv(name)`, `getSitePassword()`, `getAuthSecret()`.
- `@/lib/routes`: `isPublicPath(pathname)`, `safeNextPath(next)`.
- `@/proxy`: `proxy(request)`, `config.matcher`.
- `@/lib/guest-list`: `getInvitations()`, `GUEST_LIST_TAG`.
- `@/lib/airtable/rsvp`: `respondedOnDate(now?)` (`YYYY-MM-DD` in America/Chicago).
- `@/lib/plus-one`: `storedPlusOneName(hasPlusOne, attending, plusOneName)`, `MAX_PLUS_ONE_NAME_LENGTH`.
- `@/lib/search`: `normalizeName(value)`.
- `@/lib/dates`: `formatEventDate(isoDate)`.
- `@/types/domain`: `Guest`, `Invitation`, `Attendance`.
- UI: `Button`, `buttonVariants`, `Input`, `Label`, `cn`; `src/app/unlock/page.tsx` and `src/components/auth/unlock-form.tsx` are the pattern for the admin login page and form.

## File Map

| File | Responsibility |
|---|---|
| `src/lib/env.ts` | + `MIN_ADMIN_PASSWORD_LENGTH`, `getAdminPassword()` |
| `src/lib/session.ts` | + admin cookie constants, `AdminSession`, `adminSessionOptions()`, `isAdminSealValid()` (shared helpers) |
| `src/lib/routes.ts` | + `ADMIN_HOME_PATH`, `ADMIN_LOGIN_PATH`, `isAdminPath`, `isAdminLoginPath`, `safeAdminNextPath` |
| `src/lib/auth.ts` | + `getAdminSession()`, `requireAdminSession()` |
| `src/proxy.ts` | Admin gate before site gate |
| `src/server/actions/admin-login.ts` | `adminLogin`, `adminLogout` |
| `src/server/actions/refresh-guest-list.ts` | `refreshGuestList` |
| `src/app/admin/login/page.tsx` | Admin sign-in page |
| `src/components/auth/admin-login-form.tsx` | Client admin password form |
| `src/lib/plus-one.ts` | + `countedPlusOne(guest)` |
| `src/lib/admin/stats.ts` | `computeStats` |
| `src/lib/admin/guest-rows.ts` | Rows, labels, filters, duplicate names |
| `src/lib/admin/export-csv.ts` | CSV rows + `toCsv` |
| `src/app/api/export/route.ts` | Admin-guarded CSV download |
| `src/app/admin/page.tsx` | Thin shell with Suspense |
| `src/app/admin/error.tsx` | Friendly error boundary |
| `src/components/admin/admin-dashboard.tsx` | Async server composition |
| `src/components/admin/admin-header.tsx` | Title, refresh, sign out |
| `src/components/admin/refresh-button.tsx` | Client refresh |
| `src/components/admin/stats-summary.tsx` | Headline + stat tiles |
| `src/components/admin/export-buttons.tsx` | Two CSV links |
| `src/components/admin/duplicate-names.tsx` | Duplicate-name notice |
| `src/components/admin/guest-table.tsx` | Client table with filtering |
| `src/components/admin/guest-table-filters.tsx` | Filter controls |
| `src/components/admin/status-badge.tsx` | Status pill |

Shared test helper (define locally where used):
```ts
const id = (label: string) => `rec${label}`.padEnd(17, '0');
```

---

### Task 1: Admin session, routes, and proxy gate

**Files:**
- Modify: `src/lib/env.ts`, `src/lib/session.ts`, `src/lib/routes.ts`, `src/lib/auth.ts`, `src/proxy.ts`, `.env.example`
- Test: `src/lib/env.test.ts` (create), `src/lib/session.test.ts`, `src/lib/routes.test.ts`, `src/lib/auth.test.ts`, `src/proxy.test.ts` (add cases)

**Interfaces:**
- Produces:
  - `MIN_ADMIN_PASSWORD_LENGTH = 12`, `getAdminPassword(): string` (throws `Missing required environment variable: ADMIN_PASSWORD` or `ADMIN_PASSWORD must be at least 12 characters`)
  - `ADMIN_SESSION_COOKIE = 'admin_session'`, `ADMIN_SESSION_TTL_SECONDS = 604800`, `interface AdminSession { admin?: boolean }`, `adminSessionOptions(): SessionOptions`, `isAdminSealValid(seal: string | undefined): Promise<boolean>`
  - `ADMIN_HOME_PATH = '/admin'`, `ADMIN_LOGIN_PATH = '/admin/login'`, `isAdminPath(pathname): boolean`, `isAdminLoginPath(pathname): boolean`, `safeAdminNextPath(next: unknown): string`
  - `getAdminSession(): Promise<IronSession<AdminSession>>`, `requireAdminSession(): Promise<void>` (redirects to `/admin/login`)

- [ ] **Step 1: Write the failing tests**

`src/lib/env.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAdminPassword, MIN_ADMIN_PASSWORD_LENGTH } from '@/lib/env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('getAdminPassword', () => {
  it('returns a long enough admin password unchanged', () => {
    vi.stubEnv('ADMIN_PASSWORD', ' Long-Admin-Pass ');
    expect(getAdminPassword()).toBe(' Long-Admin-Pass ');
  });

  it('throws when missing or too short', () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(() => getAdminPassword()).toThrow(/ADMIN_PASSWORD/);
    vi.stubEnv('ADMIN_PASSWORD', 'x'.repeat(MIN_ADMIN_PASSWORD_LENGTH - 1));
    expect(() => getAdminPassword()).toThrow(/at least 12/);
  });
});
```

Append to `src/lib/session.test.ts` (reuse its existing `SECRET`, `beforeEach`/`afterEach` env stubbing, and imports; add `isAdminSealValid` and `ADMIN_SESSION_TTL_SECONDS` to the import from `@/lib/session`):
```ts
describe('isAdminSealValid', () => {
  const sealAdmin = (data: object, password = SECRET) =>
    sealData(data, { password, ttl: ADMIN_SESSION_TTL_SECONDS });

  it('accepts an admin seal made with AUTH_SECRET', async () => {
    expect(await isAdminSealValid(await sealAdmin({ admin: true }))).toBe(true);
  });

  it('rejects a site seal presented as admin, and an admin seal presented as site', async () => {
    const siteSeal = await sealData({ unlocked: true }, { password: SECRET, ttl: SITE_SESSION_TTL_SECONDS });
    expect(await isAdminSealValid(siteSeal)).toBe(false);
    expect(await isSiteSealValid(await sealAdmin({ admin: true }))).toBe(false);
  });

  it('rejects missing, forged, and expired admin seals', async () => {
    expect(await isAdminSealValid(undefined)).toBe(false);
    expect(await isAdminSealValid('forged')).toBe(false);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const oldSeal = await sealAdmin({ admin: true });
    vi.setSystemTime(new Date('2026-10-09T00:00:00Z'));
    expect(await isAdminSealValid(oldSeal)).toBe(false);
  });
});
```

Append to `src/lib/routes.test.ts` (add the new names to its import):
```ts
describe('admin paths', () => {
  it('recognizes admin pages and the export API', () => {
    for (const path of ['/admin', '/admin/login', '/api/export']) expect(isAdminPath(path)).toBe(true);
    for (const path of ['/', '/rsvp', '/administrator', '/api/exports', '/unlock']) expect(isAdminPath(path)).toBe(false);
  });

  it('recognizes only the login page as the admin login path', () => {
    expect(isAdminLoginPath('/admin/login')).toBe(true);
    expect(isAdminLoginPath('/admin')).toBe(false);
  });
});

describe('safeAdminNextPath', () => {
  it('keeps admin page paths', () => {
    expect(safeAdminNextPath('/admin')).toBe('/admin');
    expect(safeAdminNextPath('/admin?status=awaiting')).toBe('/admin?status=awaiting');
  });

  it('falls back to /admin for anything else', () => {
    for (const next of [null, '', '/admin/login', '/api/export', '/rsvp', '//evil.example', 'https://evil.example', '/administrator']) {
      expect(safeAdminNextPath(next)).toBe('/admin');
    }
  });
});
```

Append to `src/lib/auth.test.ts` (same mocking pattern as the existing `requireSiteSession` block):
```ts
describe('requireAdminSession', () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getIronSessionMock.mockReset();
    vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long');
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('does not redirect when the admin flag is set', async () => {
    getIronSessionMock.mockResolvedValue({ admin: true });
    const { requireAdminSession } = await import('@/lib/auth');
    await requireAdminSession();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('redirects to /admin/login when the admin flag is missing, even with a site session', async () => {
    getIronSessionMock.mockResolvedValue({ unlocked: true });
    const { requireAdminSession } = await import('@/lib/auth');
    await requireAdminSession();
    expect(redirectMock).toHaveBeenCalledWith('/admin/login');
  });
});
```

Append to `src/proxy.test.ts` (add `ADMIN_SESSION_TTL_SECONDS` to the `@/lib/session` import):
```ts
describe('proxy: admin gate', () => {
  const adminCookie = async () =>
    `admin_session=${await sealData({ admin: true }, { password: SECRET, ttl: ADMIN_SESSION_TTL_SECONDS })}`;
  const siteCookie = async () =>
    `site_session=${await sealData({ unlocked: true }, { password: SECRET, ttl: SITE_SESSION_TTL_SECONDS })}`;

  it('redirects admin pages to the admin login with next', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/admin?status=awaiting'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2Fadmin%3Fstatus%3Dawaiting');
  });

  it('does not treat a site session as admin', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/admin', { headers: { cookie: await siteCookie() } }));
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2Fadmin');
  });

  it('lets anyone reach the admin login without the invitation password', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/admin/login'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('answers 401 for the export API without an admin session', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/api/export'));
    expect(response.status).toBe(401);
  });

  it('passes admin pages and the export API with only an admin cookie', async () => {
    const cookie = await adminCookie();
    for (const url of ['http://localhost:3000/admin', 'http://localhost:3000/api/export?scope=all']) {
      const response = await proxy(new NextRequest(url, { headers: { cookie } }));
      expect(response.headers.get('x-middleware-next')).toBe('1');
    }
  });

  it('keeps the site gate for look-alike paths', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/administrator'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/unlock?next=%2Fadministrator');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL on the new tests (missing exports / wrong proxy behavior); existing tests still pass.

- [ ] **Step 3: Implement env**

Append to `src/lib/env.ts`:
```ts
export const MIN_ADMIN_PASSWORD_LENGTH = 12;

export function getAdminPassword(): string {
  const password = readRequiredEnv('ADMIN_PASSWORD');
  if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
    throw new Error(`ADMIN_PASSWORD must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`);
  }
  return password;
}
```

- [ ] **Step 4: Implement sessions**

Replace `src/lib/session.ts` with:
```ts
import { unsealData, type SessionOptions } from 'iron-session';
import { getAuthSecret } from '@/lib/env';

export const SITE_SESSION_COOKIE = 'site_session';
export const SITE_SESSION_TTL_SECONDS = 60 * 60 * 24 * 45;
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SiteSession {
  unlocked?: boolean;
}

export interface AdminSession {
  admin?: boolean;
}

function sessionOptions(cookieName: string, ttl: number): SessionOptions {
  return {
    password: getAuthSecret(),
    cookieName,
    ttl,
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    },
  };
}

export function siteSessionOptions(): SessionOptions {
  return sessionOptions(SITE_SESSION_COOKIE, SITE_SESSION_TTL_SECONDS);
}

export function adminSessionOptions(): SessionOptions {
  return sessionOptions(ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS);
}

async function isSealValid<T>(seal: string | undefined, ttl: number, isGranted: (data: T) => boolean): Promise<boolean> {
  const password = getAuthSecret(); // outside the try: misconfiguration should fail loudly
  if (!seal) return false;
  try {
    return isGranted(await unsealData<T>(seal, { password, ttl }));
  } catch {
    return false;
  }
}

export function isSiteSealValid(seal: string | undefined): Promise<boolean> {
  return isSealValid<SiteSession>(seal, SITE_SESSION_TTL_SECONDS, (data) => data.unlocked === true);
}

export function isAdminSealValid(seal: string | undefined): Promise<boolean> {
  return isSealValid<AdminSession>(seal, ADMIN_SESSION_TTL_SECONDS, (data) => data.admin === true);
}
```

- [ ] **Step 5: Implement routes**

Replace `src/lib/routes.ts` with:
```ts
const PUBLIC_PATHS = ['/unlock'] as const;
const ADMIN_PATHS = ['/admin', '/api/export'] as const;

export const ADMIN_HOME_PATH = '/admin';
export const ADMIN_LOGIN_PATH = '/admin/login';

function matchesAny(pathname: string, paths: readonly string[]): boolean {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function isPublicPath(pathname: string): boolean {
  return matchesAny(pathname, PUBLIC_PATHS);
}

export function isAdminPath(pathname: string): boolean {
  return matchesAny(pathname, ADMIN_PATHS);
}

export function isAdminLoginPath(pathname: string): boolean {
  return pathname === ADMIN_LOGIN_PATH;
}

/** A same-origin path, or null. */
function internalPath(next: unknown): string | null {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//')) return null;
  // Control characters (browsers strip tabs/newlines, turning /<tab>/x into //x) and backslashes (0x5c).
  if ([...next].some((char) => char.charCodeAt(0) < 0x20 || char.charCodeAt(0) === 0x5c)) return null;
  return next;
}

function pathnameOf(path: string): string {
  return path.split(/[?#]/, 1)[0];
}

/** Only same-origin paths survive; anything else (or the unlock page itself) goes home. */
export function safeNextPath(next: unknown): string {
  const path = internalPath(next);
  return path && !isPublicPath(pathnameOf(path)) ? path : '/';
}

/** After admin sign-in: only admin pages (not the login page or the API) survive; anything else goes to /admin. */
export function safeAdminNextPath(next: unknown): string {
  const path = internalPath(next);
  if (!path) return ADMIN_HOME_PATH;
  const pathname = pathnameOf(path);
  const isAdminPage = matchesAny(pathname, [ADMIN_HOME_PATH]) && !isAdminLoginPath(pathname);
  return isAdminPage ? path : ADMIN_HOME_PATH;
}
```

- [ ] **Step 6: Implement admin session helpers**

In `src/lib/auth.ts`: change the session import to
```ts
import { adminSessionOptions, siteSessionOptions, type AdminSession, type SiteSession } from '@/lib/session';
import { ADMIN_LOGIN_PATH } from '@/lib/routes';
```
and append:
```ts
export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), adminSessionOptions());
}

/** First line of every admin server action and before any admin data read. The proxy guards the routes; this guards the data. */
export async function requireAdminSession(): Promise<void> {
  const session = await getAdminSession();
  if (session.admin !== true) redirect(ADMIN_LOGIN_PATH);
}
```

- [ ] **Step 7: Implement the proxy gate**

Replace `src/proxy.ts` with:
```ts
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_LOGIN_PATH, isAdminLoginPath, isAdminPath, isPublicPath } from '@/lib/routes';
import { ADMIN_SESSION_COOKIE, isAdminSealValid, isSiteSealValid, SITE_SESSION_COOKIE } from '@/lib/session';

function redirectWithNext(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)}`;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin area: the admin password alone grants access (no invitation password needed).
  if (isAdminPath(pathname)) {
    if (isAdminLoginPath(pathname)) return NextResponse.next();
    if (await isAdminSealValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return NextResponse.next();
    if (pathname.startsWith('/api/')) return new NextResponse(null, { status: 401 });
    return redirectWithNext(request, ADMIN_LOGIN_PATH);
  }

  if (isPublicPath(pathname)) return NextResponse.next();
  if (await isSiteSealValid(request.cookies.get(SITE_SESSION_COOKIE)?.value)) return NextResponse.next();
  return redirectWithNext(request, '/unlock');
}

export const config = {
  matcher: ['/((?!_next/static/|_next/image|favicon\\.ico$).*)'],
};
```
(The matcher line is unchanged from the current file; keep its existing characters exactly — do not retype it.)

- [ ] **Step 8: Document the env var**

In `.env.example`, replace the comment line above `ADMIN_PASSWORD=` with:
```bash
# admin area (/admin): host, planner, caterer. At least 12 characters, case-sensitive, different from SITE_PASSWORD
```

- [ ] **Step 9: Run tests, lint, type-check, commit**

Run: `npm test` (all pass), `npm run lint`, `npx tsc --noEmit`, then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: admin session cookie and proxy gate for /admin and /api/export"
```

---

### Task 2: Admin sign-in and sign-out

**Files:**
- Create: `src/server/actions/admin-login.ts`, `src/components/auth/admin-login-form.tsx`, `src/app/admin/login/page.tsx`
- Test: `src/server/actions/admin-login.test.ts`

**Interfaces:**
- Consumes: `getAdminSession`, `passwordsMatch` (`@/lib/auth`); `getAdminPassword` (`@/lib/env`); `safeAdminNextPath`, `ADMIN_LOGIN_PATH` (`@/lib/routes`).
- Produces: `interface AdminLoginState { error?: string }`, `adminLogin(prev: AdminLoginState, formData: FormData): Promise<AdminLoginState>`, `adminLogout(): Promise<void>`; route `/admin/login`.

- [ ] **Step 1: Write the failing test**

`src/server/actions/admin-login.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  session: { admin: undefined as boolean | undefined, save: vi.fn(async () => {}), destroy: vi.fn() },
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/auth')>()),
  getAdminSession: async () => mocks.session,
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({})) }));

import { adminLogin, adminLogout } from '@/server/actions/admin-login';

const ADMIN_PASSWORD = 'Correct-Horse-Battery';

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.admin = undefined;
  vi.stubEnv('ADMIN_PASSWORD', ADMIN_PASSWORD);
  vi.stubEnv('AUTH_SECRET', 'test-secret-that-is-at-least-32-characters-long');
});

describe('adminLogin', () => {
  it('rejects a wrong password without creating a session', async () => {
    expect(await adminLogin({}, form({ password: 'wrong-password-here' }))).toEqual({
      error: expect.stringContaining('admin password'),
    });
    expect(mocks.session.save).not.toHaveBeenCalled();
  });

  it('is case-sensitive and does not trim', async () => {
    expect((await adminLogin({}, form({ password: ADMIN_PASSWORD.toLowerCase() }))).error).toBeDefined();
    expect((await adminLogin({}, form({ password: ` ${ADMIN_PASSWORD}` }))).error).toBeDefined();
    expect(mocks.session.save).not.toHaveBeenCalled();
  });

  it('saves the admin session and redirects to a safe admin path', async () => {
    await expect(adminLogin({}, form({ password: ADMIN_PASSWORD, next: '/admin?status=awaiting' }))).rejects.toThrow(
      'NEXT_REDIRECT /admin?status=awaiting',
    );
    expect(mocks.session.admin).toBe(true);
    expect(mocks.session.save).toHaveBeenCalled();
  });

  it('never redirects outside the admin pages', async () => {
    await expect(adminLogin({}, form({ password: ADMIN_PASSWORD, next: 'https://evil.example' }))).rejects.toThrow(
      'NEXT_REDIRECT /admin',
    );
  });
});

describe('adminLogout', () => {
  it('destroys the admin session and returns to the login page', async () => {
    await expect(adminLogout()).rejects.toThrow('NEXT_REDIRECT /admin/login');
    expect(mocks.session.destroy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/actions/admin-login.test.ts`
Expected: FAIL, cannot resolve `@/server/actions/admin-login`.

- [ ] **Step 3: Implement the actions**

`src/server/actions/admin-login.ts`:
```ts
'use server';

import { redirect } from 'next/navigation';
import { getAdminSession, passwordsMatch } from '@/lib/auth';
import { getAdminPassword } from '@/lib/env';
import { ADMIN_LOGIN_PATH, safeAdminNextPath } from '@/lib/routes';

export interface AdminLoginState {
  error?: string;
}

export async function adminLogin(_prev: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const input = formData.get('password');
  if (typeof input !== 'string' || !passwordsMatch(input, getAdminPassword())) {
    return { error: "That admin password isn't right." };
  }

  const session = await getAdminSession();
  session.admin = true;
  await session.save();

  redirect(safeAdminNextPath(formData.get('next')));
}

export async function adminLogout(): Promise<void> {
  const session = await getAdminSession();
  session.destroy();
  redirect(ADMIN_LOGIN_PATH);
}
```

- [ ] **Step 4: Implement the form and page**

`src/components/auth/admin-login-form.tsx`:
```tsx
'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminLogin, type AdminLoginState } from '@/server/actions/admin-login';

export function AdminLoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminLogin, {});

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="admin-password" className="text-base">
          Admin password
        </Label>
        <Input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'admin-password-error' : undefined}
          className="h-12 text-lg"
        />
      </div>
      {state.error && (
        <p id="admin-password-error" role="alert" className="text-base text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? 'Checking…' : 'Sign in'}
      </Button>
    </form>
  );
}
```

`src/app/admin/login/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AdminLoginForm } from '@/components/auth/admin-login-form';
import { siteConfig } from '@/config/site';

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
  const { next } = await searchParams;
  return <AdminLoginForm next={typeof next === 'string' ? next : '/admin'} />;
}
```

- [ ] **Step 5: Verify and commit**

Run: `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build` (the route table lists `/admin/login`).
```bash
git add -A -- . ':!.claude'
git commit -m "feat: admin sign-in and sign-out"
```

---

### Task 3: Stats, guest rows, filters, duplicate names

**Files:**
- Modify: `src/lib/plus-one.ts`, `src/lib/plus-one.test.ts`
- Create: `src/lib/admin/stats.ts`, `src/lib/admin/guest-rows.ts`
- Test: `src/lib/admin/stats.test.ts`, `src/lib/admin/guest-rows.test.ts`, plus shared fixture `src/lib/admin/fixtures.ts`

**Interfaces:**
- Produces:
  - `countedPlusOne(guest: Pick<Guest, 'hasPlusOne' | 'attending' | 'plusOneName'>): string | null` (`@/lib/plus-one`)
  - `interface ResponseStats { headcount; attendingGuests; plusOnesComing; plusOnesOffered; declinedGuests; awaitingGuests; guestsResponded; totalGuests; householdsResponded; totalHouseholds; householdsRespondedLast7Days: number; lastResponseDate: string | null }` and `computeStats(invitations: readonly Invitation[], today: string): ResponseStats` (`@/lib/admin/stats`)
  - From `@/lib/admin/guest-rows`: `type ResponseStatus = 'attending' | 'declined' | 'awaiting'`, `RESPONSE_STATUS_LABELS: Record<ResponseStatus, string>` (`Attending`, `Declined`, `Awaiting`), `interface GuestRow { guestId; invitationId; name; household; status: ResponseStatus; hasPlusOne: boolean; plusOneName?: string; respondedAt?: string }`, `interface HouseholdOption { id: string; household: string }`, `interface GuestFilters { status: ResponseStatus | 'all'; invitationId: string; query: string }` (`invitationId` `''` = all), `NO_FILTERS`, `toStatusFilter(value: string): GuestFilters['status']`, `toGuestRows(invitations)`, `toHouseholdOptions(invitations)`, `filterGuestRows(rows, filters)`, `interface DuplicateName { name: string; households: string[] }`, `findDuplicateNames(invitations)`.

- [ ] **Step 1: Shared fixture**

`src/lib/admin/fixtures.ts` (test data only; imported by admin tests):
```ts
import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');

/** Four households covering every counting case. "Today" for these fixtures is 2026-09-14. */
export const TODAY = '2026-09-14';

export const INVITATIONS: Invitation[] = [
  {
    id: id('Biggs'),
    household: 'The Biggs Family',
    email: 'biggs@example.com',
    guests: [
      { id: id('Grant'), name: 'Grant Biggs', hasPlusOne: true, attending: 'yes', plusOneName: 'Priya Raman', respondedAt: '2026-09-10' },
      { id: id('Truman'), name: 'Truman Biggs', hasPlusOne: true, attending: null },
      { id: id('Mario'), name: 'Mario Biggs', hasPlusOne: false, attending: 'no', respondedAt: '2026-09-12' },
    ],
  },
  {
    id: id('Musgrove'),
    household: 'The Musgroves',
    guests: [
      { id: id('Sue'), name: 'Sue Musgrove', hasPlusOne: false, attending: 'yes', respondedAt: '2026-09-14' },
      { id: id('Emma'), name: 'Emma Musgrove', hasPlusOne: true, attending: 'yes', plusOneName: '   ', respondedAt: '2026-09-14' },
    ],
  },
  {
    id: id('Reyes'),
    household: 'Daniel & Sofía Reyes',
    guests: [
      { id: id('Daniel'), name: 'Daniel Reyes', hasPlusOne: false, attending: null },
      { id: id('Sofia'), name: 'Sofía Reyes', hasPlusOne: false, attending: null },
    ],
  },
  {
    id: id('Hunter'),
    household: 'Bill & Traci Hunter',
    guests: [
      { id: id('Bill'), name: 'Bill Hunter', hasPlusOne: true, attending: 'no', plusOneName: 'Host Prefilled', respondedAt: '2026-09-01' },
    ],
  },
];
```

- [ ] **Step 2: Write the failing tests**

Append to `src/lib/plus-one.test.ts` (add `countedPlusOne` to its import):
```ts
describe('countedPlusOne', () => {
  it('counts a named plus-one only for an eligible attending guest', () => {
    expect(countedPlusOne({ hasPlusOne: true, attending: 'yes', plusOneName: ' Priya ' })).toBe('Priya');
    expect(countedPlusOne({ hasPlusOne: true, attending: 'yes', plusOneName: '  ' })).toBeNull();
    expect(countedPlusOne({ hasPlusOne: true, attending: 'no', plusOneName: 'Priya' })).toBeNull();
    expect(countedPlusOne({ hasPlusOne: true, attending: null, plusOneName: 'Priya' })).toBeNull();
    expect(countedPlusOne({ hasPlusOne: false, attending: 'yes', plusOneName: 'Priya' })).toBeNull();
  });
});
```

`src/lib/admin/stats.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { INVITATIONS, TODAY } from '@/lib/admin/fixtures';
import { computeStats } from '@/lib/admin/stats';

describe('computeStats', () => {
  const stats = computeStats(INVITATIONS, TODAY);

  it('counts people coming as attending guests plus named plus-ones', () => {
    expect(stats.attendingGuests).toBe(3); // Grant, Sue, Emma
    expect(stats.plusOnesComing).toBe(1); // Priya (Emma's blank name and Bill's declined plus-one don't count)
    expect(stats.headcount).toBe(4);
  });

  it('breaks guests down by response', () => {
    expect(stats).toMatchObject({ declinedGuests: 2, awaitingGuests: 3, guestsResponded: 5, totalGuests: 8 });
  });

  it('uses households as the response-rate denominator, never the headcount', () => {
    expect(stats.householdsResponded).toBe(3); // Biggs, Musgroves, Hunter
    expect(stats.totalHouseholds).toBe(4);
  });

  it('reports plus-ones offered versus coming', () => {
    expect(stats.plusOnesOffered).toBe(4); // Grant, Truman, Emma, Bill
  });

  it('counts households whose latest response is within the last 7 days, including today', () => {
    expect(stats.householdsRespondedLast7Days).toBe(2); // Biggs (09-12), Musgroves (09-14); Hunter (09-01) is older
    expect(stats.lastResponseDate).toBe('2026-09-14');
  });

  it('handles an empty list', () => {
    expect(computeStats([], TODAY)).toMatchObject({ headcount: 0, totalHouseholds: 0, lastResponseDate: null });
  });
});
```

`src/lib/admin/guest-rows.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { INVITATIONS } from '@/lib/admin/fixtures';
import {
  filterGuestRows,
  findDuplicateNames,
  NO_FILTERS,
  toGuestRows,
  toHouseholdOptions,
  toStatusFilter,
} from '@/lib/admin/guest-rows';
import type { Invitation } from '@/types/domain';

const id = (label: string) => `rec${label}`.padEnd(17, '0');
const rows = toGuestRows(INVITATIONS);
const names = (list: typeof rows) => list.map((row) => row.name);

describe('toGuestRows', () => {
  it('lists every guest in household order with status and counted plus-one', () => {
    expect(rows).toHaveLength(8);
    expect(rows[0]).toEqual({
      guestId: id('Grant'),
      invitationId: id('Biggs'),
      name: 'Grant Biggs',
      household: 'The Biggs Family',
      status: 'attending',
      hasPlusOne: true,
      plusOneName: 'Priya Raman',
      respondedAt: '2026-09-10',
    });
    expect(rows.map((row) => row.status)).toEqual([
      'attending', 'awaiting', 'declined', 'attending', 'attending', 'awaiting', 'awaiting', 'declined',
    ]);
  });

  it('omits plus-one names that do not count', () => {
    expect(rows.find((row) => row.name === 'Emma Musgrove')?.plusOneName).toBeUndefined();
    expect(rows.find((row) => row.name === 'Bill Hunter')?.plusOneName).toBeUndefined();
  });

  it('never includes contact emails', () => {
    expect(JSON.stringify(rows)).not.toContain('biggs@example.com');
  });
});

describe('toHouseholdOptions', () => {
  it('lists households for the filter', () => {
    expect(toHouseholdOptions(INVITATIONS)[0]).toEqual({ id: id('Biggs'), household: 'The Biggs Family' });
  });
});

describe('filterGuestRows', () => {
  it('returns everything with no filters', () => {
    expect(filterGuestRows(rows, NO_FILTERS)).toHaveLength(8);
  });

  it('filters by response status', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, status: 'awaiting' }))).toEqual([
      'Truman Biggs', 'Daniel Reyes', 'Sofía Reyes',
    ]);
  });

  it('filters by household', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, invitationId: id('Musgrove') }))).toEqual([
      'Sue Musgrove', 'Emma Musgrove',
    ]);
  });

  it('searches names, plus-ones, and households ignoring case and accents', () => {
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'SOFIA' }))).toEqual(['Sofía Reyes']);
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'priya' }))).toEqual(['Grant Biggs']);
    expect(names(filterGuestRows(rows, { ...NO_FILTERS, query: 'hunter' }))).toEqual(['Bill Hunter']);
  });

  it('combines filters', () => {
    expect(names(filterGuestRows(rows, { status: 'attending', invitationId: id('Biggs'), query: '' }))).toEqual(['Grant Biggs']);
  });
});

describe('toStatusFilter', () => {
  it('accepts known statuses and falls back to all', () => {
    expect(toStatusFilter('declined')).toBe('declined');
    expect(toStatusFilter('maybe')).toBe('all');
  });
});

describe('findDuplicateNames', () => {
  it('reports names that appear in more than one household', () => {
    const invitations: Invitation[] = [
      ...INVITATIONS,
      {
        id: id('Biggs2'),
        household: 'The Biggs Household',
        guests: [{ id: id('Grant2'), name: 'grant  BIGGS', hasPlusOne: false, attending: null }],
      },
    ];
    expect(findDuplicateNames(invitations)).toEqual([
      { name: 'Grant Biggs', households: ['The Biggs Family', 'The Biggs Household'] },
    ]);
  });

  it('reports nothing when every name is unique across households', () => {
    expect(findDuplicateNames(INVITATIONS)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, missing `countedPlusOne`, `@/lib/admin/stats`, `@/lib/admin/guest-rows`.

- [ ] **Step 4: Implement**

Append to `src/lib/plus-one.ts`:
```ts
/** The plus-one who counts toward the headcount right now, or null. */
export function countedPlusOne(guest: {
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  plusOneName?: string;
}): string | null {
  return guest.attending === 'yes' ? storedPlusOneName(guest.hasPlusOne, 'yes', guest.plusOneName) : null;
}
```

`src/lib/admin/stats.ts`:
```ts
import { countedPlusOne } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';

export interface ResponseStats {
  headcount: number;
  attendingGuests: number;
  plusOnesComing: number;
  plusOnesOffered: number;
  declinedGuests: number;
  awaitingGuests: number;
  guestsResponded: number;
  totalGuests: number;
  householdsResponded: number;
  totalHouseholds: number;
  householdsRespondedLast7Days: number;
  lastResponseDate: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function daysBefore(today: string, date: string): number {
  return Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / DAY_MS);
}

function latestResponse(invitation: Invitation): string | null {
  const dates = invitation.guests.flatMap((guest) => (guest.respondedAt ? [guest.respondedAt] : []));
  return dates.length > 0 ? dates.sort().at(-1)! : null;
}

/** All numbers for the admin summary (DESIGN §7). `today` is YYYY-MM-DD in the event time zone. */
export function computeStats(invitations: readonly Invitation[], today: string): ResponseStats {
  const guests = invitations.flatMap((invitation) => invitation.guests);
  const attendingGuests = guests.filter((guest) => guest.attending === 'yes').length;
  const plusOnesComing = guests.filter((guest) => countedPlusOne(guest) !== null).length;
  const householdDates = invitations.flatMap((invitation) => {
    const date = latestResponse(invitation);
    return date ? [date] : [];
  });

  return {
    headcount: attendingGuests + plusOnesComing,
    attendingGuests,
    plusOnesComing,
    plusOnesOffered: guests.filter((guest) => guest.hasPlusOne).length,
    declinedGuests: guests.filter((guest) => guest.attending === 'no').length,
    awaitingGuests: guests.filter((guest) => guest.attending === null).length,
    guestsResponded: guests.filter((guest) => guest.attending !== null).length,
    totalGuests: guests.length,
    householdsResponded: invitations.filter((invitation) => invitation.guests.some((guest) => guest.attending !== null)).length,
    totalHouseholds: invitations.length,
    householdsRespondedLast7Days: householdDates.filter((date) => {
      const days = daysBefore(today, date);
      return days >= 0 && days < 7;
    }).length,
    lastResponseDate: householdDates.length > 0 ? [...householdDates].sort().at(-1)! : null,
  };
}
```

`src/lib/admin/guest-rows.ts`:
```ts
import { countedPlusOne } from '@/lib/plus-one';
import { normalizeName } from '@/lib/search';
import type { Invitation } from '@/types/domain';

export type ResponseStatus = 'attending' | 'declined' | 'awaiting';

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  attending: 'Attending',
  declined: 'Declined',
  awaiting: 'Awaiting',
};

export interface GuestRow {
  guestId: string;
  invitationId: string;
  name: string;
  household: string;
  status: ResponseStatus;
  hasPlusOne: boolean;
  plusOneName?: string;
  respondedAt?: string;
}

export interface HouseholdOption {
  id: string;
  household: string;
}

export interface GuestFilters {
  status: ResponseStatus | 'all';
  /** '' means every household. */
  invitationId: string;
  query: string;
}

export const NO_FILTERS: GuestFilters = { status: 'all', invitationId: '', query: '' };

export function toStatusFilter(value: string): GuestFilters['status'] {
  return value === 'attending' || value === 'declined' || value === 'awaiting' ? value : 'all';
}

export function toGuestRows(invitations: readonly Invitation[]): GuestRow[] {
  return invitations.flatMap((invitation) =>
    invitation.guests.map((guest) => ({
      guestId: guest.id,
      invitationId: invitation.id,
      name: guest.name,
      household: invitation.household,
      status: guest.attending === 'yes' ? 'attending' : guest.attending === 'no' ? 'declined' : 'awaiting',
      hasPlusOne: guest.hasPlusOne,
      plusOneName: countedPlusOne(guest) ?? undefined,
      respondedAt: guest.respondedAt,
    })),
  );
}

export function toHouseholdOptions(invitations: readonly Invitation[]): HouseholdOption[] {
  return invitations.map((invitation) => ({ id: invitation.id, household: invitation.household }));
}

export function filterGuestRows(rows: readonly GuestRow[], filters: GuestFilters): GuestRow[] {
  const query = normalizeName(filters.query);
  return rows.filter(
    (row) =>
      (filters.status === 'all' || row.status === filters.status) &&
      (filters.invitationId === '' || row.invitationId === filters.invitationId) &&
      (query === '' || normalizeName(`${row.name} ${row.plusOneName ?? ''} ${row.household}`).includes(query)),
  );
}

export interface DuplicateName {
  name: string;
  households: string[];
}

/** Guest names (compared like search does) that appear in more than one household. */
export function findDuplicateNames(invitations: readonly Invitation[]): DuplicateName[] {
  const byName = new Map<string, { name: string; households: Map<string, string> }>();
  for (const invitation of invitations) {
    for (const guest of invitation.guests) {
      const key = normalizeName(guest.name);
      const entry = byName.get(key) ?? { name: guest.name, households: new Map<string, string>() };
      entry.households.set(invitation.id, invitation.household);
      byName.set(key, entry);
    }
  }
  return [...byName.values()]
    .filter((entry) => entry.households.size > 1)
    .map((entry) => ({ name: entry.name, households: [...entry.households.values()] }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Lint, type-check, commit**

Run: `npm run lint`, `npx tsc --noEmit`, then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: admin stats, guest rows, filters, and duplicate-name detection"
```

---

### Task 4: CSV export

**Files:**
- Modify: `package.json` (dependency)
- Create: `src/lib/admin/export-csv.ts`, `src/app/api/export/route.ts`
- Test: `src/lib/admin/export-csv.test.ts`, `src/app/api/export/route.test.ts`

**Interfaces:**
- Consumes: `countedPlusOne`, `GuestRow`, `RESPONSE_STATUS_LABELS`, `toGuestRows`, `computeStats` (tests), fixtures; `isAdminSealValid`, `ADMIN_SESSION_COOKIE`; `getInvitations`; `respondedOnDate`.
- Produces: `HEADCOUNT_COLUMNS`, `GUEST_LIST_COLUMNS`, `UTF8_BOM`, `toHeadcountRows(invitations): string[][]`, `toGuestListRows(rows): string[][]`, `toCsv(columns, rows): string`; `GET /api/export` (`?scope=all` for the full list).

- [ ] **Step 1: Install papaparse**

```bash
npm install papaparse@^5.7.0
npm install -D @types/papaparse
```

- [ ] **Step 2: Write the failing tests**

`src/lib/admin/export-csv.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  GUEST_LIST_COLUMNS,
  HEADCOUNT_COLUMNS,
  toCsv,
  toGuestListRows,
  toHeadcountRows,
} from '@/lib/admin/export-csv';
import { INVITATIONS, TODAY } from '@/lib/admin/fixtures';
import { toGuestRows } from '@/lib/admin/guest-rows';
import { computeStats } from '@/lib/admin/stats';

const CRLF = String.fromCharCode(13, 10);

describe('toHeadcountRows', () => {
  const rows = toHeadcountRows(INVITATIONS);

  it('has one row per person coming, with plus-ones on their own row', () => {
    expect(rows).toEqual([
      ['Grant Biggs', 'The Biggs Family', 'Guest', '', '2026-09-10'],
      ['Priya Raman', 'The Biggs Family', 'Plus-one', 'Grant Biggs', '2026-09-10'],
      ['Sue Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14'],
      ['Emma Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14'],
    ]);
  });

  it('always matches the headcount in the stats', () => {
    expect(rows).toHaveLength(computeStats(INVITATIONS, TODAY).headcount);
  });
});

describe('toGuestListRows', () => {
  it('lists every guest with a readable status', () => {
    const rows = toGuestListRows(toGuestRows(INVITATIONS));
    expect(rows).toHaveLength(8);
    expect(rows[1]).toEqual(['Truman Biggs', 'The Biggs Family', 'Awaiting', '', '']);
    expect(rows[0]).toEqual(['Grant Biggs', 'The Biggs Family', 'Attending', 'Priya Raman', '2026-09-10']);
  });
});

describe('toCsv', () => {
  it('writes a header row and CRLF line endings', () => {
    const lines = toCsv(HEADCOUNT_COLUMNS, [['Sue Musgrove', 'The Musgroves', 'Guest', '', '2026-09-14']]).split(CRLF);
    expect(lines).toEqual(['Name,Household,Type,Guest Of,Responded', 'Sue Musgrove,The Musgroves,Guest,,2026-09-14']);
  });

  it('quotes commas and keeps accents', () => {
    const csv = toCsv(GUEST_LIST_COLUMNS, [['Sofía Reyes', 'Reyes, Daniel & Sofía', 'Awaiting', '', '']]);
    expect(csv).toContain('Sofía Reyes,"Reyes, Daniel & Sofía",Awaiting,,');
  });

  it('neutralizes guest-typed spreadsheet formulas', () => {
    const csv = toCsv(HEADCOUNT_COLUMNS, [['=HYPERLINK("x")', 'H', 'Plus-one', 'Grant Biggs', '']]);
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`);
    expect(csv).not.toContain(`,=HYPERLINK`);
  });
});
```

`src/app/api/export/route.test.ts`:
```ts
import { sealData } from 'iron-session';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INVITATIONS } from '@/lib/admin/fixtures';
import { ADMIN_SESSION_TTL_SECONDS, SITE_SESSION_TTL_SECONDS } from '@/lib/session';
import type { Invitation } from '@/types/domain';

const mocks = vi.hoisted(() => ({ getInvitations: vi.fn<() => Promise<Invitation[]>>() }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests', getInvitations: mocks.getInvitations }));

import { GET } from '@/app/api/export/route';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

async function request(path: string, cookie?: string) {
  return GET(new NextRequest(`http://localhost:3000${path}`, cookie ? { headers: { cookie } } : undefined));
}

const adminCookie = async () =>
  `admin_session=${await sealData({ admin: true }, { password: SECRET, ttl: ADMIN_SESSION_TTL_SECONDS })}`;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('AUTH_SECRET', SECRET);
  mocks.getInvitations.mockResolvedValue(INVITATIONS);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('GET /api/export', () => {
  it('refuses requests without an admin session, even with a site session', async () => {
    expect((await request('/api/export')).status).toBe(401);
    const siteCookie = `site_session=${await sealData({ unlocked: true }, { password: SECRET, ttl: SITE_SESSION_TTL_SECONDS })}`;
    expect((await request('/api/export', siteCookie)).status).toBe(401);
    expect(mocks.getInvitations).not.toHaveBeenCalled();
  });

  it('downloads the headcount CSV by default', async () => {
    const response = await request('/api/export', await adminCookie());
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/csv; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const disposition = response.headers.get('content-disposition') ?? '';
    expect(disposition.startsWith('attachment; filename="day-of-the-deb-headcount-')).toBe(true);
    expect(disposition.endsWith('.csv"')).toBe(true);
    const body = await response.text();
    expect(body.charCodeAt(0)).toBe(0xfeff);
    expect(body).toContain('Priya Raman,The Biggs Family,Plus-one,Grant Biggs,2026-09-10');
    expect(body).not.toContain('Truman Biggs');
  });

  it('downloads the full guest list with scope=all', async () => {
    const response = await request('/api/export?scope=all', await adminCookie());
    expect(response.headers.get('content-disposition')).toContain('day-of-the-deb-guest-list-');
    const body = await response.text();
    expect(body).toContain('Truman Biggs,The Biggs Family,Awaiting,,');
    expect(body).not.toContain('biggs@example.com');
  });

  it('answers 503 when the guest list cannot be loaded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.getInvitations.mockRejectedValue(new Error('Airtable down'));
    expect((await request('/api/export', await adminCookie())).status).toBe(503);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL, missing `@/lib/admin/export-csv` and `@/app/api/export/route`.

- [ ] **Step 4: Implement**

`src/lib/admin/export-csv.ts`:
```ts
import Papa from 'papaparse';
import { RESPONSE_STATUS_LABELS, type GuestRow } from '@/lib/admin/guest-rows';
import { countedPlusOne } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';

export const HEADCOUNT_COLUMNS = ['Name', 'Household', 'Type', 'Guest Of', 'Responded'] as const;
export const GUEST_LIST_COLUMNS = ['Name', 'Household', 'Status', 'Plus One', 'Responded'] as const;

/** Byte-order mark so Excel opens UTF-8 names (Sofía) correctly. */
export const UTF8_BOM = String.fromCharCode(0xfeff);

/** One row per person coming; each counted plus-one gets its own row right after their guest. */
export function toHeadcountRows(invitations: readonly Invitation[]): string[][] {
  return invitations.flatMap((invitation) =>
    invitation.guests
      .filter((guest) => guest.attending === 'yes')
      .flatMap((guest) => {
        const responded = guest.respondedAt ?? '';
        const plusOne = countedPlusOne(guest);
        const rows = [[guest.name, invitation.household, 'Guest', '', responded]];
        if (plusOne) rows.push([plusOne, invitation.household, 'Plus-one', guest.name, responded]);
        return rows;
      }),
  );
}

export function toGuestListRows(rows: readonly GuestRow[]): string[][] {
  return rows.map((row) => [
    row.name,
    row.household,
    RESPONSE_STATUS_LABELS[row.status],
    row.plusOneName ?? '',
    row.respondedAt ?? '',
  ]);
}

export function toCsv(columns: readonly string[], rows: readonly (readonly string[])[]): string {
  return Papa.unparse({ fields: [...columns], data: rows.map((row) => [...row]) }, { escapeFormulae: true });
}
```

`src/app/api/export/route.ts`:
```ts
import type { NextRequest } from 'next/server';
import {
  GUEST_LIST_COLUMNS,
  HEADCOUNT_COLUMNS,
  toCsv,
  toGuestListRows,
  toHeadcountRows,
  UTF8_BOM,
} from '@/lib/admin/export-csv';
import { toGuestRows } from '@/lib/admin/guest-rows';
import { respondedOnDate } from '@/lib/airtable/rsvp';
import { getInvitations } from '@/lib/guest-list';
import { ADMIN_SESSION_COOKIE, isAdminSealValid } from '@/lib/session';

export async function GET(request: NextRequest): Promise<Response> {
  // The proxy also guards this route; checking here means the API never relies on it.
  if (!(await isAdminSealValid(request.cookies.get(ADMIN_SESSION_COOKIE)?.value))) {
    return new Response('Unauthorized', { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get('scope') === 'all' ? 'guest-list' : 'headcount';

  try {
    const invitations = await getInvitations();
    const csv =
      scope === 'guest-list'
        ? toCsv(GUEST_LIST_COLUMNS, toGuestListRows(toGuestRows(invitations)))
        : toCsv(HEADCOUNT_COLUMNS, toHeadcountRows(invitations));

    return new Response(UTF8_BOM + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="day-of-the-deb-${scope}-${respondedOnDate()}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('export failed', error);
    return new Response('Could not load the guest list. Please try again.', { status: 503 });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS. If `@types/papaparse` lacks `escapeFormulae` in `UnparseConfig`, report it and make the minimal typing fix (no `any`, no eslint-disable).

- [ ] **Step 6: Lint, type-check, build, commit**

Run: `npm run lint`, `npx tsc --noEmit`, `npm run build` (route table lists `/api/export`), then:
```bash
git add -A -- . ':!.claude'
git commit -m "feat: admin CSV export (headcount and full guest list)"
```

---

### Task 5: Admin dashboard UI

**Files:**
- Create: `src/server/actions/refresh-guest-list.ts` (+ `refresh-guest-list.test.ts`), `src/app/admin/page.tsx`, `src/app/admin/error.tsx`, `src/components/admin/admin-dashboard.tsx`, `admin-header.tsx`, `refresh-button.tsx`, `stats-summary.tsx`, `export-buttons.tsx`, `duplicate-names.tsx`, `guest-table.tsx`, `guest-table-filters.tsx`, `status-badge.tsx`
- Modify: `DESIGN.md`

**Interfaces:**
- Consumes: everything from Tasks 1–4; `getInvitations`, `GUEST_LIST_TAG`, `respondedOnDate`, `readRequiredEnv`, `formatEventDate`, `siteConfig`, `adminLogout`.
- Produces: `refreshGuestList(): Promise<void>`; routes `/admin`.

- [ ] **Step 1: Refresh action (TDD)**

`src/server/actions/refresh-guest-list.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn<() => Promise<void>>(),
  updateTag: vi.fn<(tag: string) => void>(),
}));

vi.mock('@/lib/auth', () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock('next/cache', () => ({ updateTag: mocks.updateTag }));
vi.mock('@/lib/guest-list', () => ({ GUEST_LIST_TAG: 'guests' }));

import { refreshGuestList } from '@/server/actions/refresh-guest-list';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdminSession.mockResolvedValue(undefined);
});

describe('refreshGuestList', () => {
  it('expires the cached guest list for an admin', async () => {
    await refreshGuestList();
    expect(mocks.updateTag).toHaveBeenCalledWith('guests');
  });

  it('does nothing without an admin session', async () => {
    mocks.requireAdminSession.mockRejectedValue(new Error('NEXT_REDIRECT'));
    await expect(refreshGuestList()).rejects.toThrow('NEXT_REDIRECT');
    expect(mocks.updateTag).not.toHaveBeenCalled();
  });
});
```

Run `npx vitest run src/server/actions/refresh-guest-list.test.ts` (FAIL), then create `src/server/actions/refresh-guest-list.ts`:
```ts
'use server';

import { updateTag } from 'next/cache';
import { requireAdminSession } from '@/lib/auth';
import { GUEST_LIST_TAG } from '@/lib/guest-list';

/** Pull edits made directly in Airtable into the site now instead of waiting for the cache to refresh. */
export async function refreshGuestList(): Promise<void> {
  await requireAdminSession();
  updateTag(GUEST_LIST_TAG);
}
```
Run the test again (PASS).

- [ ] **Step 2: Small presentational components**

`src/components/admin/status-badge.tsx`:
```tsx
import { RESPONSE_STATUS_LABELS, type ResponseStatus } from '@/lib/admin/guest-rows';
import { cn } from '@/lib/utils';

const STYLES: Record<ResponseStatus, string> = {
  attending: 'bg-success text-success-foreground',
  declined: 'bg-foreground text-background',
  awaiting: 'border border-border text-muted-foreground',
};

export function StatusBadge({ status }: { status: ResponseStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold whitespace-nowrap', STYLES[status])}>
      {RESPONSE_STATUS_LABELS[status]}
    </span>
  );
}
```

`src/components/admin/stats-summary.tsx`:
```tsx
import type { ResponseStats } from '@/lib/admin/stats';
import { formatEventDate } from '@/lib/dates';

function percent(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export function StatsSummary({ stats }: { stats: ResponseStats }) {
  const lastResponse = formatEventDate(stats.lastResponseDate);
  const tiles = [
    {
      label: 'Households responded',
      value: `${stats.householdsResponded} of ${stats.totalHouseholds}`,
      detail: `${percent(stats.householdsResponded, stats.totalHouseholds)}% of invitations`,
    },
    {
      label: 'Guests',
      value: `${stats.attendingGuests} yes · ${stats.declinedGuests} no`,
      detail: `${stats.awaitingGuests} awaiting (${stats.guestsResponded} of ${stats.totalGuests} answered)`,
    },
    {
      label: 'Plus-ones',
      value: `${stats.plusOnesComing} coming`,
      detail: `of ${stats.plusOnesOffered} offered`,
    },
    {
      label: 'Last 7 days',
      value: `${stats.householdsRespondedLast7Days} ${stats.householdsRespondedLast7Days === 1 ? 'household' : 'households'}`,
      detail: lastResponse ? `Latest response ${lastResponse}` : 'No responses yet',
    },
  ];

  return (
    <section aria-labelledby="stats-heading" className="space-y-4">
      <h2 id="stats-heading" className="sr-only">
        Response summary
      </h2>
      <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
        <p className="text-base font-semibold">People coming</p>
        <p className="font-display text-7xl leading-none">{stats.headcount}</p>
        <p className="mt-2 text-base">
          {stats.attendingGuests} {stats.attendingGuests === 1 ? 'guest' : 'guests'} + {stats.plusOnesComing}{' '}
          {stats.plusOnesComing === 1 ? 'plus-one' : 'plus-ones'}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-border bg-card p-4">
            <dt className="text-sm text-muted-foreground">{tile.label}</dt>
            <dd className="mt-1 text-2xl font-semibold">{tile.value}</dd>
            <dd className="text-sm text-muted-foreground">{tile.detail}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
```

`src/components/admin/export-buttons.tsx`:
```tsx
import { buttonVariants } from '@/components/ui/button';

export function ExportButtons() {
  return (
    <section aria-labelledby="export-heading" className="space-y-3">
      <h2 id="export-heading" className="font-display text-2xl">
        Downloads
      </h2>
      <div className="flex flex-wrap gap-3">
        <a href="/api/export" download className={buttonVariants({ className: 'h-11 px-4 text-base' })}>
          Download headcount CSV
        </a>
        <a href="/api/export?scope=all" download className={buttonVariants({ variant: 'outline', className: 'h-11 px-4 text-base' })}>
          Download full guest list CSV
        </a>
      </div>
      <p className="text-sm text-muted-foreground">
        The headcount file has one row per person coming, plus-ones included, for the caterer and venue. The full list has
        every guest and their response.
      </p>
    </section>
  );
}
```

`src/components/admin/duplicate-names.tsx`:
```tsx
import type { DuplicateName } from '@/lib/admin/guest-rows';

export function DuplicateNames({ duplicates }: { duplicates: DuplicateName[] }) {
  return (
    <section aria-labelledby="duplicates-heading" className="rounded-xl border-2 border-secondary bg-card p-4">
      <h2 id="duplicates-heading" className="text-lg font-semibold">
        Same name in more than one household
      </h2>
      <p className="text-sm text-muted-foreground">
        Guests choose their household by its name and members, so make sure these household names are easy to tell apart.
      </p>
      <ul className="mt-3 space-y-1">
        {duplicates.map((duplicate) => (
          <li key={duplicate.name}>
            <span className="font-medium">{duplicate.name}</span>: {duplicate.households.join(', ')}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Header and refresh**

`src/components/admin/refresh-button.tsx`:
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { refreshGuestList } from '@/server/actions/refresh-guest-list';

export function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);

  function handleClick() {
    setFailed(false);
    startTransition(async () => {
      try {
        await refreshGuestList();
        router.refresh();
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" variant="outline" disabled={pending} onClick={handleClick} className="h-10 text-base">
        {pending ? 'Refreshing…' : 'Refresh from Airtable'}
      </Button>
      {failed && (
        <span role="alert" className="text-sm text-destructive">
          Refresh failed. Try again.
        </span>
      )}
    </div>
  );
}
```

`src/components/admin/admin-header.tsx`:
```tsx
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
```

- [ ] **Step 4: Guest table**

`src/components/admin/guest-table-filters.tsx`:
```tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toStatusFilter, type GuestFilters, type HouseholdOption } from '@/lib/admin/guest-rows';

const SELECT_CLASS =
  'h-10 w-full rounded-lg border border-input bg-card px-3 text-base focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none';

const STATUS_OPTIONS: { value: GuestFilters['status']; label: string }[] = [
  { value: 'all', label: 'All responses' },
  { value: 'attending', label: 'Attending' },
  { value: 'declined', label: 'Declined' },
  { value: 'awaiting', label: 'Awaiting response' },
];

interface GuestTableFiltersProps {
  filters: GuestFilters;
  households: HouseholdOption[];
  onChange: (filters: GuestFilters) => void;
}

export function GuestTableFilters({ filters, households, onChange }: GuestTableFiltersProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-1">
        <Label htmlFor="guest-filter-query">Search</Label>
        <Input
          id="guest-filter-query"
          type="search"
          value={filters.query}
          placeholder="Name, plus-one, or household"
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          className="h-10 bg-card"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-filter-status">Response</Label>
        <select
          id="guest-filter-status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: toStatusFilter(event.target.value) })}
          className={SELECT_CLASS}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="guest-filter-household">Household</Label>
        <select
          id="guest-filter-household"
          value={filters.invitationId}
          onChange={(event) => onChange({ ...filters, invitationId: event.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All households</option>
          {households.map((household) => (
            <option key={household.id} value={household.id}>
              {household.household}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

`src/components/admin/guest-table.tsx`:
```tsx
'use client';

import { useMemo, useState } from 'react';
import { GuestTableFilters } from '@/components/admin/guest-table-filters';
import { StatusBadge } from '@/components/admin/status-badge';
import { filterGuestRows, NO_FILTERS, type GuestFilters, type GuestRow, type HouseholdOption } from '@/lib/admin/guest-rows';
import { formatEventDate } from '@/lib/dates';

const COLUMNS = ['Name', 'Household', 'Status', 'Plus-one', 'Responded'] as const;

export function GuestTable({ rows, households }: { rows: GuestRow[]; households: HouseholdOption[] }) {
  const [filters, setFilters] = useState<GuestFilters>(NO_FILTERS);
  const visible = useMemo(() => filterGuestRows(rows, filters), [rows, filters]);

  return (
    <section aria-labelledby="guests-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="guests-heading" className="font-display text-3xl">
          Guest list
        </h2>
        <p aria-live="polite" className="text-muted-foreground">
          Showing {visible.length} of {rows.length} guests
        </p>
      </div>
      <GuestTableFilters filters={filters} households={households} onChange={setFilters} />
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[40rem] text-left">
          <thead className="border-b border-border bg-muted text-sm">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-semibold">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.guestId} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3">{row.household}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3">
                  {row.plusOneName ?? (row.hasPlusOne ? <span className="text-muted-foreground">Offered</span> : null)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">{formatEventDate(row.respondedAt ?? null)}</td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-muted-foreground">
                  No guests match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Dashboard, page, error boundary**

`src/components/admin/admin-dashboard.tsx`:
```tsx
import { AdminHeader } from '@/components/admin/admin-header';
import { DuplicateNames } from '@/components/admin/duplicate-names';
import { ExportButtons } from '@/components/admin/export-buttons';
import { GuestTable } from '@/components/admin/guest-table';
import { StatsSummary } from '@/components/admin/stats-summary';
import { findDuplicateNames, toGuestRows, toHouseholdOptions } from '@/lib/admin/guest-rows';
import { computeStats } from '@/lib/admin/stats';
import { respondedOnDate } from '@/lib/airtable/rsvp';
import { requireAdminSession } from '@/lib/auth';
import { readRequiredEnv } from '@/lib/env';
import { getInvitations } from '@/lib/guest-list';

export async function AdminDashboard() {
  await requireAdminSession();
  const invitations = await getInvitations();
  const duplicates = findDuplicateNames(invitations);
  const airtableUrl = `https://airtable.com/${readRequiredEnv('AIRTABLE_BASE_ID')}`;

  return (
    <div className="space-y-10">
      <AdminHeader />
      <StatsSummary stats={computeStats(invitations, respondedOnDate())} />
      <ExportButtons />
      {duplicates.length > 0 && <DuplicateNames duplicates={duplicates} />}
      <GuestTable rows={toGuestRows(invitations)} households={toHouseholdOptions(invitations)} />
      <p>
        <a href={airtableUrl} target="_blank" rel="noopener noreferrer" className="text-link underline-offset-4 hover:underline">
          Edit guests in Airtable
        </a>{' '}
        <span className="text-muted-foreground">(changes show here after “Refresh from Airtable” or within about 5 minutes)</span>
      </p>
    </div>
  );
}
```

`src/app/admin/page.tsx`:
```tsx
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
```

`src/app/admin/error.tsx`:
```tsx
'use client';

import { Button } from '@/components/ui/button';

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
      <h1 className="font-display text-3xl">Couldn&apos;t load the guest list</h1>
      <p className="text-muted-foreground">Airtable may be busy. Wait a moment and try again.</p>
      <Button type="button" onClick={reset} className="h-11 text-base">
        Try again
      </Button>
    </main>
  );
}
```
(If Next 16.3's error-boundary props differ, check `node_modules/next/dist/docs` or the generated types and adapt minimally; report it.)

- [ ] **Step 6: Update DESIGN.md**

1. §5 Layer 3: replace the bullets with:
   - `The proxy decides admin paths (/admin, /admin/*, /api/export) before the site gate. The admin password alone grants access (host decision): /admin/login is public, other admin pages redirect to /admin/login?next=…, and /api/export answers 401 without a valid admin_session cookie.`
   - `/admin/login posts to an adminLogin server action validating ADMIN_PASSWORD (exact, constant-time, at least 12 characters) and sets a sealed admin_session cookie (7 days). A site session never grants admin and vice versa.`
   - `requireAdminSession() runs before any admin data read and at the start of every admin server action; the export route validates the admin cookie itself.`
2. §7 Download CSV: replace the paragraph with: `Two downloads from /api/export. The headcount CSV (default) has one row per person coming: Name, Household, Type (Guest or Plus-one), Guest Of, Responded; its row count equals the headcount. The full guest list CSV (?scope=all) has every guest with Status and counted Plus One. Both neutralize spreadsheet formulas and include a UTF-8 byte-order mark for Excel.`
3. §7 Response stats: after the "Response rate, by household" bullet, add: `A household counts as responded once any member's attending is non-null.` Add a bullet: `**Duplicate names.** The admin page lists guest names that appear in more than one household so the host can make those household names easy to tell apart.`
4. §10 tree: under `components/admin/`, list the new components; under `lib/`, add `admin/stats.ts`, `admin/guest-rows.ts`, `admin/export-csv.ts`; under `server/actions/`, add `refresh-guest-list.ts`.
5. §12: change the `ADMIN_PASSWORD=` comment to `# admin area: host, planner, caterer (at least 12 characters)`.

- [ ] **Step 7: Verify**

Run: `npm test`, `npm run lint` (0 warnings), `npx tsc --noEmit`, `npm run build` (route table lists `/admin`, `/admin/login`, `/api/export`).

Start `npm run start` in the background and check the unauthenticated behavior (no passwords needed):
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/admin
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/admin/login
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/export
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/rsvp
```
Expected:
```
307 http://localhost:3000/admin/login?next=%2Fadmin
200
401
307 http://localhost:3000/unlock?next=%2Frsvp
```
Stop the server.

- [ ] **Step 8: Commit**

```bash
git add -A -- . ':!.claude'
git commit -m "feat: admin dashboard with stats, filterable guest table, downloads, and refresh"
```

- [ ] **Step 9: Human check (controller asks the user)**

With `ADMIN_PASSWORD` set in `.env.local` (local) or Vercel (preview/production):
1. Visit `/admin` in a private window → admin sign-in (no invitation password asked). Wrong password → error; right password → dashboard.
2. Headline "People coming" equals the number of rows in the downloaded headcount CSV; open the CSV in Excel/Numbers/Sheets and check accents (Sofía) look right.
3. Filters: Response = Awaiting, Household = The Biggs Family, Search "priya" each narrow the table.
4. "Same name in more than one household" lists Grant Biggs with both Biggs households.
5. Edit a guest in Airtable → "Refresh from Airtable" → the change appears.
6. Sign out → `/admin` asks for the password again; `/api/export` in a new tab answers 401.

---

## Phase 4 Done When

- All unit tests, lint, tsc, and build pass; the unauthenticated curl checks match.
- The human check passes.
- DESIGN.md reflects the admin access decision, CSV formats, stats rules, and duplicate-name notice.

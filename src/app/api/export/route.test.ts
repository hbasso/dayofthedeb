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

  // The proxy answers every unauthenticated /api/ admin request with a 401 before this handler
  // runs, navigations included, so the route never needs to distinguish them.
  it.each([['navigate'], ['cors']])('answers 401 for a %s request with no admin session', async (mode) => {
    const response = await GET(
      new NextRequest('http://localhost:3000/api/export', { headers: { 'sec-fetch-mode': mode } }),
    );
    expect(response.status).toBe(401);
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
    // Response.text() is spec-required to strip a leading UTF-8 BOM (WHATWG Encoding
    // Standard's "UTF-8 decode"), so it can never observe it. Read the raw bytes instead:
    // that's what a browser download actually receives, and what Excel sniffs.
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1], bytes[2]]).toEqual([0xef, 0xbb, 0xbf]);
    const body = new TextDecoder('utf-8', { ignoreBOM: true }).decode(bytes);
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

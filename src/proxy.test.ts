import { sealData } from 'iron-session';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_SESSION_TTL_SECONDS, SITE_SESSION_TTL_SECONDS } from '@/lib/session';
import { proxy } from '@/proxy';

const SECRET = 'test-secret-that-is-at-least-32-characters-long';

beforeEach(() => {
  vi.stubEnv('AUTH_SECRET', SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('proxy', () => {
  it('redirects to /unlock with next when there is no cookie', async () => {
    const request = new NextRequest('http://localhost:3000/venue?x=1');
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/unlock?next=%2Fvenue%3Fx%3D1');
  });

  it('passes through /unlock with no cookie', async () => {
    const request = new NextRequest('http://localhost:3000/unlock');
    const response = await proxy(request);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('passes through with a valid sealed site_session cookie', async () => {
    const seal = await sealData({ unlocked: true }, { password: SECRET, ttl: SITE_SESSION_TTL_SECONDS });
    const request = new NextRequest('http://localhost:3000/rsvp', {
      headers: { cookie: `site_session=${seal}` },
    });
    const response = await proxy(request);
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('redirects to /unlock for a forged cookie', async () => {
    const request = new NextRequest('http://localhost:3000/', {
      headers: { cookie: 'site_session=forged' },
    });
    const response = await proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/unlock?next=%2F');
  });
});

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

  it('recognizes percent-encoded admin paths without a cookie', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/%61dmin'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2F%2561dmin');
  });

  it('recognizes case-variant admin paths without a cookie', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/Admin'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2FAdmin');
  });

  it('answers 401 for a percent-encoded export API path', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/api/%65xport'));
    expect(response.status).toBe(401);
  });

  it('does not let a site-only cookie through a percent-encoded admin path', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/%61dmin', { headers: { cookie: await siteCookie() } }));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2F%2561dmin');
  });

  it('still passes through the public unlock page in a different case', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/UNLOCK'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('passes through /unlock with no cookie', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/unlock'));
    expect(response.headers.get('x-middleware-next')).toBe('1');
  });

  it('rejects a dot-segment path disguised as /unlock even with a valid site cookie', async () => {
    const response = await proxy(
      new NextRequest('http://localhost:3000/unlock%2F..%2Frsvp', { headers: { cookie: await siteCookie() } }),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/admin/login?next=%2Funlock%252F..%252Frsvp');
  });

  it('rejects a dot-segment path targeting the export API with no cookies', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/unlock%2f..%2f..%2fapi%2fexport'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/admin/login?next=%2Funlock%252f..%252f..%252fapi%252fexport',
    );
  });
});

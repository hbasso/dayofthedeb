import { sealData } from 'iron-session';
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_SESSION_TTL_SECONDS } from '@/lib/session';
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

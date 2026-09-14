import { describe, expect, it } from 'vitest';
import { isAdminLoginPath, isAdminPath, isPublicPath, safeAdminNextPath, safeNextPath } from '@/lib/routes';

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
    expect(safeNextPath(`/${String.fromCharCode(10)}/evil.example`)).toBe('/');
    expect(safeNextPath(`/${String.fromCharCode(13)}/evil.example`)).toBe('/');
    expect(safeNextPath(`/rsvp${String.fromCharCode(0)}`)).toBe('/');
  });

  it('never sends the guest back to the unlock page', () => {
    expect(safeNextPath('/unlock')).toBe('/');
    expect(safeNextPath('/unlock?next=/rsvp')).toBe('/');
  });
});

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

import { describe, expect, it } from 'vitest';
import { isLikelyEmail, MAX_EMAIL_LENGTH, normalizeEmail } from '@/lib/email';

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail(' Hudson.Basso+deb@Example.COM ')).toBe('hudson.basso+deb@example.com');
  });

  it('leaves an already-normalized address unchanged', () => {
    expect(normalizeEmail('a@b.co')).toBe('a@b.co');
  });
});

describe('isLikelyEmail', () => {
  it.each(['a@b.co', ' Hudson.Basso+deb@Example.COM '])('accepts %s', (value) => {
    expect(isLikelyEmail(value)).toBe(true);
  });

  it.each([
    ['empty', ''],
    ['no @', 'no-at.example.com'],
    ['two @', 'two@@at.com'],
    ['spaces', 'spaces in@example.com'],
    ['trailing dot domain', 'trailing.dot@example.'],
    ['empty local part', '@example.com'],
    ['domain without dot', 'user@example'],
    ['too long', `${'a'.repeat(300)}@example.com`],
    ['contains a newline', `a${String.fromCharCode(10)}b@example.com`],
  ])('rejects %s', (_label, value) => {
    expect(isLikelyEmail(value)).toBe(false);
  });

  it('exposes the max length constant', () => {
    expect(MAX_EMAIL_LENGTH).toBe(254);
  });
});

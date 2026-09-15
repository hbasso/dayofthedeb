import { describe, expect, it } from 'vitest';
import { isApplePlatform } from '@/lib/platform';

describe('isApplePlatform', () => {
  it('detects iPhone, iPad, and Mac', () => {
    expect(isApplePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(true);
    expect(isApplePlatform('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)')).toBe(true);
    expect(isApplePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15')).toBe(true);
  });

  it('treats Android and Windows as non-Apple', () => {
    expect(isApplePlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/128.0')).toBe(false);
    expect(isApplePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0')).toBe(false);
  });
});

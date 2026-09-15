import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, isHexColor, readableInk, relativeLuminance } from './loteria-colors';

describe('isHexColor', () => {
  it('accepts 3- and 6-digit hex colors, case-insensitively', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#AABBCC')).toBe(true);
  });

  it('rejects non-hex strings', () => {
    expect(isHexColor('abc')).toBe(false);
    expect(isHexColor('#ab')).toBe(false);
    expect(isHexColor('#gggggg')).toBe(false);
    expect(isHexColor('')).toBe(false);
  });
});

describe('hexToRgb', () => {
  it('expands the 3-digit form', () => {
    expect(hexToRgb('#abc')).toEqual({ r: 170, g: 187, b: 204 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
  });
});

describe('relativeLuminance', () => {
  it('returns null for invalid input', () => {
    expect(relativeLuminance('nope')).toBeNull();
  });

  it('is 1 for white and 0 for black', () => {
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 3);
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 3);
  });
});

describe('contrastRatio', () => {
  it('is about 21 for black on white', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
  });

  it('returns null for invalid input', () => {
    expect(contrastRatio('#FFFFFF', 'nope')).toBeNull();
  });
});

describe('readableInk', () => {
  it('picks the dark ink for a light background', () => {
    expect(readableInk('#9FD6F2')).toBe('#17110F');
  });

  it('picks the light ink for a dark background', () => {
    expect(readableInk('#1B4332')).toBe('#FFFCF6');
  });

  it('falls back to the dark ink for invalid backgrounds', () => {
    expect(readableInk('nope')).toBe('#17110F');
  });

  it('honors custom light/dark options', () => {
    expect(readableInk('#9FD6F2', { light: '#FFFFFF', dark: '#010203' })).toBe('#010203');
  });
});

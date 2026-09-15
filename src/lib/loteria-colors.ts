/**
 * Pure color helpers for the Lotería card component. No I/O, no React —
 * safe to unit test in isolation and to call from a server component.
 */

const HEX_DIGITS = '0123456789abcdefABCDEF';

export function isHexColor(value: string): boolean {
  if (typeof value !== 'string') return false;
  if (value.length !== 4 && value.length !== 7) return false;
  if (value[0] !== '#') return false;
  for (let i = 1; i < value.length; i += 1) {
    if (!HEX_DIGITS.includes(value[i])) return false;
  }
  return true;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isHexColor(hex)) return null;
  const body = hex.slice(1);
  const full = body.length === 3 ? body.split('').map((c) => c + c).join('') : body;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function channelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number | null {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  if (la === null || lb === null) return null;
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA for normal-size text. */
export const MIN_TEXT_CONTRAST = 4.5;

/**
 * Keeps a decorative color only where it stays legible as text; otherwise falls back.
 * The card's accent can be any hue the art calls for, so the subtitle checks it first.
 */
export function readableAccent(accent: string, background: string, fallback: string): string {
  const ratio = contrastRatio(accent, background);
  return ratio !== null && ratio >= MIN_TEXT_CONTRAST ? accent : fallback;
}

export function readableInk(background: string, options?: { light?: string; dark?: string }): string {
  const dark = options?.dark ?? '#17110F';
  const light = options?.light ?? '#FFFCF6';
  const darkContrast = contrastRatio(background, dark);
  const lightContrast = contrastRatio(background, light);
  if (darkContrast === null || lightContrast === null) return dark;
  return lightContrast > darkContrast ? light : dark;
}

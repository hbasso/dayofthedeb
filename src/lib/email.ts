export const MAX_EMAIL_LENGTH = 254;

const MIN_EMAIL_LENGTH = 3;
const SPACE_CODE = 32;

function hasControlOrSpace(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    if (value.charCodeAt(index) <= SPACE_CODE) return true;
  }
  return false;
}

/** Trims and lowercases; does not otherwise touch the address. */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * A pragmatic, non-regex sanity check: catches typos, not deliverability. After normalizing,
 * requires a plausible length, exactly one '@', a non-empty local part, and a domain containing
 * an interior '.' with no consecutive dots and no whitespace or control characters.
 */
export function isLikelyEmail(value: string): boolean {
  const normalized = normalizeEmail(value);
  if (normalized.length < MIN_EMAIL_LENGTH || normalized.length > MAX_EMAIL_LENGTH) return false;
  if (hasControlOrSpace(normalized)) return false;
  if (normalized.includes('..')) return false;

  const atIndex = normalized.indexOf('@');
  if (atIndex === -1 || atIndex !== normalized.lastIndexOf('@')) return false;

  const localPart = normalized.slice(0, atIndex);
  const domainPart = normalized.slice(atIndex + 1);
  if (localPart.length === 0 || domainPart.length === 0) return false;

  const dotIndex = domainPart.indexOf('.');
  if (dotIndex <= 0 || dotIndex === domainPart.length - 1) return false;

  return true;
}

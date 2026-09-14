import type { Guest, Invitation } from '@/types/domain';

export const MIN_QUERY_TOKENS = 2;
export const MAX_SEARCH_RESULTS = 10;

// Unicode combining diacritical marks block. NFD splits "í" into "i" plus a mark in this range.
const COMBINING_MARKS_START = 0x300;
const COMBINING_MARKS_END = 0x36f;

function stripAccents(value: string): string {
  return [...value.normalize('NFD')]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARKS_START || code > COMBINING_MARKS_END;
    })
    .join('');
}

export function normalizeName(value: string): string {
  return stripAccents(value.toLowerCase())
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function nameTokens(value: string): string[] {
  const normalized = normalizeName(value);
  return normalized ? normalized.split(' ') : [];
}

export function isSearchableQuery(query: string): boolean {
  return nameTokens(query).length >= MIN_QUERY_TOKENS;
}

function guestMatches(queryTokens: readonly string[], guest: Guest): boolean {
  const candidateTokens = [guest.name, ...(guest.altNames ?? [])].flatMap(nameTokens);
  return queryTokens.every((queryToken) => candidateTokens.some((token) => token.startsWith(queryToken)));
}

export function searchInvitations(invitations: readonly Invitation[], query: string): Invitation[] {
  const queryTokens = nameTokens(query);
  if (queryTokens.length < MIN_QUERY_TOKENS) return [];
  return invitations
    .filter((invitation) => invitation.guests.some((guest) => guestMatches(queryTokens, guest)))
    .slice(0, MAX_SEARCH_RESULTS);
}

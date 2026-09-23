import type { Guest, Invitation } from '@/types/domain';

// One word is enough, so a guest can search by last name alone. Several households will often
// share a surname; the results list shows each household's members so they can tell them apart.
export const MIN_QUERY_TOKENS = 1;
export const MIN_TOKEN_LENGTH = 2;
// Long Spanish names run past six words ("Maria de los Angeles Garcia Hernandez Lopez"). The cost
// of matching is bounded by the guest's own word count, not the query's, so this is only a guard
// against absurd input.
export const MAX_QUERY_TOKENS = 8;
export const MAX_SEARCH_RESULTS = 10;

// Unicode combining diacritical marks block. NFD splits "í" into "i" plus a mark in this range.
const COMBINING_MARKS_START = 0x300;
const COMBINING_MARKS_END = 0x36f;

/**
 * Latin letters that NFD does not decompose, so the combining-mark filter can't reach them and
 * the a-z0-9 pass would blank them out: "Bjorn" would never find "Bjorn" spelled with a slashed
 * o, and a leading one silently vanishes ("AEdan" -> "dan").
 */
const LATIN_FOLDING: Record<string, string> = {
  'ø': 'o',
  'œ': 'oe',
  'æ': 'ae',
  'ß': 'ss',
  'ł': 'l',
  'đ': 'd',
  'ð': 'd',
  'þ': 'th',
  'ħ': 'h',
  'ı': 'i',
};

function foldLatin(value: string): string {
  return [...value].map((char) => LATIN_FOLDING[char] ?? char).join('');
}

function stripAccents(value: string): string {
  return [...value.normalize('NFD')]
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code < COMBINING_MARKS_START || code > COMBINING_MARKS_END;
    })
    .join('');
}

export function normalizeName(value: string): string {
  return stripAccents(foldLatin(value.toLowerCase()))
    .replace(/['’.]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function nameTokens(value: string): string[] {
  const normalized = normalizeName(value);
  return normalized ? normalized.split(' ') : [];
}

/**
 * The words of a query worth matching on. Middle initials are dropped rather than rejected:
 * people type "Grant E Biggs", and refusing the whole query over the "E" left them stuck on the
 * search screen with no idea which part was wrong. Stored names keep their initials as candidate
 * words, so dropping one from the query never costs a match.
 */
export function queryTokens(query: string): string[] {
  return nameTokens(query).filter((token) => token.length >= MIN_TOKEN_LENGTH);
}

export function isSearchableQuery(query: string): boolean {
  const tokens = queryTokens(query);
  return tokens.length >= MIN_QUERY_TOKENS && tokens.length <= MAX_QUERY_TOKENS;
}

export interface SearchResult {
  matches: Invitation[];
  /** More households matched than MAX_SEARCH_RESULTS; the UI asks the guest to type more of their name. */
  truncated: boolean;
}

/**
 * Finds the best score for assigning every query token to a distinct candidate token
 * (each candidate token used at most once), where a query token may bind to a candidate
 * token that equals it (an exact match, worth one point) or that it is a prefix of (worth
 * zero points). Returns null when no such full assignment exists, otherwise the highest
 * achievable score (the count of exact matches in the best assignment).
 */
function bestGuestScore(queryTokens: readonly string[], candidateTokens: readonly string[]): number | null {
  const used = new Array<boolean>(candidateTokens.length).fill(false);
  let best: number | null = null;

  function backtrack(index: number, score: number): void {
    if (index === queryTokens.length) {
      if (best === null || score > best) best = score;
      return;
    }
    const queryToken = queryTokens[index];
    for (let candidateIndex = 0; candidateIndex < candidateTokens.length; candidateIndex += 1) {
      if (used[candidateIndex]) continue;
      const candidateToken = candidateTokens[candidateIndex];
      if (candidateToken === queryToken) {
        used[candidateIndex] = true;
        backtrack(index + 1, score + 1);
        used[candidateIndex] = false;
      } else if (candidateToken.startsWith(queryToken)) {
        used[candidateIndex] = true;
        backtrack(index + 1, score);
        used[candidateIndex] = false;
      }
    }
  }

  backtrack(0, 0);
  return best;
}

function guestScore(queryTokens: readonly string[], guest: Guest): number | null {
  const candidateTokens = [guest.name, ...(guest.altNames ?? [])].flatMap(nameTokens);
  return bestGuestScore(queryTokens, candidateTokens);
}

function invitationScore(queryTokens: readonly string[], invitation: Invitation): number | null {
  let best: number | null = null;
  for (const guest of invitation.guests) {
    const score = guestScore(queryTokens, guest);
    if (score !== null && (best === null || score > best)) best = score;
  }
  return best;
}

export function searchInvitations(invitations: readonly Invitation[], query: string): SearchResult {
  if (!isSearchableQuery(query)) return { matches: [], truncated: false };
  const tokens = queryTokens(query);

  const scored = invitations
    .map((invitation, index) => ({ invitation, index, score: invitationScore(tokens, invitation) }))
    .filter((entry): entry is { invitation: Invitation; index: number; score: number } => entry.score !== null);

  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  return {
    matches: scored.slice(0, MAX_SEARCH_RESULTS).map((entry) => entry.invitation),
    truncated: scored.length > MAX_SEARCH_RESULTS,
  };
}

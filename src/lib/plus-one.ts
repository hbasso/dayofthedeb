export const MAX_PLUS_ONE_NAME_LENGTH = 100;

const SPACE_CODE = 32;
const DEL_CODE = 127;

/**
 * Replaces every control character (below 0x20, or DEL) with a space and collapses runs of
 * spaces into one, then trims. Guest-typed input can carry a pasted newline or tab; this keeps
 * the stored name a single tidy line.
 */
function cleanWhitespace(value: string): string {
  let result = '';
  let lastWasSpace = false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const isControl = code < SPACE_CODE || code === DEL_CODE;
    const isSpace = isControl || code === SPACE_CODE;
    if (isSpace) {
      if (!lastWasSpace) result += ' ';
      lastWasSpace = true;
    } else {
      result += value[index];
      lastWasSpace = false;
    }
  }
  return result.trim();
}

/** The plus-one name to store for an answer: a trimmed name when an eligible guest attends and names someone, otherwise null. */
export function storedPlusOneName(
  hasPlusOne: boolean,
  attending: 'yes' | 'no',
  plusOneName: string | undefined,
): string | null {
  if (!hasPlusOne || attending !== 'yes') return null;
  const cleaned = cleanWhitespace(plusOneName ?? '');
  return cleaned ? cleaned : null;
}

/** The plus-one who counts toward the headcount right now, or null. */
export function countedPlusOne(guest: {
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  plusOneName?: string;
}): string | null {
  return guest.attending === 'yes' ? storedPlusOneName(guest.hasPlusOne, 'yes', guest.plusOneName) : null;
}

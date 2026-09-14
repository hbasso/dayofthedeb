export const MAX_PLUS_ONE_NAME_LENGTH = 100;

/** The plus-one name to store for an answer: a trimmed name when an eligible guest attends and names someone, otherwise null. */
export function storedPlusOneName(
  hasPlusOne: boolean,
  attending: 'yes' | 'no',
  plusOneName: string | undefined,
): string | null {
  if (!hasPlusOne || attending !== 'yes') return null;
  const trimmed = plusOneName?.trim() ?? '';
  return trimmed ? trimmed : null;
}

/** The plus-one who counts toward the headcount right now, or null. */
export function countedPlusOne(guest: {
  hasPlusOne: boolean;
  attending: 'yes' | 'no' | null;
  plusOneName?: string;
}): string | null {
  return guest.attending === 'yes' ? storedPlusOneName(guest.hasPlusOne, 'yes', guest.plusOneName) : null;
}

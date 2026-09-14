import { MAX_PLUS_ONE_NAME_LENGTH } from '@/lib/plus-one';
import type { RsvpAnswer, SubmitRsvpInput } from '@/types/rsvp';

export const MAX_ANSWERS = 20;
const RECORD_ID = /^rec[A-Za-z0-9]{14}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAnswer(value: unknown): RsvpAnswer | null {
  if (!isRecord(value)) return null;
  const { guestId, attending, plusOneName } = value;
  if (typeof guestId !== 'string' || !RECORD_ID.test(guestId)) return null;
  if (attending !== 'yes' && attending !== 'no') return null;
  if (plusOneName === undefined) return { guestId, attending };
  if (typeof plusOneName !== 'string' || plusOneName.length > MAX_PLUS_ONE_NAME_LENGTH) return null;
  return { guestId, attending, plusOneName };
}

/** Parses untrusted server-action input. Returns null for anything malformed. */
export function parseSubmitRsvpInput(input: unknown): SubmitRsvpInput | null {
  if (!isRecord(input)) return null;
  const { invitationId, answers } = input;
  if (typeof invitationId !== 'string' || !RECORD_ID.test(invitationId)) return null;
  if (!Array.isArray(answers) || answers.length === 0 || answers.length > MAX_ANSWERS) return null;
  const parsed = answers.map(parseAnswer);
  if (!parsed.every((answer): answer is RsvpAnswer => answer !== null)) return null;
  return { invitationId, answers: parsed };
}

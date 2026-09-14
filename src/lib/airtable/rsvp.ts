import 'server-only';
import type { AirtableClient, RecordUpdate } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import { siteConfig } from '@/config/site';
import { MAX_PLUS_ONE_NAME_LENGTH, storedPlusOneName } from '@/lib/plus-one';
import type { Invitation } from '@/types/domain';
import type { RsvpAnswer } from '@/types/rsvp';

const G = AIRTABLE.guests.fields;

export { MAX_PLUS_ONE_NAME_LENGTH };
export type { RsvpAnswer };

export class RsvpValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RsvpValidationError';
  }
}

/** Validates answers against the household (ownership check) and maps them to Guests-table updates. */
export function buildRsvpUpdates(
  invitation: Invitation,
  answers: readonly RsvpAnswer[],
  respondedOn: string,
): RecordUpdate[] {
  if (!Array.isArray(answers)) {
    throw new RsvpValidationError('answers must be an array');
  }

  const guestsById = new Map(invitation.guests.map((guest) => [guest.id, guest]));
  const answered = new Set<string>();

  return answers.map((answer) => {
    if (answer === null || typeof answer !== 'object') {
      throw new RsvpValidationError('Each answer must be an object');
    }
    if (typeof answer.guestId !== 'string') {
      throw new RsvpValidationError('guestId must be a string');
    }
    if (answer.plusOneName !== undefined && typeof answer.plusOneName !== 'string') {
      throw new RsvpValidationError('plusOneName must be a string');
    }
    const guest = guestsById.get(answer.guestId);
    if (!guest) throw new RsvpValidationError(`Guest ${answer.guestId} is not on invitation ${invitation.id}`);
    if (answered.has(guest.id)) throw new RsvpValidationError(`Duplicate answer for guest ${guest.id}`);
    answered.add(guest.id);
    if (answer.attending !== 'yes' && answer.attending !== 'no') {
      throw new RsvpValidationError(`Invalid attendance for guest ${guest.id}`);
    }

    const fields: Record<string, unknown> = {
      [G.attending]: answer.attending === 'yes' ? 'Yes' : 'No',
      [G.respondedAt]: respondedOn,
    };

    if (guest.hasPlusOne) {
      if ((answer.plusOneName?.trim() ?? '').length > MAX_PLUS_ONE_NAME_LENGTH) {
        throw new RsvpValidationError(`Plus-one name for guest ${guest.id} is too long`);
      }
      fields[G.plusOneName] = storedPlusOneName(true, answer.attending, answer.plusOneName);
    }

    return { id: guest.id, fields };
  });
}

export function respondedOnDate(now: Date = new Date()): string {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: siteConfig.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export async function writeRsvp(client: AirtableClient, updates: readonly RecordUpdate[]): Promise<void> {
  await client.updateRecords(AIRTABLE.guests.tableId, updates);
}

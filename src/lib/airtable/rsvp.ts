import 'server-only';
import type { AirtableClient, RecordUpdate } from '@/lib/airtable/client';
import { AIRTABLE } from '@/lib/airtable/fields';
import { siteConfig } from '@/config/site';
import type { Invitation } from '@/types/domain';

const G = AIRTABLE.guests.fields;

export const MAX_PLUS_ONE_NAME_LENGTH = 100;

export interface RsvpAnswer {
  guestId: string;
  attending: 'yes' | 'no';
  plusOneName?: string;
}

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
  const guestsById = new Map(invitation.guests.map((guest) => [guest.id, guest]));
  const answered = new Set<string>();

  return answers.map((answer) => {
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
      const plusOneName = answer.plusOneName?.trim() ?? '';
      if (plusOneName.length > MAX_PLUS_ONE_NAME_LENGTH) {
        throw new RsvpValidationError(`Plus-one name for guest ${guest.id} is too long`);
      }
      fields[G.plusOneName] = answer.attending === 'yes' && plusOneName ? plusOneName : null;
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

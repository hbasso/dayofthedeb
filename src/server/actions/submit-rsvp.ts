'use server';

import { updateTag } from 'next/cache';
import { getAirtableClient } from '@/lib/airtable/client';
import {
  buildHouseholdEmailUpdate,
  buildRsvpUpdates,
  respondedOnDate,
  RsvpValidationError,
  writeHouseholdEmail,
  writeRsvp,
} from '@/lib/airtable/rsvp';
import { requireSiteSession } from '@/lib/auth';
import { getInvitations, GUEST_LIST_TAG } from '@/lib/guest-list';
import { toRosterHousehold, withAnswers } from '@/lib/roster-view';
import { parseSubmitRsvpInput } from '@/lib/rsvp-input';
import type { SubmitRsvpResult } from '@/types/rsvp';

export async function submitRsvp(input: unknown): Promise<SubmitRsvpResult> {
  await requireSiteSession();
  const parsed = parseSubmitRsvpInput(input);
  if (!parsed) return { status: 'invalid' };

  let writeStarted = false;
  try {
    const invitation = (await getInvitations()).find((candidate) => candidate.id === parsed.invitationId);
    // One answer per guest: buildRsvpUpdates rejects strangers and duplicates, so equal counts mean full coverage.
    if (!invitation || parsed.answers.length !== invitation.guests.length) return { status: 'invalid' };

    const updates = buildRsvpUpdates(invitation, parsed.answers, respondedOnDate());
    const client = getAirtableClient();
    writeStarted = true;
    await writeRsvp(client, updates);

    let emailWritten = false;
    if (parsed.email) {
      try {
        await writeHouseholdEmail(client, buildHouseholdEmailUpdate(invitation, parsed.email));
        emailWritten = true;
      } catch (error) {
        console.error('household email write failed', error);
      }
    }

    const household = withAnswers(toRosterHousehold(invitation), parsed.answers);
    return {
      status: 'ok',
      household: { ...household, hasEmailOnFile: household.hasEmailOnFile || emailWritten },
    };
  } catch (error) {
    if (error instanceof RsvpValidationError) return { status: 'invalid' };
    console.error('submitRsvp failed', error);
    return { status: 'error' };
  } finally {
    // A large household writes in multiple PATCH batches; even a partial write can change
    // what's on Airtable, so the cache must be refreshed whenever a write was attempted.
    if (writeStarted) updateTag(GUEST_LIST_TAG);
  }
}

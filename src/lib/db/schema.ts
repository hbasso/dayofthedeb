import { sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

/**
 * Mirrors the schema already applied to the Neon database. The database is the source of truth:
 * nothing here may be pushed to it, and drizzle-kit must never run against it.
 *
 * `householdKey` and `nameKey` are generated columns (trimmed, lowercased) that make imports
 * idempotent. Never write to them. `updatedAt` is maintained by a trigger, so the app leaves it
 * alone too.
 */
export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    household: text('household').notNull(),
    householdKey: text('household_key').generatedAlwaysAs(sql`lower(btrim(household))`),
    primaryLastName: text('primary_last_name'),
    contactEmail: text('contact_email'),
    address: text('address'),
    city: text('city'),
    state: text('state'),
    zip: text('zip'),
    expectedSize: integer('expected_size'),
    notes: text('notes'),
    source: text('source'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('invitations_household_key_unique').on(t.householdKey)],
);

export const guests = pgTable(
  'guests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    invitationId: uuid('invitation_id')
      .notNull()
      .references(() => invitations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').generatedAlwaysAs(sql`lower(btrim(name))`),
    altNames: text('alt_names')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    hasPlusOne: boolean('has_plus_one').notNull().default(false),
    attending: text('attending', { enum: ['yes', 'no'] }),
    plusOneName: text('plus_one_name'),
    respondedAt: timestamp('responded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('guests_invitation_name_unique').on(t.invitationId, t.nameKey),
    index('guests_invitation_id_idx').on(t.invitationId),
  ],
);

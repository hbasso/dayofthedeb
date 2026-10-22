import 'server-only';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/lib/db/schema';

/**
 * The HTTP driver, not a pooled TCP connection: it is stateless, so serverless functions can
 * never exhaust Postgres connections. It has no interactive transactions; db.batch() sends a
 * group of statements as one transaction instead, which is all the write path needs.
 *
 * Read lazily so `next build` works without secrets present, matching lib/env.ts.
 */
let cached: ReturnType<typeof create> | null = null;

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Missing required environment variable: DATABASE_URL');
  return drizzle(neon(url), { schema });
}

export function getDb() {
  cached ??= create();
  return cached;
}

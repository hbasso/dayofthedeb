// Read lazily so `next build` works without secrets present.
// Not marked server-only because src/proxy.ts imports it; none of these are NEXT_PUBLIC_, so they never reach a client bundle.
// Airtable getters must NOT go in this file; they belong in a server-only module
// (src/lib/airtable/client.ts) so client imports fail the build (DESIGN §3). This file stays proxy-safe.

export function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getSitePassword(): string {
  return readRequiredEnv('SITE_PASSWORD');
}

export function getAuthSecret(): string {
  const secret = readRequiredEnv('AUTH_SECRET');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return secret;
}

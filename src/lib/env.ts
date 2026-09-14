// Read lazily so `next build` works without secrets present.
// Not marked server-only because src/proxy.ts imports it; none of these are NEXT_PUBLIC_, so they never reach a client bundle.

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export function getSitePassword(): string {
  return required('SITE_PASSWORD');
}

export function getAuthSecret(): string {
  const secret = required('AUTH_SECRET');
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return secret;
}

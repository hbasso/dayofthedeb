# Day of the Deb

Private, invite-only RSVP site for a debutante celebration. Spec: see `DESIGN.md`.

## Local setup

```bash
npm install
cp .env.example .env.local
```

Generate `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Set `AUTH_SECRET` and `SITE_PASSWORD` in `.env.local`, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — lint
- `npm test` — run the test suite

## Deployment

Deployed on Vercel. Set `SITE_PASSWORD` and `AUTH_SECRET` for both Production and Preview environments. Airtable and admin variables (`AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `ADMIN_PASSWORD`) are not needed yet; they arrive in later phases.

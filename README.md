# CraftDirectory

A polished professional directory built with Next.js, TypeScript, Better Auth, Drizzle, and Neon/Postgres.

## Quick path

1. `npm install`
2. Configure the environment values below.
3. `npm run db:migrate`
4. `npm run dev`

## Production persistence

The database-backed API uses the Better Auth session on the server; browser-selected roles and client-supplied owner IDs are never authorization inputs.

- `GET`/`POST /api/providers` and `PATCH`/`DELETE /api/providers/:id` persist provider listings. Providers manage only their owned listings; admins manage all listings.
- `GET`/`POST /api/requirements` and `PATCH /api/requirements/:id` persist client briefs. Clients create and edit their own briefs, addressed providers update a brief's status, and admins can view/manage every brief.
- `GET`/`POST /api/appointments` and `PATCH /api/appointments/:id` persist consultation requests. Clients request and cancel their own consultations; admins can view/manage them. An optional availability ID is checked against the selected provider server-side.
- The workspace UI loads these records only for an authenticated session. Without a configured database and Better Auth session, the role selector remains a clearly local preview.

## Google sign-in (Better Auth)

Email/password sign-in remains available. To enable Google sign-in, create a Google OAuth **web application** and configure the exact callback URL `https://YOUR_DOMAIN/api/auth/callback/google` (use `http://localhost:3000/api/auth/callback/google` locally). Set the server-only `GOOGLE_AUTH_CLIENT_ID` and `GOOGLE_AUTH_CLIENT_SECRET`, plus the canonical `BETTER_AUTH_URL`, in each environment. Do not use the calendar OAuth credentials unless that Google client has this exact Better Auth callback authorized; the two integrations have separate purposes and credentials may be scoped separately.

Authenticated provider accounts can link Google sign-in from **Manage listing**. The app posts only `provider: "google"` plus same-origin success and error callback URLs to Better Auth's built-in `/api/auth/link-social` endpoint; Better Auth owns the session check, OAuth state, callback, and account persistence. Linking does not change the app role or disable email/password sign-in.

## Google Calendar (optional, production-safe)

Calendar integration is disabled until all server-only variables below are configured. A provider connects their calendar from **Manage listing**, which requests only FreeBusy and calendar event access. Refresh tokens are AES-256-GCM encrypted at rest and never returned by an API or logged.

1. Create an OAuth web client in Google Cloud and add `https://YOUR_DOMAIN/api/calendar/google/callback` (and the local callback) as authorized redirect URIs.
2. Set `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY` (a base64 32-byte key), and `GOOGLE_CALENDAR_STATE_SECRET` in Vercel for each environment and in `.env.local` for development.
3. Run `npm run db:migrate` using the direct Neon connection before enabling the feature.

Clients can check a connected provider's FreeBusy data for a future range of at most 31 days; submitting a request does **not** create an external event. A provider owner or admin confirms a scheduled request through `POST /api/appointments/:appointmentId/confirm` with optional `{ "createMeet": true }`. Confirmation accepts only a `requested` appointment with a selected availability slot and a connected provider calendar. It claims the appointment before calling Google and uses a deterministic Google event ID, so a retry after an uncertain response reconciles the same event instead of creating another. A `calendar_confirming` claim blocks ordinary status changes; after five minutes a safe retry reclaims it and reconciles the deterministic event ID. Email delivery remains explicitly **not configured**. The webhook accepts only an unexpired stored Google channel ID/token pair and safely invalidates its sync cursor; push-channel registration/resync scheduling should be run by trusted server-side maintenance code.

## Neon migration path

The required tables (`requirements`, `availability`, `appointments`, and `provider_calendar_connections`) are part of the checked Drizzle migration history.

1. Provision Neon through Vercel Marketplace or select an existing Neon project.
2. Add pooled `DATABASE_URL` and direct `DATABASE_URL_UNPOOLED` to Vercel and `.env.local`.
3. Set `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` (`http://localhost:3000` locally; canonical HTTPS origin in production).
4. Apply the checked migration history with a direct database URL:

```bash
npm run db:migrate
```

Use `DATABASE_URL` for application traffic and `DATABASE_URL_UNPOOLED` for Drizzle migrations. Do not commit `.env.local` or secrets.

## Remaining demo-only areas

- Email/SMS notifications and push-channel registration are **not** connected. Calendar event creation is available only after a provider has securely connected Google Calendar.
- The concierge and no-session role selector are local UI previews.
- The workspace does not claim automatic matching, delivery, or calendar availability until those external integrations are configured.

## Verification

```bash
npm test
npm run build
```

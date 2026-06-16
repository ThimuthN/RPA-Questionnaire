# CLAUDE.md — Screener V2 Project Guide

This file captures deployment gotchas, infrastructure setup, and hard-won lessons
so future AI models and developers don't repeat the same debugging sessions.

---

## Project Structure

- **Repo root:** `RPA-Questionnaire/`
- **App lives in:** `RPA-Questionnaire/screener-v2/` — all commands run from here
- **Framework:** Next.js 15 (App Router), TypeScript, Prisma, Neon (Postgres), Vercel

---

## Staging Deployment

| Thing | Value |
|---|---|
| Staging URL | `https://screener-v2-staging.vercel.app` |
| Vercel project | `thimuthns-projects/screener-v2-staging` |
| Git branch | `staging-dev` → auto-deploys to Vercel Production env |
| DB | Neon project `ep-sparkling-haze-aqyatplj` |

Pushing to `staging-dev` triggers a Vercel deploy. The build runs:
```
prisma migrate deploy && next build
```

---

## Database Setup

### Two Neon databases exist — don't confuse them

| Variable | Host | Purpose |
|---|---|---|
| `DATABASE_URL` | `ep-sparkling-haze-aqyatplj-pooler` | Runtime queries (pooler) |
| `DIRECT_URL` | `ep-sparkling-haze-aqyatplj` | Migrations (direct, no pooler) |

The local `.env` previously pointed to a different/old Neon project (`ep-late-bonus-a4dwjjni`).
The **staging Vercel deployment uses `ep-sparkling-haze-aqyatplj`**. Always verify which DB
you're targeting before running migrations or seeding data.

### Advisory lock issue with Neon

Neon's connection pooler doesn't support PostgreSQL advisory locks. `prisma migrate deploy`
uses advisory locks by default and will time out with:
```
Timed out trying to acquire a postgres advisory lock
```

**Fix:** `PRISMA_MIGRATE_SKIP_ADVISORY_LOCK=1` is hardcoded into the `prisma:migrate:deploy`
npm script in `package.json`. Do not remove it.

### Setting Vercel env vars via CLI

PowerShell pipes corrupt values silently. Always use **Bash** with `printf`:
```bash
printf '%s' "your-value" | npx vercel env add VAR_NAME production
```
Do **not** use `echo $var | npx vercel env add ...` in PowerShell — values end up as empty strings.

---

## Migration System

### The manual SQL gap problem

Several schema changes were historically applied as manual SQL files instead of
proper Prisma migrations. This means fresh DB setups (reset, new environments)
were missing those changes. We fixed this by promoting them to proper migrations:

| Migration | What it adds |
|---|---|
| `20260616_add_mfa_columns` | `mfaEnabled`, `mfaSecret`, `mfaBackupCodes`, `mfaEnrolledAt` on User + `MfaTrustedDevice` table |
| `20260616_add_session_version` | `sessionVersion` on User (token revocation) |
| `20260617_fix_candidate_offer_status_enum` | Creates `CandidateOfferStatus` Postgres enum, converts column from TEXT |
| `20260617_fix_result_review_state_enum` | Creates `ResultReviewState` Postgres enum, converts column from TEXT |
| `20260617_add_user_auth_tokens` | `UserAuthToken` table (password reset / invite tokens) |
| `20260617_add_org_security_settings` | `OrgSecuritySettings` singleton table |

The original manual files (`manual_mfa_schema.sql`, `manual_session_version.sql`, etc.)
still exist in `prisma/migrations/` for reference but are no longer needed for new setups.

### Enum vs TEXT mismatch pattern

If `prisma migrate status` says "up to date" but the app crashes with
`column X does not exist` or type cast errors — check if the Prisma schema
defines an enum that was never created as a `CREATE TYPE ... AS ENUM` in any migration.

To fix: create a migration that:
1. `CREATE TYPE "EnumName" AS ENUM (...)`
2. `ALTER TABLE ... ALTER COLUMN ... DROP DEFAULT`
3. `ALTER TABLE ... ALTER COLUMN ... TYPE "EnumName" USING ...::"EnumName"`
4. `ALTER TABLE ... ALTER COLUMN ... SET DEFAULT 'value'::"EnumName"`

### Resetting a staging DB

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="<user consent text>" \
DATABASE_URL="<staging-url>" DIRECT_URL="<staging-url>" \
npx prisma migrate reset --force --skip-seed
```

Prisma requires explicit user consent when run by AI. Set the env var to the
exact text of the user's approval message.

---

## Admin Account Bootstrap

The app uses `ensureBootstrapAdmin()` (called on every login) to create a system
admin from env vars:
- `BOOTSTRAP_ADMIN_EMAIL` — admin email (set in Vercel)
- `BOOTSTRAP_ADMIN_PASSWORD` — admin password (set in Vercel)
- `BOOTSTRAP_ADMIN_NAME` — display name (optional)

This creates a `System` department (slug: `system`, id: `system-dept`) and a
`system-admin` access role automatically.

To manually create/reset an admin user on a fresh DB, run a Node script using
the Prisma client directly — see the session history for the pattern used.

**Note:** The `System` department shows up in the department workspace sidebar.
This is a known cosmetic issue — the sidebar query should filter out `slug = 'system'`
departments to avoid confusing system admins with hiring workspaces.

---

## Email (Resend)

- Provider: Resend (`RESEND_API_KEY` set in Vercel)
- From address: `EMAIL_FROM` env var (defaults to `noreply@innobothealth.com`)
- **Staging limitation:** No domain is verified in Resend. Using `onboarding@resend.dev`
  only delivers to the Resend account owner's email.
- **Production:** Verify `innobothealth.com` (or the client's domain) in Resend → Domains.
  Add the 3 DNS records Resend provides. Then set `EMAIL_FROM=noreply@innobothealth.com`.
- Microsoft 365 integration is also available via `sendViaMailbox` — use that instead
  once Innobot's M365 tenant is connected.

---

## Common Debugging

| Symptom | Likely cause | Fix |
|---|---|---|
| `column X does not exist` on Prisma query | Manual SQL was applied to old DB but not in migrations | Create a proper migration file |
| `LOGIN FAILED` with requestId (not "Invalid password") | Unhandled exception in login route — often Prisma schema mismatch | Check migration gaps |
| Advisory lock timeout on `migrate deploy` | Neon pooler doesn't support pg advisory locks | `PRISMA_MIGRATE_SKIP_ADVISORY_LOCK=1` (already in package.json) |
| Vercel env var shows as empty string | PowerShell pipe corruption | Use Bash `printf '%s' "value" \| vercel env add` |
| `User table does not exist` on migrate execute | Wrong DB targeted | Verify `DATABASE_URL` host matches intended Neon project |
| `Something went wrong` on department pages | Missing enum type in DB | Check schema enums vs migration CREATE TYPE statements |

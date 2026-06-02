# Staging Frontend Smoke 15AJ

Last updated: 2026-06-02

## Scope

- Batch: `15AJ`
- Classification: `Patch`
- Target Vercel project: `screener-v2-staging`
- Target domain: `https://screener-v2-staging.vercel.app`
- Local commit under review: `daac178`

This batch was limited to staging-target verification, Production-environment safety checks on the dedicated staging project, access checks against the stable staging domain, and issue capture. No product code was changed.

## Vercel target verification

- Linked project: `thimuthns-projects/screener-v2-staging`
- Dedicated staging project: yes
- Stable staging alias present: `https://screener-v2-staging.vercel.app`
- Current stable deployment target: `production`
- Current stable deployment status: `Ready`
- Current stable deployment alias resolves to:
  - `https://screener-v2-staging.vercel.app`
  - backing deployment URL observed via `vercel inspect`: `https://screener-v2-staging-7278gyijn-thimuthns-projects.vercel.app`
- Current stable deployment created: `2026-06-01`

## Staging Production environment status

Environment inspected: `Production` on project `screener-v2-staging`.

### Required variables

| Variable | Exists | Non-empty | Expected target | Staging-safe assessment |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Yes | No | Staging DB | Not proven |
| `DIRECT_URL` | Yes | No | Staging DB | Not proven |
| `AUTH_SESSION_SECRET` | Yes | No | Fixed secret for staging runtime | Invalid |
| `APP_URL` | Yes | No | `https://screener-v2-staging.vercel.app` | Invalid |
| `NEXT_PUBLIC_APP_URL` | Yes | No | `https://screener-v2-staging.vercel.app` | Invalid |
| `BLOB_READ_WRITE_TOKEN` | Yes | No | Staging-only Blob, if used | Not usable |

### Isolation findings

- `DATABASE_URL` in the staging project Production env is present but blank.
- `DIRECT_URL` in the staging project Production env is present but blank.
- `APP_URL` and `NEXT_PUBLIC_APP_URL` are present but blank, so they do not match the staging domain.
- `AUTH_SESSION_SECRET` is present but blank.
- `BLOB_READ_WRITE_TOKEN` is present but blank.
- Staging `DATABASE_URL`, `DIRECT_URL`, `BLOB_READ_WRITE_TOKEN`, and `BLOB_STORE_ID` all differ from the `screenerlive` Production project values, but that does not rescue the staging env because the staging values are blank.

## Critical safety conclusion

The staging project Production env is not correctly configured for a safe fresh production-slot deploy.

Two facts together make this unsafe:

1. The staging project custom Production build command is:
   - `if [ "$VERCEL_ENV" = "production" ]; then npm run prisma:migrate:deploy && npm run addons:bootstrap; fi && npm run build`
2. The required staging Production DB/auth/app variables are blank.

That means a new `npx vercel --prod --yes` deployment would run the migration-bearing build path against an unproven runtime source. This batch therefore stopped before redeploying the production slot and before any authenticated data validation.

## Access check

### Stable staging domain

- `https://screener-v2-staging.vercel.app` loads the app shell successfully.
- No Vercel Authentication wall appeared on the stable staging alias.

### Login route

- `/login` loads the application login page, not the Vercel protection page.
- Observed visible content includes:
  - `Sign in to Northstar Hiring OS`
  - `Internal access`
  - `Use your internal account to manage candidates, assessments, results, and hiring workflow access.`

### Unauthenticated workspace routing

- `GET /people/candidates` returns a redirect to `/login?next=%2Fpeople%2Fcandidates`
- This indicates the auth gate is active on the stable staging alias.

## Browser smoke result

### Completed safely

- Verified the stable staging alias is the intended target.
- Verified the stable staging alias is not blocked by Vercel Authentication.
- Verified the app landing page and app login page render on the stable staging alias.
- Verified unauthenticated access to a protected workspace route redirects to login.

### Not performed

The following checks were intentionally not performed because the staging Production DB/auth env could not be proven safe and the Production build path would run migrations:

- Authenticated login with a staging user
- Department workspace smoke
- Unified candidates comparison
- Unified applicants comparison
- Candidate profile smoke
- Authenticated light/dark mode review
- Resume/blob-related checks

## Visual observations

No screenshots were captured.

The available non-authenticated observations from the stable staging alias were:

1. Landing page:
   - Loads branded Northstar marketing shell
   - Left rail shows public-facing `Careers`
   - Theme toggle is visible
   - Visual style is coherent and not broken
2. Login page:
   - Loads the app login form inside the branded shell
   - `Email` and `Password` fields render
   - `Sign in` button renders
   - No Vercel protection interstitial is present
3. Protected candidates route without auth:
   - Redirects to login as expected

No authenticated workspace, department, candidate, applicant, or profile visuals were certified in this batch.

## Issues

### P1 staging validation blockers

1. `screener-v2-staging` Production env has blank `DATABASE_URL`.
2. `screener-v2-staging` Production env has blank `DIRECT_URL`.
3. `screener-v2-staging` Production env has blank `AUTH_SESSION_SECRET`.
4. `screener-v2-staging` Production env has blank `APP_URL`.
5. `screener-v2-staging` Production env has blank `NEXT_PUBLIC_APP_URL`.
6. `screener-v2-staging` Production env has blank `BLOB_READ_WRITE_TOKEN`.
7. The staging project Production build command runs `prisma migrate deploy`, so a fresh `--prod` deploy is unsafe until the staging Production DB target is explicitly fixed and verified.

### P2 trust / deployment hygiene

1. Earlier Vercel build logs in this repo showed cloud builds loading tracked `.env`.
2. The stable staging app is currently reachable despite blank staging Production env values, which means configuration provenance is not trustworthy enough for staging validation.

### P3 later

1. Unified ATS workspace could not be frontend-validated on authenticated routes in this batch because staging runtime truth is not yet reliable.

## Next recommended batch

- `Batch 15AK: Repair staging Production env truth and disable migration-bearing deploy risk before authenticated smoke`

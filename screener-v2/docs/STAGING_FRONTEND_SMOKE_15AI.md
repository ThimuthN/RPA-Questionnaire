# Staging Frontend Smoke 15AI

Last updated: 2026-06-02

## Scope

- Batch: `15AI`
- Classification: `Patch`
- Commit deployed: `e34853b`
- Preview URL: `https://screener-v2-staging-httqn04of-thimuthns-projects.vercel.app`
- Purpose: deploy the accepted unified ATS workspace work and attempt staging browser smoke without changing product behavior

## Deployment result

- Deployment command used: `npx vercel --yes`
- Vercel project linked locally: `thimuthns-projects/screener-v2-staging`
- Deployment status: `Ready`
- Vercel build: passed
- Vercel warnings/errors during deploy:
  - Preview deployment is protected by Vercel Authentication at the edge.
  - Preview environment variables required by the app are not configured in preview.
  - Vercel build logs show `Environment variables loaded from .env` and `Environments: .env`, which means tracked repo env state is influencing cloud builds.

## Environment verification

### Project linkage

- Linked project: `screener-v2-staging`
- Root directory: `.`
- Framework preset: `Next.js`
- Node.js version in project settings: `24.x`
- Build command in project settings:
  - `if [ "$VERCEL_ENV" = "production" ]; then npm run prisma:migrate:deploy && npm run addons:bootstrap; fi && npm run build`

### Preview environment variable status

Pulled via `vercel env pull --environment=preview` and `--git-branch=staging-dev` without printing values.

- Present in preview:
  - `BLOB_STORE_ID`
  - `BLOB_WEBHOOK_PUBLIC_KEY`
  - Vercel system variables
- Missing in preview:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `AUTH_SESSION_SECRET`
  - `APP_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `BLOB_READ_WRITE_TOKEN`

### Production environment variable status

Pulled via `vercel env pull --environment=production` without printing values.

- Present in production:
  - `DATABASE_URL`
  - `DIRECT_URL`
  - `AUTH_SESSION_SECRET`
  - `APP_URL`
  - `NEXT_PUBLIC_APP_URL`
  - `BLOB_READ_WRITE_TOKEN`

### Staging safety conclusion

- Preview DB identity could not be proven because preview does not currently expose the app runtime variables needed for DB-backed staging validation.
- Preview Blob write safety could not be proven for the same reason.
- Production and preview are not equivalently configured.
- Because preview is missing runtime app variables, data validation is incomplete even though the preview build succeeded.

## Browser smoke result

### What was reachable

- Vercel deployment metadata and build logs
- Edge response headers for preview URLs

### What blocked app validation

- Every tested preview route returned `401 Unauthorized` from Vercel Authentication before the app rendered.
- No protection bypass for automation or shareable access path was available from repo truth.
- Because the edge layer blocked access, the actual app UI was never reached by the available tooling.

### Route-by-route observations

| Route | Result | Observation |
| --- | --- | --- |
| `/` | Blocked | `401 Unauthorized` from Vercel edge protection |
| `/login` | Blocked | `401 Unauthorized`; response body states `This page requires Vercel authentication.` |
| `/people/candidates` | Blocked | `401 Unauthorized` before app auth/session logic |
| `/people/candidates/applicants` | Blocked | `401 Unauthorized` before app auth/session logic |
| `/people/candidates/cand-1` | Blocked | `401 Unauthorized` before candidate profile render |
| `/departments/dept-rpa-sl` | Blocked | `401 Unauthorized` before department workspace render |
| `/departments/dept-rpa-sl/candidates` | Blocked | `401 Unauthorized` before candidate workspace render |
| `/departments/dept-rpa-sl/applicants` | Blocked | `401 Unauthorized` before applicant workspace render |
| `/departments/dept-rpa-ind/candidates` | Blocked | `401 Unauthorized` before department candidate workspace render |

### Checklist status

| Check | Status | Notes |
| --- | --- | --- |
| Login page loads | Blocked | Preview protection intercepts `/login` |
| Authenticated landing | Blocked | Could not reach app login/session flow |
| Sidebar/navigation | Blocked | Could not reach app shell |
| Department workspace tabs | Blocked | Could not reach department pages |
| Candidate workspace unification | Blocked | Could not visually compare protected routes |
| Applicant workspace unification | Blocked | Could not visually compare protected routes |
| Candidate profile | Blocked | Could not open profile in app |
| Empty states | Blocked | Could not reach app pages |
| Light/dark mode | Blocked | Could not reach app pages |

## Screenshot capture

- No screenshots were captured.
- Reason: Vercel Authentication blocked the preview before the app UI rendered, and no automation bypass/shareable link was available from repo truth.
- This report therefore records exact route and deployment observations instead of screenshots.

## Issues found

### P1 staging blockers

1. Preview deployment is not browser-testable because Vercel Authentication blocks all preview routes for non-authorized tooling.
2. Preview environment is missing the runtime variables required for app-backed staging validation: `DATABASE_URL`, `DIRECT_URL`, `AUTH_SESSION_SECRET`, and app URL configuration.

### P2 polish / trust gaps

1. Cloud build used tracked repo `.env` state. Vercel logs explicitly showed `Environment variables loaded from .env` and `Environments: .env`.
2. The deployment npm script in `package.json` still points at `npx vercel --cwd .. --yes`; this batch used `npx vercel --yes` directly from the linked repo root instead.

### P3 later

1. Unified ATS workspace could not be visually certified in preview yet because staging access and runtime configuration are not ready.

## Recommendation

The unified workspace is deployed and build-valid, but not yet frontend-validated in staging. The next safe batch should fix staging access and preview runtime truth before any further UI claims.

- Next recommended batch: `Batch 15AJ: Unblock preview access and preview runtime env for real staging smoke`

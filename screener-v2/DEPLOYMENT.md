# Deployment Guide — Northstar Hiring OS v1

> Current release status is owned by `docs/RELEASE_READINESS_BACKLOG.md`. This file is the deployment runbook, not the canonical readiness tracker.

**Last Updated:** 2026-06-01  
**Release:** Batch 15X  
**Status:** Ready for deployment

---

## Product Scope

Northstar Hiring OS is a **lean, internal hiring platform** for managing jobs, applicants, candidate profiles, assessments, and final hiring decisions.

### Included Features
- Job posting and publishing
- Public applicant job application (with resume upload)
- Candidate workspace (list, search, filter)
- Applicant workflow (review, promote to pipeline, close)
- Candidate detail with assessment evidence, notes, and final decisions
- Permission-based access control by role

### Explicitly NOT Implemented
- Candidate login portal — Candidates apply via public page only
- Email automation — No automated email invitations
- Calendar integration — No scheduling system
- Offer management — No offer generation or acceptance
- Employee HRMS — No employee records or performance management
- Interview panels — No interview scheduling or feedback
- AI ranking — All decisions are manual, user-driven

---

## Deployment Instructions

### Prerequisites
- Node.js 18+ (or 20+)
- npm or yarn
- PostgreSQL database (Neon, RDS, self-hosted, etc.)
- Vercel account (for Vercel deployment) OR Node.js hosting

### Step 1: Create a Database

If using **Neon** (recommended):
1. Create a Postgres project in [Neon console](https://console.neon.tech)
2. Copy the **pooled connection string** (for app) → save as `DATABASE_URL`
3. Copy the **direct connection string** (for migrations) → save as `DIRECT_URL`

### Step 2: Configure Environment Variables

**For local development:**
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your database URLs and app URL.

**For production (Vercel):**
Set these in Vercel environment variables (Settings → Environment Variables):
```
DATABASE_URL = postgresql://...
DIRECT_URL = postgresql://...
APP_URL = https://yourdomain.com
```

**For production (self-hosted):**
Create `.env.local` on the server with the same variables above.

### Step 3: Install & Migrate

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
```

### Step 4: Build

```bash
npm run build
```

### Step 5: Deploy

**Option A: Vercel (Recommended)**
```bash
# Using Vercel CLI
npm run deploy:prod
```

Or:
1. Push to GitHub
2. Import into Vercel dashboard
3. Vercel runs build/migration automatically

**Option B: Self-Hosted Node.js**
```bash
NODE_ENV=production npm start
# Runs on http://localhost:3000
```

---

## Environment Variables Reference

| Variable | Required | Example | Notes |
|---|---|---|---|
| `DATABASE_URL` | Yes | `postgresql://user:pass@host/db?sslmode=require` | Pooled connection (for app) |
| `DIRECT_URL` | Yes | `postgresql://user:pass@host/db?sslmode=require` | Direct connection (for migrations) |
| `APP_URL` | Yes | `https://hiring.company.com` | Public URL, used for redirects/links |
| `NEXT_PUBLIC_ORG_NAME` | No | `"Acme Corp"` | Organization name for branding |

Do not commit real database URLs or secrets. Use `.env.local` locally and Vercel environment variables in production.

---

## Post-Deployment Smoke Checklist

Verify the deployment works by checking these scenarios:

### Authentication
- [ ] `/login` loads and accepts email/password
- [ ] Wrong password shows error
- [ ] Correct login redirects to home
- [ ] Session persists across page reloads

### Public Jobs
- [ ] `/jobs` is publicly accessible (no login required)
- [ ] Job list displays with title, department, location
- [ ] "Apply" button opens candidate form
- [ ] Resume upload works

### Candidate Workflow
- [ ] `/people/candidates` requires login
- [ ] Without `view_candidates` permission → redirected
- [ ] With permission, list displays candidates
- [ ] Click candidate → detail page loads

### Final Decisions
- [ ] On candidate detail, "Final decision" section visible
- [ ] With `manage_candidates` permission:
  - [ ] "Mark as hired" button works
  - [ ] "Mark as rejected" button works
  - [ ] After marking, "Revert final decision" appears
- [ ] Without `manage_candidates` permission → buttons hidden

### Assessment Results
- [ ] `/results` requires `view_results` permission
- [ ] Without permission → redirected to home
- [ ] With permission, result list loads

### Permissions
- [ ] Permission denial shows user-friendly error (not stack trace)
- [ ] Different user roles see different menu items

### Appearance
- [ ] Light mode readable
- [ ] Dark mode readable
- [ ] Mobile layout works

---

## Troubleshooting

### Database Connection Error
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Test connection: `psql <DATABASE_URL>`
- Check database is accessible from deployment region

### Build Fails
- Run `npm run build` locally first
- Check `npm run typecheck:unused` for TypeScript errors
- Check `npm run lint` for linting errors

### Migration Fails
- Check migration status: `npx prisma migrate status`
- If stuck, check database logs in Neon/RDS console
- Last resort: `npx prisma migrate resolve --rolled-back <migration_id>`

### "Cannot find module" on Windows
- Delete `node_modules/.prisma`
- Run `npm run prisma:generate` again
- Ensure no `node.exe` processes are running

---

## Security Notes

- **Never commit `.env` or `.env.local`**
- **Always use HTTPS in production** (Vercel handles this)
- **Database passwords should be unique per environment**
- **API endpoints validate user permissions** — no direct database access
- **No secrets exposed in error responses** — users see safe error messages
- **Session cookies are HTTP-only and secure**

---

## Monitoring

- **Vercel logs:** Available in Vercel dashboard under "Functions"
- **Database logs:** Check Neon/RDS console
- **Application errors:** Logged with `requestId` for traceability
- **Performance:** Monitor via Vercel Analytics

---

## Known Limitations

- No email notifications (users must check app directly)
- No calendar integration (no meeting scheduling)
- No candidate self-service portal
- Single region deployment (no multi-region failover)

---

## Complete Environment Variables Reference

### Required for all deployments:
| Variable | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | App database connection (pooled) | `postgresql://user:pass@host/db?sslmode=require` |
| `DIRECT_URL` | Prisma migration connection (direct) | `postgresql://user:pass@host/db?sslmode=require` |
| `APP_URL` | Public application URL (for links/redirects) | `https://hiring.company.com` |
| `AUTH_SESSION_SECRET` | Session encryption key (generate random 32+ char string) | (auto-generated if missing, use fixed value in production) |

### Optional but recommended:
| Variable | Purpose | Example |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for resume storage | (if using Vercel Blob) |
| `NEXT_PUBLIC_ORG_NAME` | Organization display name | `"Acme Corp"` |
| `NEXT_PUBLIC_APP_URL` | Public app URL (for client-side links) | `https://hiring.company.com` |
| `UPSTASH_REDIS_REST_URL` | Redis cache endpoint (optional) | (if using Upstash Redis) |
| `UPSTASH_REDIS_REST_TOKEN` | Redis auth token (optional) | (if using Upstash Redis) |

### Admin bootstrap (local development only):
| Variable | Purpose |
|---|---|
| `BOOTSTRAP_ADMIN_EMAIL` | Initial admin email for first login |
| `BOOTSTRAP_ADMIN_PASSWORD` | Initial admin password |
| `BOOTSTRAP_ADMIN_NAME` | Initial admin display name |

---

## Database Migration Sequence

**Critical:** Always migrate before building in production.

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run pending migrations (must succeed before proceeding)
npm run prisma:migrate:deploy

# 4. Then build application
npm run build

# 5. Start application
npm start
```

**For Vercel deployment:**
- Vercel automatically runs the `build` command from `package.json`
- Migrations should be run **manually before first deploy** on a fresh database
- After initial setup, Vercel's build process will regenerate Prisma client but not run migrations
- For subsequent migrations, run `npm run prisma:migrate:deploy` manually, then redeploy

---

## Production Readiness Notes

### Recommended Infrastructure
- **Database:** Managed PostgreSQL (Neon, AWS RDS) with pooled connection string for app and direct connection for migrations
- **App:** Vercel serverless functions or self-hosted Node.js runtime (18+)
- **Storage:** Vercel Blob (if resume upload is enabled) or S3-compatible storage
- **Caching:** Optional Upstash Redis for session/cache

### Scaling Posture
- Current implementation: single-region, serverless-ready v1
- Suitable for internal hiring teams (10–1000 users)
- Database indexes already present in Prisma schema
- No special scaling required for v1

### Reliability Posture
- Request IDs in all error logs for traceability
- Migrations run separately before deployment for safety
- Manual smoke test after each deployment (see Post-Deployment Smoke Checklist above)
- Session cookies are secure/HTTP-only

### Intentional Limitations (Not Deferred Enhancements)
- **No automated email:** Candidates and hiring teams access the app directly
- **No calendar sync:** Interview scheduling must be handled outside this system
- **No candidate portal:** Candidates apply via public page only
- **No multi-region HA:** Single deployment region for v1
- **No AI ranking:** All candidate ranking is manual
- **No offer management:** Hiring decision is final without offer workflow

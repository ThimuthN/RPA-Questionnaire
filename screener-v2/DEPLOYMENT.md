# Deployment Guide — Northstar Hiring OS v1

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
vercel inspect <deployment-url> --logs
vercel logs <deployment-url>
```
- When debugging a report from the UI, search the Vercel logs for the returned `requestId`.

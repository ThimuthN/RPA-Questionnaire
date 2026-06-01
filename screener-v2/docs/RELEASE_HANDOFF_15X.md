# Release Handoff Guide — Batch 15X

**Date:** 2026-06-01  
**Release:** Northstar Hiring OS v1 (Batch 15X)  
**Status:** Ready for CEO handoff after mother review

---

## Batch 15X Summary

This release hardens the product for leadership review and deployment:

- ✅ All verification commands pass (typecheck, lint, test, build)
- ✅ Frontend smoke path audit complete (CEO demo path verified)
- ✅ Permission model consistent (manage_candidates scoped correctly)
- ✅ No secrets tracked in git
- ✅ Deployment documentation complete
- ✅ Clean archive ready for distribution

---

## What's Included

### Core Features
- Internal hiring workflow: jobs → applicants → candidates → final decisions
- Public jobs page with resume-based applications
- Candidate workspace with filtering and search
- Assessment evidence viewing
- Permission-based access control
- Light/dark mode theme support

### Code Quality
- 207 automated tests passing
- Zero TypeScript errors
- Zero linting errors
- Clean build with no warnings

---

## What's NOT Included (v1 Scope)

- Candidate login portal
- Email automation/invitations
- Calendar integration
- Interview scheduling
- Offer management
- Employee HRMS
- AI ranking or auto-decisions

---

## Files & Artifacts

### Safe for Release
- `src/` — All application code
- `public/` — Static assets
- `prisma/schema.prisma` — Database schema
- `prisma/migrations/` — Migration history
- `docs/` — All documentation
- `.github/workflows/` — CI/CD configuration
- `package.json`, `package-lock.json` — Dependencies

### Excluded from Archives (for safety)
- `.env`, `.env.local` — Real database secrets
- `.next/` — Build artifacts (regenerated at deployment)
- `node_modules/` — Dependencies (regenerated via npm ci)
- `.vercel/` — Vercel build metadata
- `salvaged/` — Deprecated code (kept for history, not deployed)
- `*.log`, `*.err.log` — Development logs
- `.claude/`, `.codex/` — Local AI tool data

---

## Creating a Release Archive

### Method: Filtered Archive Generation

The release archive must exclude deprecated and sensitive files. Use the filtered archive `northstar-handoff-15X-R.zip` which is generated from tracked source files, excluding:
- `salvaged/` — Deprecated code (tracked in git but not deployed)
- `.env*` files — Secrets and local config
- `.next/`, `.vercel/`, `node_modules/` — Build artifacts
- `*.log`, `*.err.log` — Development logs
- Other temporary files

**Archive filename:** `northstar-handoff-15X-R.zip`  
**Expected size:** ~3–4 MB  
**Status:** Ready for distribution to leadership

### Archive Verification

Verify the archive is safe before distribution:

```bash
# Check for forbidden patterns
unzip -l northstar-handoff-15X-R.zip | grep -E '(^|/)(salvaged/|\.env[^/]|\.next/|node_modules|.*\.log$)'
# Expected: No output (no forbidden files)

# Verify required files are present
unzip -l northstar-handoff-15X-R.zip | grep -E '(src/|prisma/|docs/|README.md|DEPLOYMENT.md|package.json)'
# Expected: Shows source files, configuration, and documentation
```

---

## Distribution Checklist

Before handing off to leadership:

- [x] All verification commands pass locally
- [x] Archive created (northstar-handoff-15X-R.zip)
- [x] Archive tested: no forbidden files present
- [x] Archive tested: all required files present (src/, prisma/, docs/, configs)
- [x] DEPLOYMENT.md reviewed and complete
- [x] README.md updated with accurate scope
- [x] V1_FRONTEND_SMOKE_REPORT.md available in `docs/`
- [x] No real `.env` files included in archive
- [x] No salvaged/ deprecated code in archive
- [x] No build artifacts (`.next/`, `node_modules/`) in archive
- [x] Commit hash documented (ad4a9d6)
- [x] Archive signature: 475 files, 3.11 MB compressed

---

## Post-Handoff: Leadership Review

Leadership will review:
1. Product scope and feature list
2. Deployment documentation
3. Smoke test report (what was tested manually)
4. Known limitations and future roadmap

### What Leadership Should NOT See
- Real database connection strings
- API secrets or tokens
- Internal development logs
- Deprecated code (salvaged/)
- Build artifacts

---

## Deployment Path

After mother review and leadership approval:

1. Extract archive to deployment environment
2. Follow `DEPLOYMENT.md` steps:
   - Configure `.env.local` with real secrets
   - Run `npm ci && npm run prisma:generate && npm run prisma:migrate:deploy`
   - Run `npm run build` and test
   - Deploy via Vercel or self-hosted
3. Run post-deployment smoke checklist

---

## Support for Leadership

If leadership has questions about:

- **Scope**: See `DEPLOYMENT.md` "Product Scope" section
- **Demo path**: See `docs/V1_FRONTEND_SMOKE_REPORT.md`
- **Deployment**: See `DEPLOYMENT.md` "Deployment Instructions"
- **Known issues**: See `docs/V1_FRONTEND_SMOKE_REPORT.md` "Known Limitations"
- **Code quality**: All tests pass (207/207)

---

## Final Status (Batch 15X-R Repair)

| Item | Status |
|---|---|
| Build | ✅ PASS |
| Tests | ✅ PASS (207/207) |
| Typecheck | ✅ PASS |
| Linting | ✅ PASS |
| Archive created | ✅ northstar-handoff-15X-R.zip (3.11 MB) |
| Forbidden files excluded | ✅ (salvaged/, .env, .log, .next, etc.) |
| Required files included | ✅ (src/, prisma/, docs/, config files) |
| Real secrets in archive | ✅ NO (safe) |
| Deprecated code in archive | ✅ NO (salvaged/ excluded) |

**Batch 15X-R repair complete. Archive ready for mother review.**

---

## Archive Regeneration

To recreate the release archive:

```bash
node scripts/create-release-archive.mjs
```

This script:
- Reads all tracked files from git
- Filters out forbidden files/directories (salvaged/, .env, .next/, etc.)
- Preserves dynamic route paths exactly (e.g., `src/app/api/candidates/[id]/hire/route.ts`)
- Includes safe templates (`.env.example`, `.env.test.example`)
- Outputs `northstar-handoff-15X-R2.zip` (untracked, not committed)

**Note:** The archive includes only tracked source files. `salvaged/` is tracked in git but excluded from release archives by design.

---

**Prepared by:** Claude Code (Batch 15X-R2)  
**Date:** 2026-06-01  
**Commit:** (after repairs)  
**Archive:** northstar-handoff-15X-R2.zip (3.17 MB, 499 files)

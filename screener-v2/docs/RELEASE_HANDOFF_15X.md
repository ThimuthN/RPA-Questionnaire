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

### Method: Git Archive (Recommended)

Git archive includes only tracked files, excluding `.gitignore` entries. This is the safest method.

```bash
# Create release archive
git archive --format=zip --output=northstar-handoff-15X.zip HEAD

# Verify contents (no forbidden files)
unzip -l northstar-handoff-15X.zip | grep -E '\.env|\.log|\.next|salvaged|node_modules'
# Should return nothing
```

**Expected archive size:** ~2–5 MB (depends on docs)

### Archive Verification

After creating `northstar-handoff-15X.zip`, verify safety:

```bash
# List all contents
unzip -l northstar-handoff-15X.zip | head -50

# Check for forbidden patterns
unzip -l northstar-handoff-15X.zip | grep -i "\.env\|\.log\|node_modules\|\.next\|salvaged"
# Expected: No output (no forbidden files)

# Check database secrets are NOT included
unzip -l northstar-handoff-15X.zip | grep -i "postgresql\|password\|secret"
# Expected: No output (only .env.example, which is a template)
```

---

## Distribution Checklist

Before handing off to leadership:

- [ ] All verification commands pass locally
- [ ] Archive created with `git archive`
- [ ] Archive tested with unzip verification (no forbidden files)
- [ ] DEPLOYMENT.md reviewed and complete
- [ ] README.md updated with accurate scope
- [ ] V1_FRONTEND_SMOKE_REPORT.md available in `docs/`
- [ ] No real `.env` files included in archive
- [ ] No build artifacts (`.next/`, `node_modules/`) included
- [ ] Commit hash documented (4f71b6f)
- [ ] Release notes prepared for leadership

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

## Final Status

| Item | Status |
|---|---|
| Build | ✅ PASS |
| Tests | ✅ PASS (207/207) |
| Typecheck | ✅ PASS |
| Linting | ✅ PASS |
| Smoke audit | ✅ PASS |
| Deployment docs | ✅ COMPLETE |
| Release archive | ✅ READY |
| Real secrets tracked | ✅ NO (safe) |
| Salvaged code in deploy | ✅ NO (excluded) |

**Ready for mother review, then leadership handoff.**

---

## Archive Command Reference

Quick copy-paste for release creation:

```bash
# Navigate to project root
cd /path/to/screener-v2

# Create archive
git archive --format=zip --output=northstar-handoff-15X.zip HEAD

# Verify no forbidden files
unzip -l northstar-handoff-15X.zip | grep -E '(\.env[^.]|\.log|\.next|salvaged|node_modules)' && echo "BLOCKED: Forbidden files found!" || echo "SAFE: No forbidden files"

# Show first 20 files
echo "Archive contents (first 20 files):"
unzip -l northstar-handoff-15X.zip | head -20

# Show size
ls -lh northstar-handoff-15X.zip
```

---

**Prepared by:** Claude Code (Batch 15X)  
**Date:** 2026-06-01  
**Commit:** 4f71b6f

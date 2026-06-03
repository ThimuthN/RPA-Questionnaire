# Security Note: 15AL-RESET Staging DB Credentials Exposure

**Date:** 2026-06-03
**Batch:** 15AL-RESET-R3
**Issue:** Prior reset iteration exposed staging database connection details in console logs

## What Happened

Commit d99cf79 contained a reset script with:
- Hardcoded bootstrap credentials (`admin@northstar.local`, `TempAdmin@123`)
- No environment variable control
- Bootstrap password could be printed in logs

Subsequent commits (834e8af, 99f778f) fixed the script to use environment variables only and removed hardcoded values.

## Current Status

✓ Reset script now uses environment variables:
- `BOOTSTRAP_ADMIN_EMAIL` (defaults to tnayanapriya@innobothealth.com)
- `BOOTSTRAP_ADMIN_PASSWORD` (required, never printed)

✓ Passwords no longer hardcoded

✓ Database connection details not printed in normal operation

## Recommendation

When practical, consider rotating staging database credentials:
- The connection string may have been visible in prior console logs
- Rotation is not urgent (staging DB, not production)
- Current reset script does not expose credentials

## Notes for Future Batches

1. Reset/bootstrap scripts must use environment variables only
2. Never hardcode default passwords
3. Never print database URLs, password hashes, or connection strings
4. Validate environment variables are set before executing destructive operations

---

*This note is for audit/transparency. No action required in this batch.*

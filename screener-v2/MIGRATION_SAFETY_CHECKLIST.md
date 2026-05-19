# Migration Safety Checklist

## CRITICAL: Always Follow This Before Deploying Changes

### Pre-Deployment Validation
- [ ] Run `npx prisma migrate status` - must show "Database is up to date"
- [ ] Run `npx prisma db push --skip-generate` to detect schema drift
- [ ] Verify no pending migrations exist
- [ ] Check git diff prisma/schema.prisma for all schema changes
- [ ] Verify migrations exist in prisma/migrations/ for all schema.prisma changes

### If Schema Drift Detected
```bash
# DO NOT use prisma db push in production!

# Instead, create explicit migration:
npx prisma migrate dev --name describe_what_changed

# Then review the generated migration.sql BEFORE applying:
cat prisma/migrations/YYYYMMDD_describe_what_changed/migration.sql

# Verify:
# - No DROP COLUMN (will lose data)
# - No unprotected CASCADE DELETE
# - All UPDATE statements have WHERE clauses
# - New columns have sensible defaults
```

### Post-Deployment Validation
```bash
# Verify schema is sync'd
npx prisma migrate status

# Spot check critical data
npm run ts-node -- -e "
import { prisma } from '@/lib/db/prisma';
const candidates = await prisma.candidate.findMany({ take: 5 });
console.log(candidates.map(c => ({
  id: c.id,
  fullName: c.fullName,
  stage: c.stage,
  finalDecision: c.finalDecision,
  uiStatus: c.uiStatus,
  hasResume: !!c.resumes?.length
})));
"
```

## Known Issues & Resolutions

### Issue: Database has columns, but Prisma schema doesn't
**Solution:** 
```bash
npx prisma db push --skip-generate  # Detects drift
# Then manually sync schema, then:
npx prisma migrate resolve --rolled-back <migration-name>
```

### Issue: Column exists but migration doesn't
**Root cause:** Column was added to DB directly or via another tool
**Solution:** 
1. Check if column definition matches schema
2. If yes, mark migration as applied: `npx prisma migrate resolve --applied <name>`
3. If no, create new migration with correct definition

### Issue: Data became NULL after update
**Likely cause:** Schema/DB mismatch during write operation
**Recovery:**
```sql
-- For candidates, recover from staging table or backups
-- Restore uiStatus based on stage/finalDecision logic
UPDATE "Candidate" c
SET "uiStatus" = CASE
  WHEN c."finalDecision" = 'rejected' THEN 'rejected'
  WHEN c."finalDecision" = 'selected' THEN 'moved_forward'
  WHEN c."finalDecision" = 'on_hold' THEN 'need_review'
  WHEN c."nextAction" = 'review_result' THEN 'need_review'
  ELSE 'in_progress'
END
WHERE c."uiStatus" IS NULL OR c."uiStatus" = '';
```

## Phase 5 Columns (Critical for Scalability)

These MUST be in the database:

```
Candidate table must have:
├─ uiStatus (TEXT, DEFAULT 'in_progress')     [For filtering]
├─ searchVector (tsvector)                      [For FTS search]
├─ departmentId (TEXT, FK)                      [For dept separation]
├─ hrOwnerId (TEXT, FK)                         [For ownership]
└─ Indexes:
   ├─ (uiStatus, updatedAt)
   ├─ (searchVector) GIN
   └─ (departmentId), (hrOwnerId)
```

Run this to verify all Phase 5 columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='Candidate' 
  AND column_name IN ('uiStatus', 'searchVector', 'departmentId', 'hrOwnerId')
ORDER BY column_name;
```

Expected output: 4 rows (all 4 columns present)

## Backup Strategy

**Before major updates:**
```bash
# Export current database
export DATABASE_URL="postgresql://..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Or for safety, create a Neon branch:
# neon project branch --name backup-2026-05-19
```

**To restore from backup:**
```bash
# Restore to a test database first
psql postgresql://test_db < backup_20260519_120000.sql
# Validate data
# Then restore to prod if needed
```

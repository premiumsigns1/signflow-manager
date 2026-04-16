# SignFlow Archive Feature — Final Deployment Plan

## Status: READY TO DEPLOY

All HIGH severity issues resolved. Code compiled clean. Build succeeded.

## What's Fixed

### Database Schema
- Added `sortOrder INTEGER DEFAULT 0` — fixes 500 error on job listings
- Added `paymentStatus TEXT` — fixes payment status updates
- All new columns added via safe ALTER TABLE with duplicate error suppression
- `displayId` has UNIQUE constraint

### Archive Logic
- **Idempotent**: Re-archiving preserves original `archivedAt` timestamp
- **Status guard**: Only completed jobs can be archived via `/archive` endpoint
- **Auto-unarchive**: When status changes away from Completed/Delivered on an archived job, automatically sets `archived=0`, `archivedAt=NULL`
- Applies to both `PUT /:id` and `PATCH /:id/status`

### Display ID Generation
- Numeric max calculation (handles SIGN-100 correctly)
- UNIQUE constraint on `displayId`
- Retry logic on duplicate key (one retry with fresh ID)

### Frontend
- ArchivedJobs page uses `/api/jobs/archived` endpoint (efficient)
- JobModal and JobDetail show archive controls only for completed jobs
- Archive/unarchive buttons work correctly

## Rollback Plan

If deployment causes issues:

### Option 1: Quick Rollback (revert code)
```bash
cd projects/signflow-manager
git revert HEAD --no-edit
git push
# Vercel auto-reverts
```

### Option 2: Database Rollback (if schema issues)
Connect to Turso and run:
```sql
ALTER TABLE job DROP COLUMN startDate;
ALTER TABLE job DROP COLUMN finishDate;
ALTER TABLE job DROP COLUMN archived;
ALTER TABLE job DROP COLUMN archivedAt;
ALTER TABLE job DROP COLUMN sortOrder;
ALTER TABLE job DROP COLUMN paymentStatus;
ALTER TABLE job DROP COLUMN orderDate;
-- displayId UNIQUE constraint remains (cannot drop easily, but doesn't hurt)
```

### Option 3: Restore from backup
```bash
# Backup file: database-backup-2026-04-16.sql
turso db shell signflow-nickhodson1 < database-backup-2026-04-16.sql
```

## Deployment Steps

1. **Commit changes**
```bash
cd projects/signflow-manager
git add -A
git commit -m "Add archive feature with auto-dating and fixes"
```

2. **Push to GitHub**
```bash
git push origin main
```

3. **Vercel auto-deploys**
- Frontend rebuilds from `client/`
- API (`client/api/jobs.js`) deploys as serverless functions
- Turso DB migrations run automatically on first request

4. **Verify deployment**
- Visit https://client-five-henna-48.vercel.app
- Create a test job → check startDate set
- Complete the job → check it auto-archives (disappears from main view)
- Go to Archived page → job appears
- Restore → job returns to active
- Re-complete → re-archives

## Known Limitations (Accepted)

- No authentication — intentional for private internal tool
- Existing completed jobs (pre-migration) won't auto-archive until manually archived
- Backfill script exists separately: `client/api/backfill-startdate.js` (run manually if needed to populate startDate on old jobs)

## Files Changed

- `client/api/jobs.js` — main API (all fixes)
- `client/src/pages/ArchivedJobs.tsx` — uses dedicated endpoint
- `client/src/components/Layout.tsx` — nav item
- `client/src/App.tsx` — route
- `client/src/context/JobsContext.tsx` — archiveJob function
- `client/src/components/JobModal.tsx` — archive UI + dates
- `client/src/pages/JobDetail.tsx` — archive controls + dates
- `client/api/backfill-startdate.js` — utility script (optional)

## Backup Location

`projects/signflow-manager/database-backup-2026-04-16.sql`

---

**Ready to deploy. All critical issues resolved.**

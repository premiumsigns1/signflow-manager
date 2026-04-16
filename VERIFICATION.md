# Quick Verification Steps

## 1. Database Migration Check
The API will automatically run migrations on next request. Verify with:

```bash
# Check if new columns exist
curl https://client-five-henna-48.vercel.app/api/jobs | head -20
# Should return jobs with startDate, finishDate, archived, archivedAt fields
```

## 2. Manual Test Checklist

### Test A: Create New Job
1. Go to https://client-five-henna-48.vercel.app
2. Login → Jobs → New Job
3. Fill in client name, contact, description
4. Save
5. **Expected**: Job appears in kanban, `startDate` equals order date (check via API or modal)

### Test B: Complete Job
1. Open the new job
2. Change status to "Completed/Delivered"
3. **Expected**: Job disappears from main Jobs view
4. **Expected**: `finishDate` set to current timestamp, `archived=1`, `archivedAt` set

### Test C: View Archived
1. Click "Archived" in sidebar
2. **Expected**: Completed job appears with finish date shown
3. Search for it by client name
4. **Expected**: Search works

### Test D: Restore Job
1. In Archived view, click "Restore"
2. Confirm
3. **Expected**: Job returns to main Jobs view
4. **Expected**: Can move through workflow again

### Test E: Re-complete
1. Move restored job back to "Completed/Delivered"
2. **Expected**: Auto-archives again with new finishDate

## 3. API Direct Tests

```bash
# Test includeArchived param
curl "https://client-five-henna-48.vercel.app/api/jobs?includeArchived=true"

# Test archived endpoint
curl "https://client-five-henna-48.vercel.app/api/jobs/archived"

# Test archive toggle
curl -X PATCH "https://client-five-henna-48.vercel.app/api/jobs/JOB_ID/archive" \
  -H "Content-Type: application/json" \
  -d '{"archive": false}'
```

## 4. Rollback If Needed

```bash
# Option 1: Drop columns
# Run SQL in Turso console:
ALTER TABLE jobs DROP COLUMN startDate;
ALTER TABLE jobs DROP COLUMN finishDate;
ALTER TABLE jobs DROP COLUMN archived;
ALTER TABLE jobs DROP COLUMN archivedAt;

# Option 2: Restore from backup
# Import database-backup-2026-04-16.sql via turso db shell
```

## 5. Deploy Backend

Backend needs to be deployed to a Node host (Railway/Render). Current frontend is live but backend is still local.

**Quick deploy to Railway:**
1. Push to GitHub
2. Connect repo on railway.app
3. Add Turso env vars (already in `set-env.ps1`)
4. Deploy

The code is ready.

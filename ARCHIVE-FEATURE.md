# SignFlow Archive Feature - Implementation Complete

## Overview
This document describes the archive feature implementation for SignFlow job management system.

## Features Added

### 1. Auto-Dating on Job Lifecycle
- **Start Date**: Automatically set when a job is created (uses `orderDate` if provided, otherwise current timestamp)
- **Finish Date**: Automatically set when job status changes to "Completed/Delivered"

### 2. Soft Archive System
- Jobs are **automatically archived** when marked as "Completed/Delivered"
- Archived jobs are **hidden from main Jobs view** by default
- Archived jobs remain **fully searchable** in the dedicated "Archived" section
- Jobs can be **manually unarchived** to restore them to active status

### 3. New Database Fields
Four new columns added to the `jobs` table:
- `startDate` TEXT - When work began
- `finishDate` TEXT - When job completed (set on completion)
- `archived` INTEGER (0/1) - Archive flag
- `archivedAt` TEXT - Timestamp of archiving

## Database Migration

The migration is **non-destructive** and backward compatible:
- New columns are added via `ALTER TABLE` with safe fallbacks
- Existing jobs: `startDate`/`finishDate` will be NULL until status changes
- Existing jobs: `archived` defaults to 0 (not archived)
- No data loss risk

### Rollback Procedure
If you need to rollback:
1. Restore from backup: `database-backup-2026-04-16.sql`
2. Or run: `ALTER TABLE jobs DROP COLUMN startDate; ALTER TABLE jobs DROP COLUMN finishDate; ALTER TABLE jobs DROP COLUMN archived; ALTER TABLE jobs DROP COLUMN archivedAt;`

## API Changes

### New Endpoints
- `GET /api/jobs/archived` - Returns only archived jobs
- `PATCH /api/jobs/:id/archive` - Toggle archive status

### Modified Endpoints
- `GET /api/jobs` - Now accepts `includeArchived=true` query param to include archived jobs
- `POST /api/jobs` - Auto-sets `startDate` on creation
- `PUT /api/jobs/:id` - Auto-sets `finishDate`, `archived=1`, `archivedAt` when status becomes "Completed/Delivered"
- `PATCH /api/jobs/:id/status` - Same auto-archive logic as PUT
- `GET /api/jobs/stats/overview` - Now excludes archived jobs from counts

## Frontend Changes

### New Page
- **Archived Jobs** (`/archived`) - Dedicated page for viewing/searching archived jobs
  - Accessible from sidebar (Archive icon)
  - Shows completion date and original start date
  - One-click restore to active status

### Modified Components
1. **Layout.tsx** - Added "Archived" nav item
2. **Jobs.tsx** - Archive toggle enabled in job detail modal
3. **JobModal.tsx** - Shows start/finish dates, archive controls for completed jobs
4. **JobDetail.tsx** - Shows start/finish dates, archive button for completed jobs
5. **ArchivedJobs.tsx** - New page component

### Job Modal
- Completed jobs show **Archive/Unarchive** button
- Start and Finish dates displayed in read-only mode
- Warning: "Archived jobs are hidden from the main Jobs view but remain searchable in the Archived section"

## Deployment Instructions

### Backend (API)
The backend code is in `/api/jobs.js`. Deploy to one of:

**Option A: Railway (Recommended)**
```bash
# 1. Push to GitHub
cd projects/signflow-manager
git add .
git commit -m "Add archive feature with auto-dating"
git push

# 2. Deploy on Railway
# - Connect GitHub repo
# - Set env vars: TURSO_DATABASE_URL, TURSO_AUTH_TOKEN
# - Build: cd api && npm install && npm run build
# - Start: cd api && npm start
```

**Option B: Render**
```yaml
# render.yaml already configured
# Just ensure DATABASE_URL and JWT_SECRET are set
# The buildCommand and startCommand are already defined
```

### Frontend
Frontend already deployed at `https://client-five-henna-48.vercel.app`

To deploy updates:
```bash
cd projects/signflow-manager/client
npm run build
# Vercel will auto-deploy from git
```

Or manually:
```bash
cd client
vercel --prod
```

## Testing Checklist

Before considering feature complete:

- [ ] Create a new job → verify `startDate` is populated (should equal orderDate or now)
- [ ] Edit job → ensure startDate persists
- [ ] Move job to "Completed/Delivered" → verify `finishDate` and `archived` are set
- [ ] Check main Jobs page → completed job should be hidden (unless includeArchived=true)
- [ ] Navigate to `/archived` → job should appear
- [ ] Search archived jobs → search works
- [ ] Click "Restore" → job returns to active Jobs view
- [ ] Restored job → can be moved through workflow again
- [ ] Re-complete restored job → auto-archives again with new finishDate
- [ ] Verify no console errors in browser
- [ ] Test on mobile responsive layout

## Notes

- All archived jobs are still in the database - no hard deletes
- Archive status is independent of status - only "Completed/Delivered" auto-archives
- Manual archive button only appears for completed jobs (prevents archiving in-progress work)
- Stats dashboard now excludes archived jobs (cleaner view of active work)

## Backup Location

Database backup saved to:
- `projects/signflow-manager/database-backup-2026-04-16.sql`

Contains schema dump and all current job data for rollback if needed.

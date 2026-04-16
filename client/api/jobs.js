import { createClient } from '@libsql/client/http';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

// Map old/legacy status names to current frontend STATUSES
const STATUS_MAP = {
  'Quoted / Sent': 'Quoted/Awaiting',
  'Materials Ordered': 'Order Materials',
  'Requested Review': 'Awaiting Proof Approval',
  'Completed': 'Completed/Delivered',
};

function mapStatus(s) {
  return STATUS_MAP[String(s)] || String(s);
}

function mapJob(job) {
  return {
    ...job,
    currentStatus: mapStatus(job.currentStatus),
  };
}

async function ensureColumns(client) {
  // Safe, idempotent column additions
  const migrations = [
    `ALTER TABLE job ADD COLUMN startDate TEXT`,
    `ALTER TABLE job ADD COLUMN finishDate TEXT`,
    `ALTER TABLE job ADD COLUMN archived INTEGER DEFAULT 0`,
    `ALTER TABLE job ADD COLUMN archivedAt TEXT`,
    `ALTER TABLE job ADD COLUMN orderDate TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE job ADD COLUMN sortOrder INTEGER DEFAULT 0`,
    `ALTER TABLE job ADD COLUMN paymentStatus TEXT`,
  ];
  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch (e) {
      if (!e.message?.toLowerCase().includes('duplicate') && !e.message?.toLowerCase().includes('already exists')) {
        console.error('Migration failed:', sql, e.message);
      }
    }
  }
}

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS job (
      id TEXT PRIMARY KEY,
      displayId TEXT NOT NULL UNIQUE,
      clientName TEXT NOT NULL DEFAULT '',
      clientContact TEXT NOT NULL DEFAULT '',
      jobDescription TEXT NOT NULL DEFAULT '',
      orderDate TEXT NOT NULL DEFAULT '',
      paymentDate TEXT,
      targetDate TEXT,
      currentStatus TEXT NOT NULL DEFAULT 'Quote/Pending',
      assignedTo TEXT,
      proofLink TEXT,
      materialsNeeded TEXT,
      installationDate TEXT,
      notes TEXT,
      startDate TEXT,
      finishDate TEXT,
      archived INTEGER DEFAULT 0,
      archivedAt TEXT,
      sortOrder INTEGER DEFAULT 0,
      paymentStatus TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

function generateId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function getNextDisplayId(client) {
  // Fetch all displayIds to compute numeric max safely (handles mixed padding)
  const result = await client.execute('SELECT displayId FROM job');
  let maxNum = 0;
  for (const row of result.rows) {
    const id = String(row.displayId);
    const match = id.match(/^SIGN-?(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `SIGN-${String(maxNum + 1).padStart(3, '0')}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const client = getClient();

  try {
    await ensureTable(client);
    await ensureColumns(client);

    const { method, url, body } = req;
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // GET /api/jobs or GET /api/jobs?status=...&search=...&includeArchived=...
    if (method === 'GET' && pathname === '/api/jobs') {
      const includeArchived = searchParams.get('includeArchived') === 'true';
      let query = 'SELECT * FROM job WHERE 1=1';
      const args = [];

      if (!includeArchived) {
        query += ' AND (archived = 0 OR archived IS NULL)';
      }

      const status = searchParams.get('status');
      const search = searchParams.get('search');

      if (status && status !== 'all') {
        const dbStatus = Object.entries(STATUS_MAP).find(([, v]) => v === status)?.[0] || status;
        query += ' AND currentStatus = ?';
        args.push(dbStatus);
      }

      if (search) {
        query += ' AND (clientName LIKE ? OR displayId LIKE ? OR jobDescription LIKE ?)';
        const term = `%${search}%`;
        args.push(term, term, term);
      }

      query += ' ORDER BY sortOrder ASC, updatedAt DESC';

      const result = await client.execute({ sql: query, args });
      const jobs = result.rows.map(mapJob);
      return res.status(200).json(jobs);
    }

    // GET /api/jobs/archived - archived jobs only
    if (method === 'GET' && pathname === '/api/jobs/archived') {
      const search = searchParams.get('search');
      let query = 'SELECT * FROM job WHERE archived = 1';
      const args = [];

      if (search) {
        query += ' AND (clientName LIKE ? OR displayId LIKE ? OR jobDescription LIKE ?)';
        const term = `%${search}%`;
        args.push(term, term, term);
      }

      query += ' ORDER BY archivedAt DESC, updatedAt DESC';

      const result = await client.execute({ sql: query, args });
      const jobs = result.rows.map(mapJob);
      return res.status(200).json(jobs);
    }

    // POST /api/jobs
    if (method === 'POST' && pathname === '/api/jobs') {
      const data = body;
      const now = new Date().toISOString();
      const id = generateId();

      // Get next displayId atomically (avoid race condition)
      const displayId = await getNextDisplayId(client);

      const startDate = data.orderDate || now;

      try {
        await client.execute({
          sql: `INSERT INTO job (
            id, displayId, clientName, clientContact, jobDescription,
            orderDate, paymentDate, targetDate, currentStatus, assignedTo,
            proofLink, materialsNeeded, installationDate, notes,
            startDate, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?)`,
          args: [
            id,
            displayId,
            data.clientName || '',
            data.clientContact || '',
            data.jobDescription || '',
            startDate,
            data.targetDate || null,
            'Quote/Pending',
            data.assignedTo || null,
            data.notes || null,
            startDate,
            now,
            now,
          ],
        });
      } catch (e) {
        // Handle rare duplicate displayId (UNIQUE constraint violation) — retry once
        if (e.message?.includes('UNIQUE') || e.message?.includes('duplicate')) {
          const retryId = generateId();
          const retryDisplayId = await getNextDisplayId(client);
          await client.execute({
            sql: `INSERT INTO job (
              id, displayId, clientName, clientContact, jobDescription,
              orderDate, paymentDate, targetDate, currentStatus, assignedTo,
              proofLink, materialsNeeded, installationDate, notes,
              startDate, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?)`,
            args: [
              retryId,
              retryDisplayId,
              data.clientName || '',
              data.clientContact || '',
              data.jobDescription || '',
              startDate,
              data.targetDate || null,
              'Quote/Pending',
              data.assignedTo || null,
              data.notes || null,
              startDate,
              now,
              now,
            ],
          });
          const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [retryId] });
          return res.status(201).json(mapJob(result.rows[0]));
        }
        throw e;
      }

      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      return res.status(201).json(mapJob(result.rows[0]));
    }

    // GET /api/jobs/stats/overview
    if (method === 'GET' && pathname === '/api/jobs/stats/overview') {
      const result = await client.execute('SELECT * FROM job WHERE archived = 0 OR archived IS NULL');
      const jobs = result.rows.map(mapJob);
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(j => j.currentStatus === 'Completed/Delivered').length;
      const awaitingApproval = jobs.filter(j => j.currentStatus === 'Awaiting Proof Approval').length;
      const overdueJobs = jobs.filter(j =>
        j.targetDate && new Date(String(j.targetDate)) < now && j.currentStatus !== 'Completed/Delivered'
      ).length;
      const jobsThisMonth = jobs.filter(j => String(j.createdAt) >= startOfMonth).length;

      const statusCounts = {};
      jobs.forEach(job => {
        const s = String(job.currentStatus);
        statusCounts[s] = (statusCounts[s] || 0) + 1;
      });
      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

      return res.status(200).json({ totalJobs, completedJobs, awaitingApproval, overdueJobs, jobsThisMonth, statusBreakdown });
    }

    // GET /api/jobs/:id
    if (method === 'GET' && pathname.startsWith('/api/jobs/') && pathname.split('/api/jobs/')[1]) {
      const id = pathname.split('/api/jobs/')[1];
      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json(mapJob(result.rows[0]));
    }

    // PUT /api/jobs/:id
    if (method === 'PUT' && pathname.startsWith('/api/jobs/') && pathname.split('/api/jobs/')[1]) {
      const id = pathname.split('/api/jobs/')[1];
      const data = body;
      const now = new Date().toISOString();

      const currentResult = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
      const currentJob = currentResult.rows[0];

      const fields = [];
      const args = [];

      const updatable = ['clientName', 'clientContact', 'jobDescription', 'orderDate', 'targetDate',
        'paymentDate', 'currentStatus', 'paymentStatus', 'assignedTo', 'proofLink', 'materialsNeeded', 'installationDate', 'notes'];

      for (const field of updatable) {
        if (field in data) {
          fields.push(`${field} = ?`);
          args.push(data[field]);
        }
      }

      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      // Auto-set startDate if orderDate is being set and startDate not explicitly provided
      if (data.orderDate !== undefined && !('startDate' in data)) {
        fields.push('startDate = ?');
        args.push(data.orderDate);
      }

      // Auto-archive on completion (only on first transition)
      if (data.currentStatus === 'Completed/Delivered' && mapStatus(currentJob.currentStatus) !== 'Completed/Delivered') {
        fields.push('finishDate = ?');
        fields.push('archived = ?');
        fields.push('archivedAt = ?');
        args.push(now, 1, now);
      }

      // Auto-unarchive if status moves away from completed on an archived job (only if status is being changed)
      if ('currentStatus' in data && data.currentStatus !== 'Completed/Delivered' && mapStatus(currentJob.currentStatus) === 'Completed/Delivered' && currentJob.archived === 1) {
        fields.push('archived = 0');
        fields.push('archivedAt = NULL');
      }

      fields.push('updatedAt = ?');
      args.push(now);
      args.push(id);

      await client.execute({ sql: `UPDATE job SET ${fields.join(', ')} WHERE id = ?`, args });
      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      return res.status(200).json(mapJob(result.rows[0]));
    }

    // PATCH /api/jobs/:id/status
    if (method === 'PATCH' && pathname.includes('/status')) {
      const id = pathname.split('/api/jobs/')[1].replace('/status', '');
      const { currentStatus } = body;
      const now = new Date().toISOString();

      const currentResult = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
      const currentJob = currentResult.rows[0];

      let updateSql = 'UPDATE job SET currentStatus = ?, updatedAt = ?';
      const updateArgs = [currentStatus, now];

      // Auto-archive on completion (only on first transition)
      if (currentStatus === 'Completed/Delivered' && mapStatus(currentJob.currentStatus) !== 'Completed/Delivered') {
        updateSql += ', finishDate = ?, archived = ?, archivedAt = ?';
        updateArgs.push(now, 1, now);
      }

      // Auto-unarchive if status moves away from completed on an archived job
      if (mapStatus(currentJob.currentStatus) === 'Completed/Delivered' && currentJob.archived === 1 && currentStatus !== 'Completed/Delivered') {
        updateSql += ', archived = 0, archivedAt = NULL';
      }

      updateSql += ' WHERE id = ?';
      updateArgs.push(id);

      await client.execute({ sql: updateSql, args: updateArgs });
      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      return res.status(200).json(mapJob(result.rows[0]));
    }

    // PATCH /api/jobs/:id/archive — idempotent with status guard
    if (method === 'PATCH' && pathname.includes('/archive')) {
      const id = pathname.split('/api/jobs/')[1].replace('/archive', '');
      const { archive } = body;
      const now = new Date().toISOString();

      const currentResult = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (currentResult.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
      const currentJob = currentResult.rows[0];

      // Only allow archiving completed jobs
      if (archive && mapStatus(currentJob.currentStatus) !== 'Completed/Delivered') {
        return res.status(400).json({ error: 'Only completed jobs can be archived' });
      }

      if (archive) {
        // Only set archivedAt if not already archived (idempotent)
        if (currentJob.archived !== 1) {
          await client.execute({
            sql: 'UPDATE job SET archived = 1, archivedAt = ?, updatedAt = ? WHERE id = ?',
            args: [now, now, id]
          });
        } else {
          // Already archived — just update updatedAt, preserve original archivedAt
          await client.execute({
            sql: 'UPDATE job SET updatedAt = ? WHERE id = ?',
            args: [now, id]
          });
        }
      } else {
        await client.execute({
          sql: 'UPDATE job SET archived = 0, archivedAt = NULL, updatedAt = ? WHERE id = ?',
          args: [now, id]
        });
      }

      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      return res.status(200).json(mapJob(result.rows[0]));
    }

    // DELETE /api/jobs/:id
    if (method === 'DELETE' && pathname.startsWith('/api/jobs/') && pathname.split('/api/jobs/')[1]) {
      const id = pathname.split('/api/jobs/')[1];
      await client.execute({ sql: 'DELETE FROM job WHERE id = ?', args: [id] });
      return res.status(200).json({ message: 'Job deleted' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

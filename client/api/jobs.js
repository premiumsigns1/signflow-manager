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
  await client.execute(`ALTER TABLE job ADD COLUMN sortOrder INTEGER DEFAULT 0`).catch(() => {});
}

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      displayId TEXT NOT NULL,
      clientName TEXT NOT NULL DEFAULT '',
      clientContact TEXT NOT NULL DEFAULT '',
      jobDescription TEXT NOT NULL DEFAULT '',
      orderDate TEXT NOT NULL,
      paymentDate TEXT,
      targetDate TEXT,
      currentStatus TEXT NOT NULL DEFAULT 'Quote/Pending',
      assignedTo TEXT,
      proofLink TEXT,
      materialsNeeded TEXT,
      installationDate TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

function generateId() {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
    await ensureColumns(client);

    const { method, url, body } = req;
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // GET /api/jobs or GET /api/jobs?status=...&search=...
    if (method === 'GET' && pathname === '/api/jobs') {
      let query = 'SELECT * FROM job WHERE 1=1';
      const args = [];

      const status = searchParams.get('status');
      const search = searchParams.get('search');

      if (status && status !== 'all') {
        // Map frontend status back to DB status for query
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

    // POST /api/jobs — write to 'job' table (legacy table name)
    if (method === 'POST' && pathname === '/api/jobs') {
      const data = body;
      const now = new Date().toISOString();
      const id = generateId();

      const countResult = await client.execute('SELECT displayId FROM job ORDER BY createdAt ASC');
      let maxNum = 0;
      for (const row of countResult.rows) {
        const num = parseInt(String(row.displayId).replace('SIGN-', ''));
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
      const displayId = `SIGN-${String(maxNum + 1).padStart(3, '0')}`;

      await client.execute({
        sql: `INSERT INTO job (id, displayId, clientName, clientContact, jobDescription, orderDate, paymentDate, targetDate, currentStatus, assignedTo, proofLink, materialsNeeded, installationDate, notes, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?)`,
        args: [
          id,
          displayId,
          data.clientName || '',
          data.clientContact || '',
          data.jobDescription || '',
          now,
          data.targetDate || null,
          'Quote/Pending',
          data.assignedTo || null,
          data.notes || null,
          now,
          now,
        ],
      });

      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      return res.status(201).json(mapJob(result.rows[0]));
    }

    // GET /api/jobs/stats/overview
    if (method === 'GET' && pathname === '/api/jobs/stats/overview') {
      const result = await client.execute('SELECT * FROM job');
      const jobs = result.rows;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const totalJobs = jobs.length;
      const completedJobs = jobs.filter(j => mapStatus(j.currentStatus) === 'Completed/Delivered').length;
      const awaitingApproval = jobs.filter(j => mapStatus(j.currentStatus) === 'Awaiting Proof Approval').length;
      const overdueJobs = jobs.filter(j =>
        j.targetDate && new Date(String(j.targetDate)) < now && mapStatus(j.currentStatus) !== 'Completed/Delivered'
      ).length;
      const jobsThisMonth = jobs.filter(j => String(j.createdAt) >= startOfMonth).length;

      const statusCounts = {};
      jobs.forEach(job => {
        const s = mapStatus(job.currentStatus);
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

      const fields = [];
      const args = [];

      const updatable = ['clientName', 'clientContact', 'jobDescription', 'targetDate', 'paymentDate',
        'currentStatus', 'paymentStatus', 'assignedTo', 'proofLink', 'materialsNeeded', 'installationDate', 'notes'];

      for (const field of updatable) {
        if (field in data) {
          fields.push(`${field} = ?`);
          args.push(data[field]);
        }
      }

      if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

      fields.push('updatedAt = ?');
      args.push(now);
      args.push(id);

      await client.execute({ sql: `UPDATE job SET ${fields.join(', ')} WHERE id = ?`, args });
      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
      return res.status(200).json(mapJob(result.rows[0]));
    }

    // PATCH /api/jobs/:id/status
    if (method === 'PATCH' && pathname.includes('/status')) {
      const id = pathname.split('/api/jobs/')[1].replace('/status', '');
      const { currentStatus } = body;
      const now = new Date().toISOString();
      await client.execute({ sql: 'UPDATE job SET currentStatus = ?, updatedAt = ? WHERE id = ?', args: [currentStatus, now, id] });
      const result = await client.execute({ sql: 'SELECT * FROM job WHERE id = ?', args: [id] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'Job not found' });
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

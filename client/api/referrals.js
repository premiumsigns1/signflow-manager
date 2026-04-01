import { createClient } from '@libsql/client/http';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function generateId() {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = getClient();

  try {
    const { method, url, body } = req;
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;

    // GET /api/referrals
    if (method === 'GET' && pathname === '/api/referrals') {
      const result = await client.execute('SELECT * FROM referral ORDER BY createdAt DESC');
      return res.status(200).json(result.rows);
    }

    // POST /api/referrals
    if (method === 'POST' && pathname === '/api/referrals') {
      const now = new Date().toISOString();
      const id = generateId();
      await client.execute({
        sql: `INSERT INTO referral (id, clientName, contact, description, subcontractor, status, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, body.clientName || '', body.contact || '', body.description || '', body.subcontractor || '', body.status || 'Pending', now, now],
      });
      const result = await client.execute({ sql: 'SELECT * FROM referral WHERE id = ?', args: [id] });
      return res.status(201).json(result.rows[0]);
    }

    // PATCH /api/referrals/:id
    if (method === 'PATCH' && pathname.startsWith('/api/referrals/')) {
      const id = pathname.split('/api/referrals/')[1];
      const now = new Date().toISOString();
      const fields = [];
      const args = [];
      for (const field of ['clientName', 'contact', 'description', 'subcontractor', 'status']) {
        if (field in body) { fields.push(`${field} = ?`); args.push(body[field]); }
      }
      if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });
      fields.push('updatedAt = ?'); args.push(now); args.push(id);
      await client.execute({ sql: `UPDATE referral SET ${fields.join(', ')} WHERE id = ?`, args });
      const result = await client.execute({ sql: 'SELECT * FROM referral WHERE id = ?', args: [id] });
      return res.status(200).json(result.rows[0]);
    }

    // DELETE /api/referrals/:id
    if (method === 'DELETE' && pathname.startsWith('/api/referrals/')) {
      const id = pathname.split('/api/referrals/')[1];
      await client.execute({ sql: 'DELETE FROM referral WHERE id = ?', args: [id] });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Referrals API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

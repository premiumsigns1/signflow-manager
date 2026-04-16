import { createClient } from '@libsql/client/http';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

function generateId() {
  return `todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function ensureTable(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS todo (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      priority TEXT NOT NULL DEFAULT 'medium',
      dueDate TEXT,
      sortOrder INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

async function ensureColumns(client) {
  const migrations = [
    `ALTER TABLE todo ADD COLUMN sortOrder INTEGER DEFAULT 0`,
    `ALTER TABLE todo ADD COLUMN dueDate TEXT`,
  ];

  for (const sql of migrations) {
    try {
      await client.execute(sql);
    } catch (e) {
      if (!e.message?.toLowerCase().includes('duplicate') && !e.message?.toLowerCase().includes('already exists')) {
        console.error('Todo migration failed:', sql, e.message);
      }
    }
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const client = getClient();

  try {
    await ensureTable(client);
    await ensureColumns(client);

    const { method, url, body } = req;
    const payload = body || {};
    const urlObj = new URL(url, `http://${req.headers.host}`);
    const pathname = urlObj.pathname;

    if (method === 'GET' && pathname === '/api/todos') {
      const result = await client.execute(`
        SELECT * FROM todo 
        ORDER BY 
          CASE WHEN sortOrder IS NULL THEN 1 ELSE 0 END,
          sortOrder ASC,
          createdAt DESC
      `);
      return res.status(200).json(result.rows);
    }

    if (method === 'POST' && pathname === '/api/todos') {
      const now = new Date().toISOString();
      const id = generateId();
      const maxResult = await client.execute({
        sql: 'SELECT MAX(sortOrder) as maxSort FROM todo WHERE status = ?',
        args: ['pending'],
      });
      const maxSort = Number(maxResult.rows[0]?.maxSort ?? -1);

      await client.execute({
        sql: `INSERT INTO todo (id, title, description, status, priority, dueDate, sortOrder, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          payload.title || '',
          payload.description || '',
          payload.status || 'pending',
          payload.priority || 'medium',
          payload.dueDate || null,
          maxSort + 1,
          now,
          now,
        ],
      });
      const result = await client.execute({ sql: 'SELECT * FROM todo WHERE id = ?', args: [id] });
      return res.status(201).json(result.rows[0]);
    }

    if (method === 'PATCH' && pathname.startsWith('/api/todos/')) {
      const id = pathname.split('/api/todos/')[1];
      const now = new Date().toISOString();
      const fields = [];
      const args = [];

      for (const field of ['title', 'description', 'status', 'priority', 'dueDate', 'sortOrder']) {
        if (field in payload) {
          fields.push(`${field} = ?`);
          args.push(payload[field]);
        }
      }

      if (!fields.length) return res.status(400).json({ error: 'Nothing to update' });

      fields.push('updatedAt = ?');
      args.push(now, id);
      await client.execute({ sql: `UPDATE todo SET ${fields.join(', ')} WHERE id = ?`, args });
      const result = await client.execute({ sql: 'SELECT * FROM todo WHERE id = ?', args: [id] });
      return res.status(200).json(result.rows[0]);
    }

    if (method === 'DELETE' && pathname.startsWith('/api/todos/')) {
      const id = pathname.split('/api/todos/')[1];
      await client.execute({ sql: 'DELETE FROM todo WHERE id = ?', args: [id] });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('Todos API error:', err);
    return res.status(500).json({ error: err.message || 'Failed to load todos' });
  }
}

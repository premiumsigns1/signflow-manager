import { createClient } from '@libsql/client/http';

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const client = getClient();

  try {
    // Ensure sortOrder column exists
    await client.execute(`ALTER TABLE job ADD COLUMN sortOrder INTEGER DEFAULT 0`).catch(() => {});

    const { orders } = req.body; // [{ id, sortOrder }, ...]
    if (!Array.isArray(orders)) return res.status(400).json({ error: 'orders must be an array' });

    const now = new Date().toISOString();
    for (const { id, sortOrder } of orders) {
      await client.execute({
        sql: 'UPDATE job SET sortOrder = ?, updatedAt = ? WHERE id = ?',
        args: [sortOrder, now, id],
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Reorder error:', err);
    return res.status(500).json({ error: err.message });
  }
}

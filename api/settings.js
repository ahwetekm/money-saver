import { db, getUserId } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT theme, currency FROM settings WHERE user_id = ?',
        args: [userId]
      });
      if (result.rows.length > 0) {
        return res.status(200).json(result.rows[0]);
      }
      return res.status(200).json({ theme: 'dark', currency: 'TRY' });
    }
    
    if (req.method === 'PUT') {
      const { theme, currency } = req.body;
      await db.execute({
        sql: `
          INSERT INTO settings (user_id, theme, currency) 
          VALUES (?, ?, ?)
          ON CONFLICT(user_id) DO UPDATE SET theme = excluded.theme, currency = excluded.currency
        `,
        args: [userId, theme, currency]
      });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}

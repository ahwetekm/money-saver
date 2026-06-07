import { db, getUserId } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const result = await db.execute({
        sql: 'SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC',
        args: [userId]
      });
      // Convert SQLite 1/0 back to boolean for recurring
      const transactions = result.rows.map(row => ({
        ...row,
        recurring: row.recurring === 1
      }));
      return res.status(200).json(transactions);
    }
    
    if (req.method === 'POST') {
      const { id, type, category, amount, description, date, mood, recurring, recurringInterval } = req.body;
      await db.execute({
        sql: 'INSERT INTO transactions (id, user_id, type, category, amount, description, date, mood, recurring, recurringInterval) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [id, userId, type, category, amount, description, date, mood || null, recurring ? 1 : 0, recurringInterval || null]
      });
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, type, category, amount, description, date, mood, recurring, recurringInterval } = req.body;
      await db.execute({
        sql: 'UPDATE transactions SET type = ?, category = ?, amount = ?, description = ?, date = ?, mood = ?, recurring = ?, recurringInterval = ? WHERE id = ? AND user_id = ?',
        args: [type, category, amount, description, date, mood || null, recurring ? 1 : 0, recurringInterval || null, id, userId]
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.execute({
        sql: 'DELETE FROM transactions WHERE id = ? AND user_id = ?',
        args: [id, userId]
      });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}

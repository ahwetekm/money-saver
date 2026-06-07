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
        sql: 'SELECT * FROM subscriptions WHERE user_id = ?',
        args: [userId]
      });
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'POST') {
      const { id, name, amount, nextPayment, interval, category } = req.body;
      await db.execute({
        sql: 'INSERT INTO subscriptions (id, user_id, name, amount, nextPayment, interval, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [id, userId, name, amount, nextPayment, interval, category]
      });
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, name, amount, nextPayment, interval, category } = req.body;
      await db.execute({
        sql: 'UPDATE subscriptions SET name = ?, amount = ?, nextPayment = ?, interval = ?, category = ? WHERE id = ? AND user_id = ?',
        args: [name, amount, nextPayment, interval, category, id, userId]
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.execute({
        sql: 'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
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

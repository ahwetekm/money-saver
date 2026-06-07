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
        sql: 'SELECT * FROM delayed_gratifications WHERE user_id = ?',
        args: [userId]
      });
      return res.status(200).json(result.rows);
    }
    
    if (req.method === 'POST') {
      const { id, itemName, amount, alternativeInvestment, projectedValue, createdAt, waitUntil, status } = req.body;
      await db.execute({
        sql: 'INSERT INTO delayed_gratifications (id, user_id, itemName, amount, alternativeInvestment, projectedValue, createdAt, waitUntil, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        args: [id, userId, itemName, amount, alternativeInvestment, projectedValue, createdAt, waitUntil, status]
      });
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, itemName, amount, alternativeInvestment, projectedValue, createdAt, waitUntil, status } = req.body;
      await db.execute({
        sql: 'UPDATE delayed_gratifications SET itemName = ?, amount = ?, alternativeInvestment = ?, projectedValue = ?, createdAt = ?, waitUntil = ?, status = ? WHERE id = ? AND user_id = ?',
        args: [itemName, amount, alternativeInvestment, projectedValue, createdAt, waitUntil, status, id, userId]
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.execute({
        sql: 'DELETE FROM delayed_gratifications WHERE id = ? AND user_id = ?',
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

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
        sql: 'SELECT * FROM goals WHERE user_id = ?',
        args: [userId]
      });
      const goals = result.rows.map(row => ({
        ...row,
        linkedAssets: row.linkedAssets ? JSON.parse(row.linkedAssets) : []
      }));
      return res.status(200).json(goals);
    }
    
    if (req.method === 'POST') {
      const { id, name, targetAmount, currentAmount, deadline, icon, linkedAssets } = req.body;
      await db.execute({
        sql: 'INSERT INTO goals (id, user_id, name, targetAmount, currentAmount, deadline, icon, linkedAssets) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [id, userId, name, targetAmount, currentAmount, deadline, icon, JSON.stringify(linkedAssets || [])]
      });
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, name, targetAmount, currentAmount, deadline, icon, linkedAssets } = req.body;
      await db.execute({
        sql: 'UPDATE goals SET name = ?, targetAmount = ?, currentAmount = ?, deadline = ?, icon = ?, linkedAssets = ? WHERE id = ? AND user_id = ?',
        args: [name, targetAmount, currentAmount, deadline, icon, JSON.stringify(linkedAssets || []), id, userId]
      });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.execute({
        sql: 'DELETE FROM goals WHERE id = ? AND user_id = ?',
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

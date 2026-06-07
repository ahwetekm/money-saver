import { db, getUserId } from './db.js';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'PUT') {
      const { email, password } = req.body;
      
      if (email) {
        const existing = await db.execute({ 
          sql: 'SELECT id FROM users WHERE email = ? AND id != ?', 
          args: [email, userId] 
        });
        if (existing.rows.length > 0) {
          return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda' });
        }
        await db.execute({ 
          sql: 'UPDATE users SET email = ? WHERE id = ?', 
          args: [email, userId] 
        });
      }
      
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute({ 
          sql: 'UPDATE users SET password = ? WHERE id = ?', 
          args: [hashedPassword, userId] 
        });
      }
      
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const stmts = [
        { sql: 'DELETE FROM transactions WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM budgets WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM portfolio_transactions WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM portfolio_items WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM goals WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM subscriptions WHERE user_id = ?', args: [userId] },
        { sql: 'DELETE FROM delayed_gratifications WHERE user_id = ?', args: [userId] }
      ];
      
      await db.batch(stmts, 'write');
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}

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
      const itemsResult = await db.execute({
        sql: 'SELECT * FROM portfolio_items WHERE user_id = ?',
        args: [userId]
      });
      
      const txResult = await db.execute({
        sql: 'SELECT * FROM portfolio_transactions WHERE user_id = ?',
        args: [userId]
      });

      const items = itemsResult.rows.map(item => ({
        ...item,
        transactions: txResult.rows.filter(tx => tx.portfolio_item_id === item.id)
      }));

      return res.status(200).json(items);
    }
    
    if (req.method === 'POST') {
      const { id, symbol, name, type, quantity, averageCost, currentPrice, transactions } = req.body;
      
      await db.execute({
        sql: 'INSERT INTO portfolio_items (id, user_id, symbol, name, type, quantity, averageCost, currentPrice) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [id, userId, symbol, name, type, quantity, averageCost, currentPrice]
      });

      if (transactions && transactions.length > 0) {
        for (const tx of transactions) {
          await db.execute({
            sql: 'INSERT INTO portfolio_transactions (id, user_id, portfolio_item_id, type, quantity, price, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [tx.id, userId, id, tx.type, tx.quantity, tx.price, tx.date]
          });
        }
      }
      
      return res.status(201).json({ success: true });
    }

    if (req.method === 'PUT') {
      const { id, symbol, name, type, quantity, averageCost, currentPrice, transactions } = req.body;
      
      await db.execute({
        sql: 'UPDATE portfolio_items SET symbol = ?, name = ?, type = ?, quantity = ?, averageCost = ?, currentPrice = ? WHERE id = ? AND user_id = ?',
        args: [symbol, name, type, quantity, averageCost, currentPrice, id, userId]
      });

      // Update transactions: for simplicity, delete all and re-insert
      await db.execute({
        sql: 'DELETE FROM portfolio_transactions WHERE portfolio_item_id = ? AND user_id = ?',
        args: [id, userId]
      });

      if (transactions && transactions.length > 0) {
        for (const tx of transactions) {
          await db.execute({
            sql: 'INSERT INTO portfolio_transactions (id, user_id, portfolio_item_id, type, quantity, price, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            args: [tx.id, userId, id, tx.type, tx.quantity, tx.price, tx.date]
          });
        }
      }

      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await db.execute({
        sql: 'DELETE FROM portfolio_items WHERE id = ? AND user_id = ?',
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

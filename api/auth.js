import { db } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    '[CRITICAL] JWT_SECRET environment variable is not set. ' +
    'Please create a .env file in the project root. See .env.example for reference.'
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    if (action === 'register') {
      // Check if user exists
      const existingUser = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });

      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already in use' });
      }

      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      await db.execute({
        sql: 'INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)',
        args: [id, email, hashedPassword, name || '']
      });

      // Initialize default settings
      await db.execute({
        sql: 'INSERT INTO settings (user_id, theme, currency) VALUES (?, ?, ?)',
        args: [id, 'dark', 'TRY']
      });

      const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(201).json({ token, user: { id, email, name: name || '' } });
    } 
    
    if (action === 'login') {
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ?',
        args: [email]
      });

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name || '' } });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

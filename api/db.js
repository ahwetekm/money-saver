import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://<YOUR_TURSO_DATABASE_URL>',
  authToken: process.env.TURSO_AUTH_TOKEN || '<YOUR_TURSO_AUTH_TOKEN>'
});

export function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    // In a real app we'd verify a JWT here. 
    // For this simple implementation where "direkt veritabanıyla eşleşen kayıt/giriş yapsın"
    // we'll just use the token as the user_id if it's a simple UUID, or verify JWT.
    // Let's use JWT.
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '<YOUR_JWT_SECRET>');
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

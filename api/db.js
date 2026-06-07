import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://money-saver-ahwetekm.aws-eu-west-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJleHAiOjE3ODA4ODU2NTgsImlhdCI6MTc4MDc5OTI1OCwiaWQiOiIwMTllOWZlNi04MTAxLTdiMTItOTY2Mi0yYWNhOWIxMmFjYWIiLCJyaWQiOiI1ZWNhNGI4ZC1kNWMxLTQxZmEtYTAzMS1kODQ0NWNhYTY0YTAifQ.-RgrFw6BzrQTpEmDtE73p8Hf6in-ffOKc4MWMksgubfc0PLbHuuEHcU_rpD6fEFeH-ShV209Y7joW19rizgDCA'
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super-secret-key-for-money-saver');
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

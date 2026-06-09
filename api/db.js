import { createClient } from '@libsql/client';
import jwt from 'jsonwebtoken';

// ─── Environment Variable Validation (Fail-Fast on Startup) ───
const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

if (!TURSO_DATABASE_URL) {
  throw new Error(
    '[CRITICAL] TURSO_DATABASE_URL environment variable is not set. ' +
    'Please create a .env file in the project root. See .env.example for reference.'
  );
}
if (!TURSO_AUTH_TOKEN) {
  throw new Error(
    '[CRITICAL] TURSO_AUTH_TOKEN environment variable is not set. ' +
    'Please create a .env file in the project root. See .env.example for reference.'
  );
}
if (!JWT_SECRET) {
  throw new Error(
    '[CRITICAL] JWT_SECRET environment variable is not set. ' +
    'Please create a .env file in the project root. See .env.example for reference.'
  );
}

export const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN
});

export function getUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

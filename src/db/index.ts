import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const isProduction =
  (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') &&
  !process.env.DATABASE_URL?.includes('localhost') &&
  !process.env.DATABASE_URL?.includes('127.0.0.1');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);
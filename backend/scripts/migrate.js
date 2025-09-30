#!/usr/bin/env node
import pool from '../src/db.js';

const sql = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
`;

async function run() {
  try {
    await pool.query(sql);
    console.log('Migration applied: users + refresh_tokens tables');
  } catch (e) {
    console.error('Migration failed', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();

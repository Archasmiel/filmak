import { Pool } from 'pg';

// Simple Postgres pool using DATABASE_URL env var
// Keep configuration minimal for local development and Docker Compose
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;

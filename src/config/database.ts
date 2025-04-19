import { Pool } from 'pg';

// Use import.meta.env for Vite environment variables
const pool = new Pool({
  user: import.meta.env.VITE_POSTGRES_USER || 'postgres',
  password: import.meta.env.VITE_POSTGRES_PASSWORD,
  host: import.meta.env.VITE_POSTGRES_HOST || 'localhost',
  port: Number(import.meta.env.VITE_POSTGRES_PORT) || 5432,
  database: import.meta.env.VITE_POSTGRES_DB || 'hotspot_billing'
});

export default pool;
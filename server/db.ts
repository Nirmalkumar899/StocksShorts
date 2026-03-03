import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - database operations will be limited");
}

let connection: postgres.Sql | null = null;
let db: any = null;

// Initialize database connection
if (process.env.DATABASE_URL) {
  try {
    // using postgres.js instead of neon serverless for universal database support
    connection = postgres(process.env.DATABASE_URL, { max: 10 });
    db = drizzle(connection, { schema });

    console.log('Database connection initialized successfully');
  } catch (err) {
    console.error('Database initialization failed:', err);
    // Continue without database for non-critical features
  }
}

export { connection as pool, db };

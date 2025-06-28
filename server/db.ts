import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Only configure WebSocket in production/serverless environment
if (process.env.NODE_ENV === 'production' || process.env.NEON_SERVERLESS) {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - database operations will be limited");
}

let pool: Pool | null = null;
let db: any = null;

// Initialize database connection with error handling
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    db = drizzle({ client: pool, schema });

    // Handle pool errors gracefully
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });

    // Test connection after a delay to avoid blocking startup
    setTimeout(async () => {
      try {
        if (pool) {
          const client = await pool.connect();
          console.log('Database connected successfully');
          client.release();
        }
      } catch (err) {
        console.error('Database connection test failed:', err);
      }
    }, 3000);
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
}

export { pool, db };

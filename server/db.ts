import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket for Neon with better error handling
try {
  neonConfig.webSocketConstructor = ws;
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
  neonConfig.poolQueryViaFetch = true;
} catch (error) {
  console.warn('WebSocket configuration failed, will use fallback mode:', error);
}

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - database operations will be limited");
}

let pool: Pool | null = null;
let db: any = null;

// Initialize database connection with fallback handling
if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 3000,
    });

    db = drizzle({ client: pool, schema });

    // Handle pool errors gracefully without crashing
    pool.on('error', (err) => {
      console.warn('Database pool warning:', err.message);
    });

    console.log('Database pool initialized');
  } catch (err) {
    console.error('Database initialization failed:', err);
    // Continue without database for non-critical features
  }
}

export { pool, db };

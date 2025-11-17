import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";

// Configure Neon for WebSocket
neonConfig.fetchConnectionCache = true;

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;

    // Allow missing DATABASE_URL during build time
    if (!connectionString) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error("DATABASE_URL environment variable is not set");
      }
      // Return a dummy DB for build time
      console.warn("DATABASE_URL not set - using dummy database for build");
      return null as any;
    }

    const pool = new Pool({ connectionString });
    db = drizzle(pool, { schema });
  }

  return db;
}

export { schema };

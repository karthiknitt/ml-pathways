import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/db";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    const db = getDb();

    // If no database during build, return a dummy auth instance
    if (!db) {
      return null as any;
    }

    authInstance = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
      }),
      emailAndPassword: {
        enabled: true,
      },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID || "",
          clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
          enabled: !!process.env.GITHUB_CLIENT_ID,
        },
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          enabled: !!process.env.GOOGLE_CLIENT_ID,
        },
      },
    });
  }

  return authInstance;
}

// For compatibility
export const auth = new Proxy({} as any, {
  get: (target, prop) => {
    const authInstance = getAuth();
    return authInstance?.[prop as keyof typeof authInstance];
  }
});

export type Session = any; // Will be properly typed when auth is initialized

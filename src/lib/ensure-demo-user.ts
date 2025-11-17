import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

const DEMO_USER_ID = "demo-user";
const DEMO_USER_EMAIL = "demo@mlpathways.local";
const DEMO_USER_NAME = "Demo User";

let demoUserChecked = false;

/**
 * Ensures the demo user exists in the database.
 * This is called automatically by API routes that need a user.
 */
export async function ensureDemoUser(): Promise<string> {
  // Skip if already checked in this process
  if (demoUserChecked) {
    return DEMO_USER_ID;
  }

  try {
    const database = db();
    if (!database) {
      throw new Error("Database not available");
    }

    // Check if demo user exists
    const existingUser = await database
      .select()
      .from(user)
      .where(eq(user.id, DEMO_USER_ID))
      .limit(1);

    if (existingUser.length === 0) {
      // Create demo user
      console.log("Creating demo user...");
      await database.insert(user).values({
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        name: DEMO_USER_NAME,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log("Demo user created successfully");
    }

    demoUserChecked = true;
    return DEMO_USER_ID;
  } catch (error) {
    console.error("Error ensuring demo user:", error);
    throw error;
  }
}

/**
 * Get the demo user ID (use this in API routes)
 */
export function getDemoUserId(): string {
  return DEMO_USER_ID;
}

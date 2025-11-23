import { neon } from '@neondatabase/serverless';

let dbClient: ReturnType<typeof neon> | null = null;

export function getTestDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set for tests');
  }

  if (!dbClient) {
    dbClient = neon(process.env.DATABASE_URL);
  }

  return dbClient;
}

export async function cleanupTestData(email?: string) {
  const sql = getTestDb();

  try {
    if (email) {
      // Clean up specific user's data
      const result: any = await sql`SELECT id FROM "user" WHERE email = ${email}`;
      if (Array.isArray(result) && result.length > 0) {
        const userId = result[0].id;

        // Delete in order of dependencies
        await sql`DELETE FROM "chatMessages" WHERE "experimentId" IN (SELECT id FROM experiments WHERE "userId" = ${userId})`;
        await sql`DELETE FROM "executions" WHERE "experimentId" IN (SELECT id FROM experiments WHERE "userId" = ${userId})`;
        await sql`DELETE FROM "edaResults" WHERE "experimentId" IN (SELECT id FROM experiments WHERE "userId" = ${userId})`;
        await sql`DELETE FROM experiments WHERE "userId" = ${userId}`;
        await sql`DELETE FROM datasets WHERE "userId" = ${userId}`;
        await sql`DELETE FROM session WHERE "userId" = ${userId}`;
        await sql`DELETE FROM account WHERE "userId" = ${userId}`;
        await sql`DELETE FROM verification WHERE identifier = ${email}`;
        await sql`DELETE FROM "user" WHERE id = ${userId}`;
      }
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

export async function createTestUser(email: string, password: string, name: string = 'Test User') {
  const sql = getTestDb();

  // Check if user exists
  const existing: any = await sql`SELECT id FROM "user" WHERE email = ${email}`;
  if (Array.isArray(existing) && existing.length > 0) {
    return existing[0].id;
  }

  // Create user (BetterAuth will handle password hashing in the app)
  const result: any = await sql`
    INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
    VALUES (gen_random_uuid()::text, ${email}, ${name}, true, NOW(), NOW())
    RETURNING id
  `;

  if (Array.isArray(result) && result.length > 0) {
    return result[0].id;
  }

  throw new Error('Failed to create test user');
}

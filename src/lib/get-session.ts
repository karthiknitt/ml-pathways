import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
  session: {
    token: string;
    expiresAt: Date;
  };
}

/**
 * Get the current authenticated user from the request.
 * Returns the session if authenticated, or null if not.
 *
 * Usage in API routes:
 * ```ts
 * const session = await getSession(request);
 * if (!session) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * const userId = session.user.id;
 * ```
 */
export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  try {
    const auth = getAuth();
    if (!auth) {
      console.error("Auth instance not available");
      return null;
    }

    // Get session from BetterAuth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    return session as AuthSession | null;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user ID from the request.
 * Throws an error if not authenticated.
 *
 * Usage in API routes:
 * ```ts
 * try {
 *   const userId = await requireAuth(request);
 *   // userId is guaranteed to exist here
 * } catch (error) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function requireAuth(request: NextRequest): Promise<string> {
  const session = await getSession(request);

  if (!session?.user?.id) {
    throw new Error("Unauthorized: No valid session");
  }

  return session.user.id;
}

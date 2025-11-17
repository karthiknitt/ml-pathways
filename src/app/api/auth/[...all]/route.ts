import { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let handlers: ReturnType<typeof toNextJsHandler> | null = null;

function getHandlers() {
  if (!handlers) {
    const auth = getAuth();
    if (!auth) {
      throw new Error("Auth not initialized - DATABASE_URL may be missing");
    }
    handlers = toNextJsHandler(auth);
  }
  return handlers;
}

export async function GET(request: NextRequest) {
  const { GET: handler } = getHandlers();
  return handler(request);
}

export async function POST(request: NextRequest) {
  const { POST: handler } = getHandlers();
  return handler(request);
}

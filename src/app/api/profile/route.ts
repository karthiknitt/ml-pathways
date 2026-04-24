import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user, experiments, datasets } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { z } from "zod";

export async function GET(request: NextRequest) {
  const database = db();
  if (!database) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [profileRows, experimentCountRows, datasetCountRows] = await Promise.all([
    database.select().from(user).where(eq(user.id, userId)).limit(1),
    database.select({ count: count() }).from(experiments).where(eq(experiments.userId, userId)),
    database.select({ count: count() }).from(datasets).where(eq(datasets.userId, userId)),
  ]);

  if (profileRows.length === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const profile = profileRows[0];
  return NextResponse.json({
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      image: profile.image,
      createdAt: profile.createdAt,
    },
    stats: {
      experimentCount: experimentCountRows[0]?.count ?? 0,
      datasetCount: datasetCountRows[0]?.count ?? 0,
    },
  });
}

const patchSchema = z.object({
  name: z.string().min(1).max(100),
});

export async function PATCH(request: NextRequest) {
  const database = db();
  if (!database) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.issues }, { status: 400 });
  }

  await database
    .update(user)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}

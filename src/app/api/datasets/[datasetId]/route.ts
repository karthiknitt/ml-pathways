import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

// DELETE /api/datasets/[datasetId] - Delete a dataset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  try {
    const { datasetId } = await params;
    const database = db();
    if (!database) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership before deleting
    const [existing] = await database
      .select({ id: datasets.id, userId: datasets.userId })
      .from(datasets)
      .where(eq(datasets.id, datasetId));

    if (!existing) {
      return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await database.delete(datasets).where(eq(datasets.id, datasetId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Failed to delete dataset:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete dataset" },
      { status: 500 }
    );
  }
}

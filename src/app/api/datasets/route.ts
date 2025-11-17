import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { datasets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

// GET /api/datasets - Get all datasets for the current user
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view datasets." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const userDatasets = await db()
      .select()
      .from(datasets)
      .where(eq(datasets.userId, userId))
      .orderBy(desc(datasets.createdAt));

    return NextResponse.json({ datasets: userDatasets });
  } catch (error: any) {
    console.error("Failed to fetch datasets:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch datasets" },
      { status: 500 }
    );
  }
}

// POST /api/datasets - Create a new dataset record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      source,
      fileUrl,
      fileName,
      fileSize,
      columnInfo,
      rowCount,
    } = body;

    // Validation
    if (!name || !source) {
      return NextResponse.json(
        { error: "Name and source are required" },
        { status: 400 }
      );
    }

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create datasets." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const [newDataset] = await db()
      .insert(datasets)
      .values({
        userId,
        name,
        description: description || null,
        source,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileSize: fileSize || null,
        columnInfo: columnInfo || null,
        rowCount: rowCount || null,
      })
      .returning();

    return NextResponse.json({ dataset: newDataset }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create dataset:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create dataset" },
      { status: 500 }
    );
  }
}

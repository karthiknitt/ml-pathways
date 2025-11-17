import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, datasets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/experiments - Get all experiments for the current user
export async function GET(request: NextRequest) {
  try {
    // TODO: Get userId from session
    const userId = "demo-user"; // Placeholder until auth is fully wired

    // Check database connection
    const database = db();
    if (!database) {
      return NextResponse.json(
        { error: "Database not configured. Please set DATABASE_URL environment variable." },
        { status: 503 }
      );
    }

    const userExperiments = await database
      .select({
        id: experiments.id,
        name: experiments.name,
        description: experiments.description,
        problemType: experiments.problemType,
        configuration: experiments.configuration,
        createdAt: experiments.createdAt,
        updatedAt: experiments.updatedAt,
        dataset: {
          id: datasets.id,
          name: datasets.name,
        },
      })
      .from(experiments)
      .leftJoin(datasets, eq(experiments.datasetId, datasets.id))
      .where(eq(experiments.userId, userId))
      .orderBy(desc(experiments.updatedAt));

    return NextResponse.json({ experiments: userExperiments });
  } catch (error: any) {
    console.error("Failed to fetch experiments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch experiments" },
      { status: 500 }
    );
  }
}

// POST /api/experiments - Create a new experiment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, problemType, datasetId, configuration } = body;

    console.log("Creating experiment with:", { name, description, problemType, datasetId });

    // Validation
    if (!name || !problemType) {
      return NextResponse.json(
        { error: "Name and problem type are required" },
        { status: 400 }
      );
    }

    // Check database connection
    const database = db();
    if (!database) {
      console.error("Database not available - DATABASE_URL not set");
      return NextResponse.json(
        { error: "Database not configured. Please set DATABASE_URL in your .env file and restart the server." },
        { status: 503 }
      );
    }

    // TODO: Get userId from session
    const userId = "demo-user"; // Placeholder until auth is fully wired

    const [newExperiment] = await database
      .insert(experiments)
      .values({
        userId,
        name,
        description,
        problemType,
        datasetId: datasetId || null,
        configuration: configuration || {},
      })
      .returning();

    console.log("Experiment created:", newExperiment);
    return NextResponse.json({ experiment: newExperiment }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create experiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create experiment" },
      { status: 500 }
    );
  }
}

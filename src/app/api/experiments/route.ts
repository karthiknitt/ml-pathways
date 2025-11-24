import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, datasets } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/get-session";
import { SAMPLE_DATASET_FILES, getProblemById } from "@/lib/constants/ml-problems";
import type { MLProblemType } from "@/lib/constants/ml-problems";
import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";

// GET /api/experiments - Get all experiments for the current user
export async function GET(request: NextRequest) {
  try {
    // Check database connection
    const database = db();
    if (!database) {
      return NextResponse.json(
        { error: "Database not configured. Please set DATABASE_URL environment variable." },
        { status: 503 }
      );
    }

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to view experiments." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

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

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to create experiments." },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // If no datasetId is provided, create a sample dataset
    let finalDatasetId = datasetId;
    if (!datasetId) {
      console.log("No datasetId provided, creating sample dataset for problem type:", problemType);

      // Get the sample dataset file path for this problem type
      const sampleFilePath = SAMPLE_DATASET_FILES[problemType as MLProblemType];
      const problem = getProblemById(problemType as MLProblemType);

      if (sampleFilePath && problem) {
        // Read and analyze the sample CSV file
        let columnInfo = null;
        let rowCount = null;
        let fileSize = null;

        try {
          // Read the file from the filesystem
          const filePath = path.join(process.cwd(), "src/lib", sampleFilePath);
          const fileContent = await fs.readFile(filePath, "utf-8");
          const stats = await fs.stat(filePath);
          fileSize = stats.size;

          // Parse CSV to get column info and row count
          const parseResult = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
          });

          if (parseResult.data && parseResult.meta.fields) {
            rowCount = parseResult.data.length;
            columnInfo = parseResult.meta.fields;
            console.log(`Analyzed sample dataset: ${rowCount} rows, ${columnInfo.length} columns`);
          }
        } catch (error) {
          console.error("Error analyzing sample dataset:", error);
          // Continue with null values if analysis fails
        }

        // Create a dataset record for the sample data
        const [sampleDataset] = await database
          .insert(datasets)
          .values({
            userId,
            name: `Sample Dataset - ${problem.name}`,
            description: problem.sampleDatasetDescription,
            source: "sample" as const,
            fileUrl: sampleFilePath,
            fileName: sampleFilePath.split("/").pop() || "sample.csv",
            fileSize,
            columnInfo,
            rowCount,
          })
          .returning();

        finalDatasetId = sampleDataset.id;
        console.log("Sample dataset created:", sampleDataset);
      } else {
        console.warn("No sample dataset file found for problem type:", problemType);
      }
    }

    const [newExperiment] = await database
      .insert(experiments)
      .values({
        userId,
        name,
        description,
        problemType,
        datasetId: finalDatasetId || null,
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

import { NextRequest, NextResponse } from "next/server";
import { performEDA } from "@/lib/eda/analyzer";
import { db } from "@/db";
import { edaResults, datasets } from "@/db/schema";
import { eq } from "drizzle-orm";

// POST /api/eda - Perform exploratory data analysis on a dataset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datasetId, dataUrl } = body;

    if (!dataUrl) {
      return NextResponse.json(
        { error: "Dataset URL is required" },
        { status: 400 }
      );
    }

    // Fetch the dataset content
    let csvContent: string;

    if (dataUrl.startsWith("data:")) {
      // Handle data URL
      const base64Data = dataUrl.split(",")[1];
      csvContent = Buffer.from(base64Data, "base64").toString("utf-8");
    } else {
      // Handle regular URL
      const response = await fetch(dataUrl);
      csvContent = await response.text();
    }

    // Perform EDA
    const analysis = await performEDA(csvContent);

    // If datasetId is provided, save results to database
    if (datasetId) {
      const [edaRecord] = await db()
        .insert(edaResults)
        .values({
          datasetId,
          statistics: analysis as any,
          correlations: {},
          distributions: {},
          missingValues: {},
          outliers: {},
        })
        .returning();

      return NextResponse.json({
        success: true,
        analysis,
        edaId: edaRecord.id,
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("EDA error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform EDA" },
      { status: 500 }
    );
  }
}

// GET /api/eda?datasetId=xxx - Get existing EDA results for a dataset
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const datasetId = searchParams.get("datasetId");

    if (!datasetId) {
      return NextResponse.json(
        { error: "Dataset ID is required" },
        { status: 400 }
      );
    }

    const results = await db()
      .select()
      .from(edaResults)
      .where(eq(edaResults.datasetId, datasetId))
      .orderBy(edaResults.createdAt);

    return NextResponse.json({
      results: results.length > 0 ? results[results.length - 1] : null,
    });
  } catch (error: any) {
    console.error("Failed to fetch EDA results:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch EDA results" },
      { status: 500 }
    );
  }
}

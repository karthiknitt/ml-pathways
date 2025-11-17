import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { experiments, executions, chatMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/get-session";

// GET /api/experiments/[experimentId] - Get a specific experiment with its details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const [experiment] = await db()
      .select()
      .from(experiments)
      .where(eq(experiments.id, experimentId));

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (experiment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You don't have access to this experiment." },
        { status: 403 }
      );
    }

    // Get related executions
    const experimentExecutions = await db()
      .select()
      .from(executions)
      .where(eq(executions.experimentId, experimentId))
      .orderBy(desc(executions.createdAt));

    // Get chat history
    const messages = await db()
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.experimentId, experimentId))
      .orderBy(desc(chatMessages.createdAt));

    return NextResponse.json({
      experiment,
      executions: experimentExecutions,
      messages,
    });
  } catch (error: any) {
    console.error("Failed to fetch experiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch experiment" },
      { status: 500 }
    );
  }
}

// PATCH /api/experiments/[experimentId] - Update an experiment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;
    const body = await request.json();

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }
    const { name, description, configuration } = body;

    const updateData: any = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (configuration) updateData.configuration = configuration;

    const [updatedExperiment] = await db()
      .update(experiments)
      .set(updateData)
      .where(eq(experiments.id, experimentId))
      .returning();

    if (!updatedExperiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ experiment: updatedExperiment });
  } catch (error: any) {
    console.error("Failed to update experiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update experiment" },
      { status: 500 }
    );
  }
}

// DELETE /api/experiments/[experimentId] - Delete an experiment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ experimentId: string }> }
) {
  try {
    const { experimentId } = await params;

    // Get authenticated user
    const session = await getSession(request);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Verify ownership before deleting
    const [experiment] = await db()
      .select()
      .from(experiments)
      .where(eq(experiments.id, experimentId));

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    if (experiment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You don't have access to this experiment." },
        { status: 403 }
      );
    }

    await db().delete(experiments).where(eq(experiments.id, experimentId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete experiment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete experiment" },
      { status: 500 }
    );
  }
}

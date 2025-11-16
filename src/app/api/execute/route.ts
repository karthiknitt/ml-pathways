import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, datasetUrl } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Code is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.E2B_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        status: "error",
        output: "⚠️ Sandboxed execution is not configured.\n\nTo enable code execution:\n1. Sign up at https://e2b.dev\n2. Get your API key\n3. Add E2B_API_KEY to your .env file\n4. Restart the application\n\nFor now, you can copy the generated code and run it locally.",
        error: null,
        charts: [],
        logs: [],
      });
    }

    // Try to execute with E2B
    try {
      // Dynamically import to handle cases where package might not be installed correctly
      const e2bModule = await import("@e2b/code-interpreter");

      // The package exports might vary, try different approaches
      const Sandbox = (e2bModule as any).Sandbox ||
                     (e2bModule as any).CodeInterpreter ||
                     (e2bModule as any).default;

      if (!Sandbox) {
        throw new Error("E2B module not properly loaded");
      }

      const sandbox = await Sandbox.create({ apiKey });

      try {
        // If dataset URL is provided, download it first
        if (datasetUrl) {
          await sandbox.notebook.execCell(`
import requests
import pandas as pd
from io import StringIO

# Download dataset
response = requests.get('${datasetUrl}')
df = pd.read_csv(StringIO(response.text))
print(f"Dataset loaded: {df.shape[0]} rows, {df.shape[1]} columns")
`);
        }

        // Execute the user code
        const execution = await sandbox.notebook.execCell(code);

        // Collect results
        const output = {
          text: execution.text || "",
          results: execution.results,
          error: execution.error,
          logs: execution.logs,
        };

        // Get any plots/visualizations
        const charts = (execution.results || [])
          .filter((result: any) => result.png || result.svg)
          .map((result: any) => ({
            type: result.png ? "png" : "svg",
            data: result.png || result.svg,
          }));

        await sandbox.close();

        return NextResponse.json({
          status: execution.error ? "error" : "success",
          output: output.text,
          error: execution.error?.value || null,
          charts,
          logs: execution.logs || [],
        });
      } catch (error) {
        await sandbox.close();
        throw error;
      }
    } catch (e2bError: any) {
      console.error("E2B execution error:", e2bError);
      return NextResponse.json({
        status: "error",
        output: `Failed to execute code: ${e2bError.message}\n\nThis might be due to E2B configuration issues. Please check your API key and network connection.`,
        error: e2bError.message,
        charts: [],
        logs: [],
      });
    }
  } catch (error: any) {
    console.error("Execution error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to execute code",
        status: "error",
      },
      { status: 500 }
    );
  }
}

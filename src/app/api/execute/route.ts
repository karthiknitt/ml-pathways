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
      // Import the Sandbox class from E2B
      const { Sandbox } = await import("@e2b/code-interpreter");

      if (!Sandbox) {
        throw new Error("E2B module not properly loaded");
      }

      const sandbox = await Sandbox.create({ apiKey });

      try {
        let verifyResult: any = null;

        // If dataset URL is provided, download and save it as a CSV file
        if (datasetUrl) {
          let csvContent = "";

          // Download the dataset content
          if (datasetUrl.startsWith("data:")) {
            // Handle data URL (base64 encoded)
            const base64Data = datasetUrl.split(",")[1];
            csvContent = Buffer.from(base64Data, "base64").toString("utf-8");
          } else {
            // Handle regular URL
            const response = await fetch(datasetUrl);
            csvContent = await response.text();
          }

          // Write the CSV file to the sandbox filesystem (in the working directory)
          await sandbox.files.write("data.csv", csvContent);

          // Verify the file was created and print debug info
          verifyResult = await sandbox.runCode(`
import pandas as pd
import os

# Debug: Show current working directory and list files
print("Current working directory:", os.getcwd())
print("Files in current directory:", os.listdir('.'))

# Verify data.csv exists and load it
if os.path.exists('data.csv'):
    df_temp = pd.read_csv('data.csv')
    print(f"✓ Dataset loaded successfully: {df_temp.shape[0]} rows, {df_temp.shape[1]} columns")
    print(f"✓ Columns: {list(df_temp.columns)}")
    del df_temp
else:
    print("✗ ERROR: data.csv not found!")
    print("Available files:", os.listdir('.'))
`);

          console.log("Dataset verification:", verifyResult.text);
        }

        // Execute the user code
        const execution = await sandbox.runCode(code);

        // Collect results
        let output = "";

        // Include verification output if dataset was loaded
        if (datasetUrl && verifyResult) {
          output += verifyResult.text + "\n\n" + "=".repeat(50) + "\n\n";
        }

        output += execution.text || "";

        const hasError = execution.error !== null && execution.error !== undefined;

        // Get any plots/visualizations
        const charts = (execution.results || [])
          .filter((result: any) => result.png || result.svg)
          .map((result: any) => ({
            type: result.png ? "png" : "svg",
            data: result.png || result.svg,
          }));

        // Use kill() instead of close() in E2B v1.5.x
        await sandbox.kill();

        return NextResponse.json({
          status: hasError ? "error" : "success",
          output: output,
          error: execution.error?.value || execution.error?.name || null,
          charts,
          logs: execution.logs || [],
        });
      } catch (error) {
        // Ensure sandbox is killed even on error
        await sandbox.kill();
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

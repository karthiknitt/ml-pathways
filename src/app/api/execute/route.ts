import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/db";
import { executions } from "@/db/schema";

type E2BResult = {
  png?: string;
  svg?: string;
  logs?: { stdout: string[]; stderr: string[] };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, datasetUrl, experimentId } = body;

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
        let verifyResult: E2BResult | null = null;

        // If dataset URL is provided, download and save it as a CSV file
        if (datasetUrl) {
          let csvContent = "";

          // Download the dataset content
          if (datasetUrl.startsWith("data:")) {
            // Handle data URL (base64 encoded)
            const base64Data = datasetUrl.split(",")[1];
            csvContent = Buffer.from(base64Data, "base64").toString("utf-8");
          } else if (datasetUrl.startsWith("/sample-data/") || datasetUrl.startsWith("sample-data/")) {
            // Handle local sample dataset file
            const filePath = path.join(process.cwd(), "src/lib", datasetUrl);
            csvContent = await fs.readFile(filePath, "utf-8");
          } else {
            // Handle regular URL or relative path
            let fullUrl = datasetUrl;

            // If it's a relative path (starts with /), construct the full URL
            if (datasetUrl.startsWith("/")) {
              // Get the base URL from the request
              const host = request.headers.get("host") || "localhost:3000";
              const protocol = request.headers.get("x-forwarded-proto") || "http";
              fullUrl = `${protocol}://${host}${datasetUrl}`;
            }

            const response = await fetch(fullUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch dataset from ${fullUrl}: ${response.statusText}`);
            }
            csvContent = await response.text();
          }

          // Write the CSV file to the sandbox filesystem (in the working directory)
          await sandbox.files.write("data.csv", csvContent);

          // Verify the dataset file is accessible before running user code
          verifyResult = await sandbox.runCode(`
import pandas as pd
import os

if os.path.exists('data.csv'):
    df_temp = pd.read_csv('data.csv')
    print(f"Dataset loaded: {df_temp.shape[0]} rows, {df_temp.shape[1]} columns")
    del df_temp
else:
    raise FileNotFoundError("data.csv not found in sandbox")
`);
        }

        // Execute the user code
        const execution = await sandbox.runCode(code);

        // Collect results
        let output = "";

        // Include verification output if dataset was loaded
        if (datasetUrl && verifyResult) {
          const verifyStdout = verifyResult.logs?.stdout?.join("\n") || "";
          if (verifyStdout) {
            output += verifyStdout + "\n\n" + "=".repeat(50) + "\n\n";
          }
        }

        // Capture stdout from execution (print statements)
        const stdout = execution.logs?.stdout?.join("\n") || "";
        const stderr = execution.logs?.stderr?.join("\n") || "";

        // Combine stdout, stderr, and text (last expression value)
        output += stdout;
        if (stderr) {
          output += "\n" + stderr;
        }
        // Add the text output (last expression value) if it exists and is different from stdout
        if (execution.text && execution.text !== stdout.trim()) {
          output += "\n" + execution.text;
        }

        const hasError = execution.error !== null && execution.error !== undefined;

        // Get any plots/visualizations
        const charts = (execution.results || [])
          .filter((result: E2BResult) => result.png || result.svg)
          .map((result: E2BResult) => ({
            type: result.png ? "png" : "svg",
            data: result.png || result.svg,
          }));

        // Persist execution to DB if experimentId provided
        if (experimentId) {
          try {
            const database = db();
            if (database) {
              await database.insert(executions).values({
                experimentId,
                code,
                status: hasError ? "failed" : "completed",
                output: output,
                results: { output },
                visualizations: charts,
              });
            }
          } catch (dbError) {
            // Non-fatal: log but don't fail the execution response
            console.error("Failed to save execution to DB:", dbError);
          }
        }

        return NextResponse.json({
          status: hasError ? "error" : "success",
          output: output,
          error: execution.error?.value || execution.error?.name || null,
          charts,
          logs: execution.logs || [],
        });
      } catch (error: unknown) {
        throw error;
      } finally {
        // Always kill the sandbox (use kill() in E2B v1.5.x)
        await sandbox.kill();
      }
    } catch (e2bError: unknown) {
      console.error("E2B execution error:", e2bError);
      const e2bMessage = e2bError instanceof Error ? e2bError.message : "Unknown E2B error";
      return NextResponse.json({
        status: "error",
        output: `Failed to execute code: ${e2bMessage}\n\nThis might be due to E2B configuration issues. Please check your API key and network connection.`,
        error: e2bMessage,
        charts: [],
        logs: [],
      });
    }
  } catch (error: unknown) {
    console.error("Execution error:", error);
    const message = error instanceof Error ? error.message : "Failed to execute code";
    return NextResponse.json(
      {
        error: message,
        status: "error",
      },
      { status: 500 }
    );
  }
}

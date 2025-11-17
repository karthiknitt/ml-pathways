import { NextRequest, NextResponse } from "next/server";

// POST /api/datasets/upload - Handle file upload
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "Only CSV files are supported" },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();
    const lines = fileContent.split("\n");

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "File must contain headers and at least one data row" },
        { status: 400 }
      );
    }

    // Parse CSV headers
    const headers = lines[0].split(",").map((h) => h.trim());
    const rowCount = lines.length - 1; // Exclude header row

    // Parse a few sample rows for preview
    const previewRows = lines.slice(1, Math.min(6, lines.length)).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || "";
      });
      return row;
    });

    // In production, you would upload to R2/S3 here
    // For now, we'll return a data URL or store in DB directly
    const dataUrl = `data:text/csv;base64,${Buffer.from(fileContent).toString("base64")}`;

    return NextResponse.json({
      success: true,
      fileUrl: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      columnInfo: {
        columns: headers,
        count: headers.length,
      },
      rowCount,
      preview: previewRows,
    });
  } catch (error: any) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}

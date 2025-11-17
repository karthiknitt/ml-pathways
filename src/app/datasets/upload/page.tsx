"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UploadDatasetPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [datasetName, setDatasetName] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
      if (!datasetName) {
        setDatasetName(selectedFile.name.replace(".csv", ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    if (!datasetName.trim()) {
      setError("Please provide a dataset name");
      return;
    }

    setUploading(true);
    setError("");

    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch("/api/datasets/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || "Failed to upload file");
      }

      const uploadData = await uploadResponse.json();
      setPreview(uploadData);

      // Step 2: Create dataset record
      const createResponse = await fetch("/api/datasets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: datasetName,
          description,
          source: "uploaded",
          fileUrl: uploadData.fileUrl,
          fileName: uploadData.fileName,
          fileSize: uploadData.fileSize,
          columnInfo: uploadData.columnInfo,
          rowCount: uploadData.rowCount,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to save dataset");
      }

      const { dataset } = await createResponse.json();

      // Success! Redirect to datasets page
      router.push("/datasets");
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload dataset");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Upload Dataset</h1>
        <p className="text-gray-600">Upload a CSV file to use in your ML experiments</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dataset Details</CardTitle>
            <CardDescription>Provide information about your dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="mt-1"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="name">Dataset Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Housing Prices 2024"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                type="text"
                placeholder="Brief description of your dataset"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload Dataset"}
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/datasets")}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>Dataset information and preview</CardDescription>
          </CardHeader>
          <CardContent>
            {preview ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Columns:</p>
                    <p className="font-medium">{preview.columnInfo.count}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Rows:</p>
                    <p className="font-medium">{preview.rowCount}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Columns:</p>
                  <div className="flex flex-wrap gap-1">
                    {preview.columnInfo.columns.map((col: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Sample Data:</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border">
                      <thead>
                        <tr className="bg-gray-100">
                          {preview.columnInfo.columns.map((col: string, idx: number) => (
                            <th key={idx} className="border p-2 text-left">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.preview.slice(0, 3).map((row: any, rowIdx: number) => (
                          <tr key={rowIdx}>
                            {preview.columnInfo.columns.map((col: string, colIdx: number) => (
                              <td key={colIdx} className="border p-2">
                                {row[col]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">
                  File uploaded successfully! Click &quot;Upload Dataset&quot; to save.
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">📊</div>
                <p>Upload a file to see preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Only CSV files are supported</li>
            <li>• First row must contain column headers</li>
            <li>• Ensure data is clean and properly formatted</li>
            <li>• Missing values should be empty or marked consistently</li>
            <li>• Maximum file size: 50MB</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

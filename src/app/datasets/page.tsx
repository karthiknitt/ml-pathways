"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ML_PROBLEMS } from "@/lib/constants/ml-problems";

const sampleDatasets = ML_PROBLEMS.map((p) => ({
  name: p.name,
  description: p.sampleDatasetDescription,
  category: p.category.charAt(0).toUpperCase() + p.category.slice(1).replace(/_/g, " "),
  type: p.id,
  difficulty: p.difficulty,
  icon: p.icon,
}));

type Dataset = {
  id: string;
  name: string;
  description: string | null;
  source: "sample" | "uploaded";
  fileName: string | null;
  fileSize: number | null;
  rowCount: number | null;
  createdAt: string;
};

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const response = await fetch("/api/datasets");
      if (!response.ok) throw new Error("Failed to fetch datasets");
      const data = await response.json();
      setDatasets(data.datasets || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch datasets");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDataset = async (id: string, name: string) => {
    if (!confirm(`Delete dataset "${name}"? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/datasets/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete dataset");
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (bytes == null) return "N/A";
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const uploadedDatasets = datasets.filter((d) => d.source === "uploaded");

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading datasets...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Datasets</h1>
          <p className="text-gray-600">Manage your uploaded datasets and access sample datasets</p>
        </div>
        <Button asChild>
          <Link href="/datasets/upload">Upload New Dataset</Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Datasets ({uploadedDatasets.length})</CardTitle>
            <CardDescription>Datasets you have uploaded for experimentation</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedDatasets.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">📁</div>
                <p className="text-lg mb-2">No datasets uploaded yet</p>
                <p className="text-sm mb-4">Upload a CSV file to start experimenting with your own data</p>
                <Button asChild>
                  <Link href="/datasets/upload">Upload Your First Dataset</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {uploadedDatasets.map((dataset) => (
                  <div
                    key={dataset.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{dataset.name}</h3>
                        {dataset.description && (
                          <p className="text-sm text-gray-600 mb-2">{dataset.description}</p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          {dataset.fileName && <span>File: {dataset.fileName}</span>}
                          <span>Size: {formatFileSize(dataset.fileSize)}</span>
                          {dataset.rowCount != null && <span>Rows: {dataset.rowCount}</span>}
                          <span>Uploaded: {formatDate(dataset.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button asChild size="sm" variant="outline">
                          <Link href="/problems">Choose Problem Type</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteDataset(dataset.id, dataset.name)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Datasets</CardTitle>
            <CardDescription>Pre-loaded datasets for each ML problem type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {sampleDatasets.map((sample) => (
                <div key={sample.type} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{sample.icon} {sample.name}</h3>
                    <div className="flex gap-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        sample.category.toLowerCase().includes("regression")
                          ? "bg-blue-100 text-blue-700"
                          : sample.category.toLowerCase().includes("classification")
                          ? "bg-green-100 text-green-700"
                          : sample.category.toLowerCase().includes("clustering")
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}>
                        {sample.category}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {sample.difficulty}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{sample.description}</p>
                  <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/problems/${sample.type}`}>Use This Dataset</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

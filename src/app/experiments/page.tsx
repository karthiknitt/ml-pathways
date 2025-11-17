"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Experiment = {
  id: string;
  name: string;
  description: string | null;
  problemType: string;
  createdAt: string;
  updatedAt: string;
  dataset: {
    id: string;
    name: string;
  } | null;
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    try {
      const response = await fetch("/api/experiments");
      if (!response.ok) throw new Error("Failed to fetch experiments");
      const data = await response.json();
      setExperiments(data.experiments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatProblemType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Loading experiments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">My Experiments</h1>
          <p className="text-gray-600">Track and manage your ML experiments</p>
        </div>
        <Button asChild>
          <Link href="/problems">Start New Experiment</Link>
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
            <CardTitle>All Experiments ({experiments.length})</CardTitle>
            <CardDescription>Your machine learning experiments</CardDescription>
          </CardHeader>
          <CardContent>
            {experiments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-5xl mb-4">🔬</div>
                <p className="text-lg mb-2">No experiments yet</p>
                <p className="text-sm mb-4">Start a new experiment by choosing an ML problem</p>
                <Button asChild>
                  <Link href="/problems">Browse ML Problems</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {experiments.map((experiment) => (
                  <div
                    key={experiment.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                          {experiment.name}
                        </h3>
                        {experiment.description && (
                          <p className="text-sm text-gray-600 mb-2">
                            {experiment.description}
                          </p>
                        )}
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {formatProblemType(experiment.problemType)}
                          </span>
                          {experiment.dataset && (
                            <span>Dataset: {experiment.dataset.name}</span>
                          )}
                          <span>Created: {formatDate(experiment.createdAt)}</span>
                        </div>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/workspace/${experiment.id}`}>
                          Open Workspace
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

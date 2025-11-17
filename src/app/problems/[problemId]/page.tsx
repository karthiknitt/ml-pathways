"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { getProblemById } from "@/lib/constants/ml-problems";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface ProblemPageProps {
  params: Promise<{
    problemId: string;
  }>;
}

export default function ProblemPage({ params }: ProblemPageProps) {
  const { problemId } = use(params);
  const router = useRouter();
  const problem = getProblemById(problemId as any);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [experimentName, setExperimentName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!problem) {
    return <div className="container mx-auto px-4 py-8"><p>Problem not found</p></div>;
  }

  const handleCreateExperiment = async (datasetType: "sample" | "upload") => {
    if (datasetType === "upload") {
      router.push("/datasets/upload");
      return;
    }

    setShowCreateDialog(true);
  };

  const handleConfirmCreate = async () => {
    if (!experimentName.trim()) {
      alert("Please enter an experiment name");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/experiments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: experimentName,
          description: `Experiment for ${problem.name}`,
          problemType: problem.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create experiment");
      }

      if (!data.experiment) {
        throw new Error("No experiment data returned");
      }

      router.push(`/workspace/${data.experiment.id}`);
    } catch (error: any) {
      console.error("Create experiment error:", error);
      alert(`Failed to create experiment: ${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-5xl">{problem.icon}</span>
          <div>
            <h1 className="text-4xl font-bold">{problem.name}</h1>
            <p className="text-gray-600 mt-1">{problem.description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {problem.category.replace("_", " ")}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            {problem.difficulty}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Choose Your Dataset</CardTitle>
            <CardDescription>Start with a sample dataset or upload your own</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Sample Dataset</h3>
              <p className="text-sm text-gray-600 mb-3">{problem.sampleDatasetDescription}</p>
              <Button className="w-full" onClick={() => handleCreateExperiment("sample")}>
                Use Sample Dataset
              </Button>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Upload Your Own</h3>
              <p className="text-sm text-gray-600 mb-3">
                Bring your own CSV file to experiment with
              </p>
              <Button variant="outline" className="w-full" onClick={() => handleCreateExperiment("upload")}>
                Upload Dataset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What You Will Learn</CardTitle>
            <CardDescription>Key concepts and skills</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="concepts">Concepts</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-3 mt-4">
                <p className="text-sm text-gray-700">
                  This problem will teach you the fundamentals of {problem.name.toLowerCase()}.
                  You will work with real data, understand the underlying mathematics, and implement
                  the algorithm from scratch.
                </p>
              </TabsContent>
              <TabsContent value="concepts" className="space-y-2 mt-4">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Data preprocessing and feature engineering</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Model training and evaluation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Performance metrics and visualization</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Hyperparameter tuning</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="workflow" className="space-y-2 mt-4">
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>Load and explore your dataset</li>
                  <li>Chat with AI for data insights</li>
                  <li>Generate Python code</li>
                  <li>Execute in safe sandbox</li>
                  <li>Visualize and interpret results</li>
                  <li>Iterate and improve</li>
                </ol>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Ready to Start?</CardTitle>
          <CardDescription>
            Choose a dataset above to begin your experiment with {problem.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/problems">Browse Other Problems</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Experiment</CardTitle>
              <CardDescription>Give your experiment a name to get started</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="expName">Experiment Name</Label>
                <Input
                  id="expName"
                  placeholder={`My ${problem.name} Experiment`}
                  value={experimentName}
                  onChange={(e) => setExperimentName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleConfirmCreate} disabled={creating} className="flex-1">
                  {creating ? "Creating..." : "Create Experiment"}
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { getProblemById } from "@/lib/constants/ml-problems";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

interface ProblemPageProps {
  params: Promise<{
    problemId: string;
  }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { problemId } = await params;
  const problem = getProblemById(problemId as any);

  if (!problem) {
    notFound();
  }

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
              <Button className="w-full">Use Sample Dataset</Button>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold mb-2">Upload Your Own</h3>
              <p className="text-sm text-gray-600 mb-3">
                Bring your own CSV file to experiment with
              </p>
              <Button variant="outline" className="w-full">
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
    </div>
  );
}

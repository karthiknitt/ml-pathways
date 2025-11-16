import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ML_PROBLEMS } from "@/lib/constants/ml-problems";
import Link from "next/link";

export default function ProblemsPage() {
  const beginnerProblems = ML_PROBLEMS.filter((p) => p.difficulty === "beginner");
  const intermediateProblems = ML_PROBLEMS.filter((p) => p.difficulty === "intermediate");
  const advancedProblems = ML_PROBLEMS.filter((p) => p.difficulty === "advanced");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">ML Problems</h1>
        <p className="text-gray-600">
          Choose a machine learning problem to start your experiment. Each problem comes with sample datasets and guided assistance.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-green-500">●</span> Beginner
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {beginnerProblems.map((problem) => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{problem.icon}</div>
                  <CardTitle>{problem.name}</CardTitle>
                  <CardDescription>{problem.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Sample dataset:</span>
                      <br />
                      {problem.sampleDatasetDescription}
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/problems/${problem.id}`}>Start Experiment</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-yellow-500">●</span> Intermediate
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {intermediateProblems.map((problem) => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{problem.icon}</div>
                  <CardTitle>{problem.name}</CardTitle>
                  <CardDescription>{problem.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Sample dataset:</span>
                      <br />
                      {problem.sampleDatasetDescription}
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/problems/${problem.id}`}>Start Experiment</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <span className="text-red-500">●</span> Advanced
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {advancedProblems.map((problem) => (
              <Card key={problem.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-4xl mb-2">{problem.icon}</div>
                  <CardTitle>{problem.name}</CardTitle>
                  <CardDescription>{problem.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold">Sample dataset:</span>
                      <br />
                      {problem.sampleDatasetDescription}
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/problems/${problem.id}`}>Start Experiment</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

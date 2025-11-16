import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            ML Pathways
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Interactive Machine Learning Platform - Explore foundational ML problems through hands-on experimentation
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Learn by Doing
            </h3>
            <p className="text-gray-600">
              Hands-on workflow with real datasets and live code execution
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Guidance
            </h3>
            <p className="text-gray-600">
              Chat with an intelligent agent for EDA, Q&A, and code generation
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Safe Experimentation
            </h3>
            <p className="text-gray-600">
              Sandboxed execution environment with instant feedback
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Multiple ML Problems
            </h3>
            <p className="text-gray-600">
              Linear regression, logistic regression, neural networks, and more
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Visual Results
            </h3>
            <p className="text-gray-600">
              Interactive charts and graphs to understand your models
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Custom Datasets
            </h3>
            <p className="text-gray-600">
              Upload your own data or use curated sample datasets
            </p>
          </div>
        </div>

        <div className="text-center mt-16 space-x-4">
          <Button size="lg" asChild>
            <Link href="/problems">Browse ML Problems</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

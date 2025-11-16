import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ExperimentsPage() {
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Experiments</CardTitle>
            <CardDescription>Experiments currently in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">🔬</div>
              <p className="text-lg mb-2">No active experiments</p>
              <p className="text-sm mb-4">Start a new experiment by choosing an ML problem</p>
              <Button asChild>
                <Link href="/problems">Browse ML Problems</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Experiments</CardTitle>
            <CardDescription>Successfully finished experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No completed experiments yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

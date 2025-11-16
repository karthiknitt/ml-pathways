import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DatasetsPage() {
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

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Datasets</CardTitle>
            <CardDescription>Datasets you have uploaded for experimentation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <div className="text-5xl mb-4">📁</div>
              <p className="text-lg mb-2">No datasets uploaded yet</p>
              <p className="text-sm mb-4">Upload a CSV file to start experimenting with your own data</p>
              <Button asChild>
                <Link href="/datasets/upload">Upload Your First Dataset</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Datasets</CardTitle>
            <CardDescription>Pre-loaded datasets for each ML problem type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">Housing Prices</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Regression</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Predict housing prices based on size, rooms, and location
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Use This Dataset
                </Button>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold">University Admissions</h3>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Classification</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Binary classification for admission prediction
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  Use This Dataset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

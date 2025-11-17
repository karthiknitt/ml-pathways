"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    experiments: 0,
    datasets: 0,
    loading: true,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [experimentsRes, datasetsRes] = await Promise.all([
        fetch("/api/experiments"),
        fetch("/api/datasets"),
      ]);

      const experimentsData = await experimentsRes.json();
      const datasetsData = await datasetsRes.json();

      setStats({
        experiments: experimentsData.experiments?.length || 0,
        datasets: datasetsData.datasets?.length || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStats({ experiments: 0, datasets: 0, loading: false });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Continue your ML learning journey.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Experiments</CardTitle>
            <CardDescription>All your ML experiments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.loading ? "..." : stats.experiments}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats.experiments === 0
                ? "No experiments yet"
                : `${stats.experiments} experiment${stats.experiments > 1 ? "s" : ""} created`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datasets</CardTitle>
            <CardDescription>Your uploaded datasets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.loading ? "..." : stats.datasets}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {stats.datasets === 0
                ? "Upload your first dataset"
                : `${stats.datasets} dataset${stats.datasets > 1 ? "s" : ""} available`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ML Problems</CardTitle>
            <CardDescription>Available problem types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">9</div>
            <p className="text-sm text-gray-600 mt-2">From beginner to advanced</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with ML Pathways</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" asChild>
              <Link href="/problems">
                <span className="mr-2">🎯</span>
                Choose an ML Problem
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/datasets/upload">
                <span className="mr-2">📤</span>
                Upload a Dataset
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/experiments">
                <span className="mr-2">🔬</span>
                View All Experiments
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Learn how to use ML Pathways</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-lg">1️⃣</span>
                <p>Choose an ML problem from the problems page</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">2️⃣</span>
                <p>Upload your own dataset or use a sample dataset</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">3️⃣</span>
                <p>Chat with AI to explore data and generate code</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-lg">4️⃣</span>
                <p>Execute code and visualize results</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

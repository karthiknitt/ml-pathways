"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-xl">ML Pathways</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/problems"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            ML Problems
          </Link>
          <Link
            href="/datasets"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Datasets
          </Link>
          <Link
            href="/experiments"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            My Experiments
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="outline" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

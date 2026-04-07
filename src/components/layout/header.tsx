"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "@/lib/auth-client";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/problems", label: "ML Problems" },
  { href: "/datasets", label: "Datasets" },
  { href: "/experiments", label: "My Experiments" },
];

export function Header() {
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <header className="border-b bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center space-x-2"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="text-2xl">🧠</span>
          <span className="font-bold text-xl">ML Pathways</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2">
          {isPending ? (
            <div className="w-20 h-9 bg-gray-100 animate-pulse rounded" />
          ) : session ? (
            <>
              <span className="text-sm text-gray-600 hidden md:inline">
                {session.user?.name || session.user?.email}
              </span>
              <Button
                variant="outline"
                onClick={handleSignOut}
                className="hidden md:inline-flex"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                asChild
                className="hidden md:inline-flex"
              >
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex">
                <Link href="/signup">Get Started</Link>
              </Button>
            </>
          )}

          {/* Theme toggle button */}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? "☀️" : "🌙"}
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {mounted && (
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 py-2"
              aria-label="Toggle theme"
            >
              <span>{resolvedTheme === "dark" ? "☀️" : "🌙"}</span>
              <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
          )}
          <div className="pt-2 border-t dark:border-gray-800 space-y-2">
            {session ? (
              <>
                <p className="text-sm text-gray-500">
                  {session.user?.name || session.user?.email}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

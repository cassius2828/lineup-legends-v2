"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: profile } = api.profile.getMe.useQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="border-foreground/20 border-t-gold mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4" />
            <p className="text-foreground/60">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="from-surface-950 via-surface-800 to-surface-950 min-h-screen bg-gradient-to-b">
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {profile && (
            <Link
              href={`/profile/${profile.id}`}
              className="text-foreground/60 hover:text-foreground/80 mb-2 inline-flex items-center gap-1 text-sm"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Profile
            </Link>
          )}
          <h1 className="text-foreground text-3xl font-bold">Settings</h1>
          <p className="text-foreground/60 mt-1">Manage your preferences</p>
        </div>

        {/* Display Section */}
        <section className="border-foreground/10 bg-surface-800 rounded-2xl border p-6">
          <h2 className="text-foreground mb-1 text-lg font-semibold">
            Display
          </h2>
          <p className="text-foreground/50 mb-6 text-sm">
            Choose your preferred appearance
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-foreground font-medium">Theme</p>
              <p className="text-foreground/50 text-sm">
                Select light or dark mode
              </p>
            </div>

            {/* Theme Toggle */}
            <div className="border-foreground/10 bg-surface-700 flex items-center gap-1 rounded-full border p-1">
              <button
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  theme === "dark"
                    ? "bg-foreground/10 text-foreground shadow-sm"
                    : "text-foreground/50 hover:text-foreground/70"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
                Dark
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  theme === "light"
                    ? "bg-foreground/10 text-foreground shadow-sm"
                    : "text-foreground/50 hover:text-foreground/70"
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                Light
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
